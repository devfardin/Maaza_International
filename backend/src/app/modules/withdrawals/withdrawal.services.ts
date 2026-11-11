import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import config from '../../config';
import { BDT } from '../../config/constants';
import { sendEmail } from '../../utils/sendEmail';
import { escapeHtml } from '../../utils/escapeHtml';
import { UserModel } from '../users/user.model';
import { PaymentAccountsModel } from '../paymentAccounts/paymentAccounts.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { NotificationServices } from '../notifications/notification.services';
import { WithdrawalModel, TWithdrawalStatus } from './withdrawal.model';

const MIN_WITHDRAWAL = 100 * BDT;
const MAX_PENDING = 5;

const formatBDT = (poisha: number) => `৳${(poisha / BDT).toFixed(2)}`;

// ─── User: request a withdrawal ───────────────────────────────────────────────
// The amount is moved out of the balance wallet immediately (so the same money
// can't be requested twice). If an admin rejects it, it is refunded.
const createWithdrawal = async (userId: string, payload: { amount: number; paymentAccountId: string }) => {
    const user = await UserModel.findById(userId);
    if (!user || user.isDeleted) throw new AppError(status.NOT_FOUND, 'User not found!');
    if (user.role !== 'user') throw new AppError(status.FORBIDDEN, 'Only users can request withdrawals!');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, 'Your account is not allowed to withdraw. Contact support.');

    const amount = Math.round(payload.amount * BDT);
    if (!Number.isInteger(amount) || amount < MIN_WITHDRAWAL) {
        throw new AppError(status.BAD_REQUEST, 'Minimum withdrawal is 100 BDT');
    }

    if (!Types.ObjectId.isValid(payload.paymentAccountId)) {
        throw new AppError(status.BAD_REQUEST, 'Invalid payout account');
    }
    const account = await PaymentAccountsModel.findOne({ _id: payload.paymentAccountId, userId });
    if (!account) throw new AppError(status.NOT_FOUND, 'Payout account not found. Add a bKash or Nagad account first.');

    const pending = await WithdrawalModel.countDocuments({ userId, status: 'pending' });
    if (pending >= MAX_PENDING) {
        throw new AppError(status.TOO_MANY_REQUESTS, `You already have ${MAX_PENDING} pending withdrawals. Please wait for review.`);
    }

    const session = await mongoose.startSession();
    let withdrawal;
    try {
        session.startTransaction();

        const wallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: 'balance', isActive: true, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true, session }
        );
        if (!wallet) {
            throw new AppError(status.BAD_REQUEST, 'Insufficient balance for this withdrawal');
        }

        const [created] = await WithdrawalModel.create(
            [{
                userId,
                amount,
                currency: 'BDT',
                method: account.method,
                accountNumber: account.accountNumber,
                accountHolderName: account.accountHolderName,
                status: 'pending',
            }],
            { session }
        );
        withdrawal = created;

        await TransactionServices.recordTransaction({
            userId,
            type: 'withdrawal',
            flow: 'debit',
            amount,
            walletAffected: 'balance',
            balanceAfter: wallet.balance,
            note: `Withdrawal request to ${account.method === 'bkash' ? 'bKash' : 'Nagad'} ${account.accountNumber}`,
            referenceId: withdrawal._id as Types.ObjectId,
            session,
        });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    // Side effects after commit — they must never fail the request
    if (user.email) {
        sendEmail({
            to: user.email,
            subject: 'Withdrawal Request Received — Maaza International',
            heading: 'We received your withdrawal request',
            subheading: `${formatBDT(amount)} is being reviewed.`,
            body: `
                <p>Hi <strong>${escapeHtml(user.fullName)}</strong>,</p>
                <p>Your withdrawal of <strong>${formatBDT(amount)}</strong> to
                ${account.method === 'bkash' ? 'bKash' : 'Nagad'} number <strong>${escapeHtml(account.accountNumber)}</strong>
                has been submitted.</p>
                <p>Request ID: ${withdrawal._id.toString()}</p>
                <p>The amount has been moved out of your balance and will be paid once an admin approves it.</p>
            `,
            button: { label: 'View Withdrawals', url: `${config.frontend_url}/dashboard/withdrawals` },
        }).catch((err) => console.error('Withdrawal request email failed', err));
    }

    NotificationServices.notifyAdmins({
        type: 'withdrawal_request',
        title: 'New withdrawal request',
        message: `${user.fullName} requested a withdrawal of ${formatBDT(amount)} to ${account.method === 'bkash' ? 'bKash' : 'Nagad'} ${account.accountNumber}`,
        actorId: user._id as Types.ObjectId,
        actorName: user.fullName,
        actorPhone: user.phone,
        amount,
        referenceId: withdrawal._id as Types.ObjectId,
    });

    return withdrawal;
};

// ─── User: own withdrawals ────────────────────────────────────────────────────
const getMyWithdrawals = async (userId: string) => {
    return WithdrawalModel.find({ userId }).sort({ createdAt: -1 });
};

// ─── Admin: all withdrawals ───────────────────────────────────────────────────
const getAllWithdrawals = async (filter: { status?: TWithdrawalStatus } = {}) => {
    return WithdrawalModel.find(filter.status ? { status: filter.status } : {})
        .populate('userId', 'fullName email phone')
        .populate('processedBy', 'fullName')
        .sort({ createdAt: -1 });
};

// ─── Admin: approve (paid out) or reject (refund) ─────────────────────────────
const updateWithdrawalStatus = async (
    id: string,
    payload: { status: 'approved' | 'rejected'; adminNote?: string; payoutReference?: string },
    adminId: string
) => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(status.BAD_REQUEST, 'Invalid withdrawal id');

    const session = await mongoose.startSession();
    let updated;
    try {
        session.startTransaction();

        // Only a pending request can be decided, and only once
        updated = await WithdrawalModel.findOneAndUpdate(
            { _id: id, status: 'pending' },
            {
                status: payload.status,
                adminNote: payload.adminNote ?? '',
                payoutReference: payload.payoutReference ?? '',
                processedBy: adminId,
                processedAt: new Date(),
            },
            { new: true, session }
        );

        if (!updated) {
            const existing = await WithdrawalModel.findById(id).session(session);
            if (!existing) throw new AppError(status.NOT_FOUND, 'Withdrawal request not found!');
            throw new AppError(status.BAD_REQUEST, `This withdrawal has already been ${existing.status}!`);
        }

        if (payload.status === 'rejected') {
            const wallet = await WalletModel.findOneAndUpdate(
                { userId: updated.userId, walletType: 'balance' },
                { $inc: { balance: updated.amount } },
                { new: true, session }
            );
            if (!wallet) throw new AppError(status.NOT_FOUND, 'User balance wallet not found!');

            await TransactionServices.recordTransaction({
                userId: updated.userId,
                type: 'withdrawal_refund',
                flow: 'credit',
                amount: updated.amount,
                walletAffected: 'balance',
                balanceAfter: wallet.balance,
                note: 'Withdrawal rejected — amount returned to balance',
                referenceId: updated._id as Types.ObjectId,
                session,
            });
        }

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    const user = await UserModel.findById(updated.userId);
    if (user?.email) {
        const approved = payload.status === 'approved';
        sendEmail({
            to: user.email,
            subject: approved
                ? 'Withdrawal Approved — Maaza International'
                : 'Withdrawal Rejected — Maaza International',
            heading: approved ? 'Your withdrawal has been approved' : 'Your withdrawal was rejected',
            subheading: `${formatBDT(updated.amount)}`,
            body: approved
                ? `<p>Hi <strong>${escapeHtml(user.fullName)}</strong>, your withdrawal of <strong>${formatBDT(updated.amount)}</strong> has been approved and sent to ${updated.method === 'bkash' ? 'bKash' : 'Nagad'} ${escapeHtml(updated.accountNumber)}.</p>
                   ${updated.payoutReference ? `<p>Payout reference: ${escapeHtml(updated.payoutReference)}</p>` : ''}`
                : `<p>Hi <strong>${escapeHtml(user.fullName)}</strong>, your withdrawal of <strong>${formatBDT(updated.amount)}</strong> was rejected. The amount has been returned to your balance.</p>
                   ${updated.adminNote ? `<p>Reason: ${escapeHtml(updated.adminNote)}</p>` : ''}`,
            button: { label: 'Open Withdrawals', url: `${config.frontend_url}/dashboard/withdrawals` },
        }).catch((err) => console.error('Withdrawal decision email failed', err));
    }

    return updated;
};

export const WithdrawalServices = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus,
};
