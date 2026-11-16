import { roundMoney } from '../../utils/money';
import { Types } from 'mongoose';
import { SALARY_TIMEZONE_OFFSET_HOURS } from '../../config/constants';
import { UserModel } from '../users/user.model';
import { DepositRequestModel } from '../depositRequests/depositRequests.model';
import { WithdrawalModel } from '../withdrawals/withdrawal.model';
import { WalletModel } from '../wallets/wallet.model';

// Headline numbers for the admin dashboard. Money is returned in BDT.
// Wallet balances are private: only a super_admin gets the wallet totals.
const getStats = async (viewerRole: string) => {
    const [totalUsers, depositTotals, withdrawalTotals, pendingDeposits, pendingWithdrawals] = await Promise.all([
        UserModel.countDocuments({ role: 'user', isDeleted: false }),
        DepositRequestModel.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        WithdrawalModel.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        DepositRequestModel.countDocuments({ status: 'pending' }),
        WithdrawalModel.countDocuments({ status: 'pending' }),
    ]);

    const stats = {
        totalUsers,
        totalDeposits: roundMoney(depositTotals[0]?.total ?? 0),
        depositCount: depositTotals[0]?.count ?? 0,
        totalWithdrawals: roundMoney(withdrawalTotals[0]?.total ?? 0),
        withdrawalCount: withdrawalTotals[0]?.count ?? 0,
        pendingDeposits,
        pendingWithdrawals,
        balanceWalletTotal: null as number | null,
        rechargeWalletTotal: null as number | null,
    };

    if (viewerRole === 'super_admin') {
        const walletTotals = await walletTotalsByType();
        stats.balanceWalletTotal = roundMoney(walletTotals.balance);
        stats.rechargeWalletTotal = roundMoney(walletTotals.recharge);
    }
    return stats;
};

// Sum of member wallet balances by wallet type (members only, not admins)
const walletTotalsByType = async () => {
    const memberIds = await UserModel.distinct('_id', { role: 'user', isDeleted: false });
    const rows = await WalletModel.aggregate([
        { $match: { userId: { $in: memberIds } } },
        { $group: { _id: '$walletType', total: { $sum: '$balance' } } },
    ]);
    const sum = (type: string) => rows.find((r) => r._id === type)?.total ?? 0;
    return { balance: sum('balance'), recharge: sum('recharge') };
};

// Super admin only: every member with their balance and recharge wallet, richest first
const getMemberWallets = async () => {
    const users = await UserModel.find({ role: 'user', isDeleted: false })
        .select('fullName phone status')
        .lean();
    const wallets = await WalletModel.find({ userId: { $in: users.map((u) => u._id) } })
        .select('userId walletType balance')
        .lean();

    const byUser = new Map<string, { balanceWallet: number; rechargeWallet: number }>();
    for (const w of wallets) {
        const key = String(w.userId);
        const entry = byUser.get(key) ?? { balanceWallet: 0, rechargeWallet: 0 };
        if (w.walletType === 'balance') entry.balanceWallet = roundMoney(w.balance);
        else entry.rechargeWallet = roundMoney(w.balance);
        byUser.set(key, entry);
    }

    const members = users
        .map((u) => ({
            _id: u._id,
            fullName: u.fullName,
            phone: u.phone,
            status: u.status,
            balanceWallet: byUser.get(String(u._id))?.balanceWallet ?? 0,
            rechargeWallet: byUser.get(String(u._id))?.rechargeWallet ?? 0,
        }))
        .sort((a, b) => b.balanceWallet - a.balanceWallet || a.fullName.localeCompare(b.fullName));

    const totals = members.reduce(
        (t, m) => ({ balance: t.balance + m.balanceWallet, recharge: t.recharge + m.rechargeWallet }),
        { balance: 0, recharge: 0 }
    );
    return {
        members,
        totals: { balanceWallet: roundMoney(totals.balance), rechargeWallet: roundMoney(totals.recharge) },
    };
};

// Start of today in Bangladesh time, as a real instant
const startOfTodayBD = (now = new Date()) => {
    const offsetMs = SALARY_TIMEZONE_OFFSET_HOURS * 3_600_000;
    const dayMs = 86_400_000;
    const localMs = now.getTime() + offsetMs;
    return new Date(Math.floor(localMs / dayMs) * dayMs - offsetMs);
};

// How many requests one admin handled (approved / rejected), and the money involved.
// `since` limits it to requests decided after that moment.
const handledSummary = async (adminId: string, since?: Date) => {
    const me = new Types.ObjectId(adminId);
    const timeFilter = since ? { updatedAt: { $gte: since } } : {};

    const [deposits, withdrawals] = await Promise.all([
        DepositRequestModel.aggregate([
            { $match: { approvedBy: me, status: { $in: ['approved', 'rejected'] }, ...timeFilter } },
            { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
        ]),
        WithdrawalModel.aggregate([
            { $match: { processedBy: me, status: { $in: ['approved', 'rejected'] }, ...timeFilter } },
            { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' }, netAmount: { $sum: '$netAmount' } } },
        ]),
    ]);

    const row = (rows: any[], s: string) => rows.find((r) => r._id === s) ?? { count: 0, amount: 0, netAmount: 0 };
    const dApproved = row(deposits, 'approved');
    const dRejected = row(deposits, 'rejected');
    const wPaid = row(withdrawals, 'approved');
    const wRejected = row(withdrawals, 'rejected');

    return {
        deposits: {
            accepted: { count: dApproved.count, amount: roundMoney(dApproved.amount) },
            rejected: { count: dRejected.count, amount: roundMoney(dRejected.amount) },
        },
        withdrawals: {
            paid: { count: wPaid.count, amount: roundMoney(wPaid.amount), netAmount: roundMoney(wPaid.netAmount) },
            rejected: { count: wRejected.count, amount: roundMoney(wRejected.amount) },
        },
        totalRequests: dApproved.count + dRejected.count + wPaid.count + wRejected.count,
    };
};

// The signed-in admin's own work: today and all time
const getMyHandled = async (adminId: string) => {
    const [today, allTime] = await Promise.all([
        handledSummary(adminId, startOfTodayBD()),
        handledSummary(adminId),
    ]);
    return { today, allTime };
};

export const AdminDashboardServices = { getStats, getMemberWallets, getMyHandled };
