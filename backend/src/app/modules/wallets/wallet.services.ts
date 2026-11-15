import { isMoneyAmount, moneyIncrement, moneyText, roundMoney } from '../../utils/money';
import status from 'http-status';
import mongoose, { ClientSession } from 'mongoose';
import AppError from '../../errors/AppError';
import { TWalletType } from './wallet.interface';
import { WalletModel } from './wallet.model';
import { UserModel } from '../users/user.model';
import { TransactionServices } from '../transactions/transaction.services';
import { RealtimeServices } from '../realtime/realtime.services';

const WALLET_LABEL: Record<TWalletType, string> = {
    balance: 'Balance wallet',
    recharge: 'Recharge wallet',
};

// Called inside user registration transaction — not exposed as an API
const createWalletsForUser = async (userId: mongoose.Types.ObjectId, session: ClientSession) => {
    const wallets = await WalletModel.insertMany(
        [
            { userId, walletType: 'recharge', balance: 0, currency: 'BDT', isActive: true },
            { userId, walletType: 'balance', balance: 0, currency: 'BDT', isActive: true },
        ],
        { session }
    );

    if (wallets.length !== 2) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to create user wallets');
    }
    return wallets;
};

const getUserWallets = async (userId: string) => {
    const wallets = await WalletModel.find({ userId });

    if (!wallets.length) {
        throw new AppError(status.NOT_FOUND, 'Wallets not found for this user');
    }

    const recharge = wallets.find((w) => w.walletType === 'recharge');
    const balance = wallets.find((w) => w.walletType === 'balance');

    return {
        rechargeWallet: {
            balance: recharge?.balance ?? 0,
            formattedBalance: Number(recharge?.balance ?? 0).toFixed(2),
            currency: recharge?.currency ?? 'BDT',
        },
        balanceWallet: {
            balance: balance?.balance ?? 0,
            formattedBalance: Number(balance?.balance ?? 0).toFixed(2),
            currency: balance?.currency ?? 'BDT',
        },
    };
};

const getWalletByType = async (userId: string, walletType: TWalletType) => {

    const wallet = await WalletModel.findOne({ userId, walletType });

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }
    return wallet;
};

const validateWallet = async (userId: string, walletType: TWalletType, session?: ClientSession) => {
    const wallet = await WalletModel.findOne({ userId, walletType }).session(session ?? null);

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }

    if (!wallet.isActive) {
        throw new AppError(status.FORBIDDEN, `${walletType} wallet is inactive`);
    }

    return wallet;
};

// Amount must be a positive amount in BDT (up to 2 decimals)
const creditWallet = async (
    userId: string,
    walletType: TWalletType,
    amount: number,
    session: ClientSession
) => {
    if (!isMoneyAmount(amount) || amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Amount must be a positive amount in BDT');
    }

    await validateWallet(userId, walletType, session);

    const updated = await WalletModel.findOneAndUpdate(
        { userId, walletType },
        moneyIncrement('balance', amount),
        { new: true, session, runValidators: true }
    );

    if (!updated) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to credit wallet');
    }

    return updated;
};

const debitWallet = async (
    userId: string,
    walletType: TWalletType,
    amount: number,
    session: ClientSession
) => {
    if (!isMoneyAmount(amount) || amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Amount must be a positive amount in BDT');
    }

    const wallet = await validateWallet(userId, walletType, session);

    if (wallet.balance < amount) {
        throw new AppError(status.BAD_REQUEST, 'Insufficient wallet balance');
    }

    // Atomic conditional update — prevents concurrent overspend
    const updated = await WalletModel.findOneAndUpdate(
        { userId, walletType, balance: { $gte: amount } },
        moneyIncrement('balance', -amount),
        { new: true, session, runValidators: true }
    );

    if (!updated) {
        throw new AppError(status.BAD_REQUEST, 'Insufficient wallet balance');
    }

    return updated;
};

const checkBalance = async (userId: string, walletType: TWalletType) => {
    const wallet = await WalletModel.findOne({ userId, walletType });

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }

    return wallet.balance;
};

// Moves money between a member's two wallets. Both sides change in one database
// transaction, so money can't be lost or duplicated if something fails halfway.
const exchangeWallets = async (userId: string, payload: { from: TWalletType; to: TWalletType; amount: number }) => {
    if (payload.from === payload.to) {
        throw new AppError(status.BAD_REQUEST, 'Choose two different wallets');
    }
    const amount = roundMoney(payload.amount);
    if (!isMoneyAmount(amount) || amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Amount must be a positive amount in BDT');
    }

    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found!');
    if (user.role !== 'user') throw new AppError(status.BAD_REQUEST, 'Wallet exchange is only for member accounts');

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Conditional debit: fails if the source wallet doesn't hold enough
        const source = await WalletModel.findOneAndUpdate(
            { userId, walletType: payload.from, isActive: true, balance: { $gte: amount } },
            moneyIncrement('balance', -amount),
            { new: true, session }
        );
        if (!source) {
            throw new AppError(status.BAD_REQUEST, `Insufficient balance in the ${WALLET_LABEL[payload.from]}`);
        }

        const target = await WalletModel.findOneAndUpdate(
            { userId, walletType: payload.to, isActive: true },
            moneyIncrement('balance', amount),
            { new: true, session }
        );
        if (!target) {
            throw new AppError(status.NOT_FOUND, `${WALLET_LABEL[payload.to]} not found or inactive`);
        }

        await TransactionServices.recordTransaction({
            userId,
            type: 'wallet_exchange',
            flow: 'debit',
            amount,
            walletAffected: payload.from,
            balanceAfter: source.balance,
            note: `Wallet exchange: ${moneyText(amount)} moved to ${WALLET_LABEL[payload.to]}`,
            session,
        });
        await TransactionServices.recordTransaction({
            userId,
            type: 'wallet_exchange',
            flow: 'credit',
            amount,
            walletAffected: payload.to,
            balanceAfter: target.balance,
            note: `Wallet exchange: ${moneyText(amount)} received from ${WALLET_LABEL[payload.from]}`,
            session,
        });

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    RealtimeServices.notifyUser(userId, ['Wallet', 'Transactions']);
    RealtimeServices.notifyAdmins(['Wallet', 'Transactions']);

    return getUserWallets(userId);
};

export const WalletServices = {
    createWalletsForUser,
    getUserWallets,
    exchangeWallets,
    getWalletByType,
    creditWallet,
    debitWallet,
    checkBalance,
    validateWallet,
};
