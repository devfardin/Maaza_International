import crypto from 'crypto';
import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { isMoneyAmount, moneyIncrement, roundMoney } from '../../utils/money';
import { UserModel } from '../users/user.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { RealtimeServices } from '../realtime/realtime.services';
import { RedeemClaimModel, RedeemCodeModel, TRedeemCode } from './redeemCode.model';

type TActor = { userId: string; fullName?: string; role: string };

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I, so codes are easy to read

const normalizeCode = (code: string) => code.trim().toUpperCase();

// Random 8-character code, checked against the database so it is unique
const generateUniqueCode = async (): Promise<string> => {
    for (let attempt = 0; attempt < 10; attempt++) {
        let code = '';
        for (let i = 0; i < 8; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
        if (!(await RedeemCodeModel.exists({ code }))) return code;
    }
    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Could not generate a unique code. Please try again.');
};

// Budget numbers for one code. Everything is in BDT.
const toSummary = (c: Pick<TRedeemCode, 'amount' | 'prizeCount' | 'claimedCount'>) => {
    const remainingCount = Math.max(c.prizeCount - c.claimedCount, 0);
    return {
        totalBudget: roundMoney(c.amount * c.prizeCount),
        claimedAmount: roundMoney(c.amount * c.claimedCount),
        remainingAmount: roundMoney(c.amount * remainingCount),
        remainingCount,
    };
};

// Bangladesh calendar day → real instants: a day starts at 00:00 and ends at 23:59:59.999 (UTC+6)
const startOfDayBD = (day: string) => new Date(`${day}T00:00:00.000+06:00`);
const endOfDayBD = (day: string) => new Date(`${day}T23:59:59.999+06:00`);

// Where a code is in its life: off by the admin, not started yet, running, or past its end date
const codeState = (c: { isActive: boolean; startsAt: Date; expiresAt: Date; claimedCount: number; prizeCount: number }, now = new Date()) => {
    if (!c.isActive) return 'off';
    if (c.claimedCount >= c.prizeCount) return 'sold_out';
    if (now < c.startsAt) return 'upcoming';
    if (now > c.expiresAt) return 'expired';
    return 'running';
};

const vipListText = (levels: number[]) => levels.map((l) => `VIP ${l}`).join(', ');

// Admin: create a code. Super admin sees every code, an admin only the codes they created.
const createRedeemCode = async (
    payload: { code: string; startDate: string; endDate: string; amount: number; prizeCount: number; allowedVipLevels: number[] },
    actor: TActor
) => {
    if (!isMoneyAmount(payload.amount) || payload.amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Bonus amount must be a positive amount in BDT');
    }

    const code = payload.code ? normalizeCode(payload.code) : await generateUniqueCode();
    if (await RedeemCodeModel.exists({ code })) {
        throw new AppError(status.BAD_REQUEST, 'This redeem code already exists. Choose another code.');
    }

    const created = await RedeemCodeModel.create({
        code,
        amount: roundMoney(payload.amount),
        prizeCount: payload.prizeCount,
        claimedCount: 0,
        allowedVipLevels: payload.allowedVipLevels,
        startsAt: startOfDayBD(payload.startDate),
        expiresAt: endOfDayBD(payload.endDate),
        isActive: true,
        createdBy: new Types.ObjectId(actor.userId),
        createdByName: actor.fullName ?? '',
        createdByRole: actor.role === 'super_admin' ? 'super_admin' : 'admin',
    });

    RealtimeServices.notifyAdmins(['RedeemCodes']);
    return { ...created.toObject(), ...toSummary(created), state: codeState(created) };
};

// Every admin sees every code and who has claimed it. Only the super admin sees who created a code.
const listRedeemCodes = async (actor: TActor) => {
    const codes = await RedeemCodeModel.find().sort({ createdAt: -1 }).lean();
    const isSuper = actor.role === 'super_admin';
    return codes.map(({ createdBy, createdByName, createdByRole, ...c }) => ({
        ...c,
        ...toSummary(c),
        state: codeState(c),
        ...(isSuper ? { createdBy, createdByName, createdByRole } : {}),
    }));
};

// Super admin: the whole budget — how much there is, how much was claimed, how much is left
const getRedeemSummary = async () => {
    const codes = await RedeemCodeModel.find().select('amount prizeCount claimedCount').lean();

    const totals = codes.reduce(
        (t, c) => {
            const s = toSummary(c);
            return {
                codeCount: t.codeCount + 1,
                totalBudget: t.totalBudget + s.totalBudget,
                claimedUsers: t.claimedUsers + c.claimedCount,
                claimedAmount: t.claimedAmount + s.claimedAmount,
                remainingUsers: t.remainingUsers + s.remainingCount,
                remainingAmount: t.remainingAmount + s.remainingAmount,
            };
        },
        { codeCount: 0, totalBudget: 0, claimedUsers: 0, claimedAmount: 0, remainingUsers: 0, remainingAmount: 0 }
    );

    return {
        codeCount: totals.codeCount,
        totalBudget: roundMoney(totals.totalBudget),
        claimedUsers: totals.claimedUsers,
        claimedAmount: roundMoney(totals.claimedAmount),
        remainingUsers: totals.remainingUsers,
        remainingAmount: roundMoney(totals.remainingAmount),
    };
};

// Admin: switch a code on or off. An admin can only change codes they created.
const setRedeemCodeStatus = async (id: string, isActive: boolean, actor: TActor) => {
    const filter: Record<string, unknown> = { _id: id };
    if (actor.role !== 'super_admin') filter.createdBy = new Types.ObjectId(actor.userId);

    const updated = await RedeemCodeModel.findOneAndUpdate(filter, { isActive }, { new: true });
    if (!updated) throw new AppError(status.NOT_FOUND, 'Redeem code not found');

    RealtimeServices.notifyAdmins(['RedeemCodes']);
    return { ...updated.toObject(), ...toSummary(updated), state: codeState(updated) };
};

// Super admin: who claimed a code, with the member's full details and wallet balances
// Admins see who claimed (name, phone, VIP level, amount, time). The super admin also gets the
// full member record and wallet balances.
const getRedeemCodeClaims = async (id: string, actor: TActor) => {
    const isSuper = actor.role === 'super_admin';
    const code = await RedeemCodeModel.findById(id).lean();
    if (!code) throw new AppError(status.NOT_FOUND, 'Redeem code not found');

    const claims = await RedeemClaimModel.find({ redeemCode: code._id }).sort({ createdAt: -1 }).lean();
    const userIds = claims.map((c) => c.userId);

    const [users, wallets] = await Promise.all([
        UserModel.find({ _id: { $in: userIds } })
            .select(isSuper ? 'fullName phone email district membershipLevel status role avatar referralCode referredBy createdAt' : 'fullName phone membershipLevel')
            .lean(),
        isSuper
            ? WalletModel.find({ userId: { $in: userIds } }).select('userId walletType balance').lean()
            : Promise.resolve([]),
    ]);

    const userById = new Map(users.map((u) => [String(u._id), u]));
    const walletsByUser = new Map<string, { balanceWallet: number; rechargeWallet: number }>();
    for (const w of wallets) {
        const key = String(w.userId);
        const entry = walletsByUser.get(key) ?? { balanceWallet: 0, rechargeWallet: 0 };
        if (w.walletType === 'balance') entry.balanceWallet = roundMoney(w.balance);
        else entry.rechargeWallet = roundMoney(w.balance);
        walletsByUser.set(key, entry);
    }

    return {
        code: {
            ...code,
            ...toSummary(code),
            state: codeState(code),
            ...(isSuper ? {} : { createdBy: undefined, createdByName: undefined, createdByRole: undefined }),
        },
        claims: claims.map((c) => {
            const key = String(c.userId);
            return {
                _id: c._id,
                amount: c.amount,
                vipLevel: c.vipLevel,
                claimedAt: c.createdAt,
                user: userById.get(key) ?? null,
                wallets: isSuper ? walletsByUser.get(key) ?? { balanceWallet: 0, rechargeWallet: 0 } : null,
            };
        }),
    };
};

// Member: the codes this member has claimed
const getMyClaims = async (userId: string) => {
    const claims = await RedeemClaimModel.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    return claims.map((c) => ({
        _id: c._id,
        code: c.code,
        amount: c.amount,
        vipLevel: c.vipLevel,
        claimedAt: c.createdAt,
    }));
};

// Member: claim a code. The prize counter, the one-claim-per-member record and the wallet credit
// all happen in one database transaction, so a failure part-way leaves nothing half-done.
const claimRedeemCode = async (userId: string, rawCode: string) => {
    const code = normalizeCode(rawCode);

    const user = await UserModel.findOne({ _id: userId, isDeleted: false }).select('membershipLevel status role').lean();
    if (!user || user.role !== 'user') throw new AppError(status.FORBIDDEN, 'Only members can claim redeem codes');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, 'Your account is not active');

    const redeem = await RedeemCodeModel.findOne({ code }).lean();
    if (!redeem || !redeem.isActive) throw new AppError(status.NOT_FOUND, 'This redeem code is not valid');

    if (await RedeemClaimModel.exists({ redeemCode: redeem._id, userId })) {
        throw new AppError(status.BAD_REQUEST, 'You have already claimed this code');
    }

    const now = new Date();
    if (now < redeem.startsAt) throw new AppError(status.BAD_REQUEST, 'This redeem code is not active yet');
    if (now > redeem.expiresAt) throw new AppError(status.BAD_REQUEST, 'This redeem code has expired');

    const vipLevel = user.membershipLevel;
    if (!redeem.allowedVipLevels.includes(vipLevel)) {
        throw new AppError(
            status.FORBIDDEN,
            `This code is only for ${vipListText(redeem.allowedVipLevels)}. Your level is VIP ${vipLevel}.`
        );
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Atomic: only succeeds while prizes are left, so two members can never take the last prize
        const reserved = await RedeemCodeModel.findOneAndUpdate(
            {
                _id: redeem._id,
                isActive: true,
                startsAt: { $lte: now },
                expiresAt: { $gte: now },
                $expr: { $lt: ['$claimedCount', '$prizeCount'] },
            },
            { $inc: { claimedCount: 1 } },
            { new: true, session }
        );
        if (!reserved) throw new AppError(status.BAD_REQUEST, 'All prizes for this code have been claimed');

        try {
            await RedeemClaimModel.create(
                [{ redeemCode: redeem._id, code: redeem.code, userId, amount: redeem.amount, vipLevel }],
                { session }
            );
        } catch (err) {
            if ((err as { code?: number })?.code === 11000) {
                throw new AppError(status.BAD_REQUEST, 'You have already claimed this code');
            }
            throw err;
        }

        // The prize goes to the balance wallet, which is the one members withdraw from
        const wallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: 'balance', isActive: true },
            moneyIncrement('balance', redeem.amount),
            { new: true, session }
        );
        if (!wallet) throw new AppError(status.NOT_FOUND, 'Balance wallet not found');

        await TransactionServices.recordTransaction({
            userId,
            type: 'redeem_bonus',
            flow: 'credit',
            amount: redeem.amount,
            walletAffected: 'balance',
            balanceAfter: wallet.balance,
            note: `Redeem code ${redeem.code} bonus (VIP ${vipLevel})`,
            referenceId: redeem._id,
            session,
        });

        await session.commitTransaction();

        RealtimeServices.notifyUser(userId, ['Wallet', 'Transactions', 'RedeemCodes']);
        RealtimeServices.notifyAdmins(['RedeemCodes', 'Transactions']);

        return { code: redeem.code, amount: redeem.amount, vipLevel, balanceAfter: wallet.balance };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export const RedeemCodeServices = {
    createRedeemCode,
    listRedeemCodes,
    getRedeemSummary,
    setRedeemCodeStatus,
    getRedeemCodeClaims,
    getMyClaims,
    claimRedeemCode,
};
