import { roundMoney } from '../../utils/money';
import { UserModel } from '../users/user.model';
import { DepositRequestModel } from '../depositRequests/depositRequests.model';
import { WithdrawalModel } from '../withdrawals/withdrawal.model';
import { WalletModel } from '../wallets/wallet.model';

// Headline numbers for the admin dashboard. Money is returned in BDT.
const getStats = async () => {
    // Wallet totals cover members only (not admins), so the figures match what members hold
    const memberIds = await UserModel.distinct('_id', { role: 'user', isDeleted: false });
    const walletTotals = await WalletModel.aggregate([
        { $match: { userId: { $in: memberIds } } },
        { $group: { _id: '$walletType', total: { $sum: '$balance' } } },
    ]);
    const walletSum = (walletType: string) => walletTotals.find((w) => w._id === walletType)?.total ?? 0;

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

    return {
        totalUsers,
        totalDeposits: roundMoney(depositTotals[0]?.total ?? 0),
        depositCount: depositTotals[0]?.count ?? 0,
        totalWithdrawals: roundMoney(withdrawalTotals[0]?.total ?? 0),
        withdrawalCount: withdrawalTotals[0]?.count ?? 0,
        pendingDeposits,
        pendingWithdrawals,
        balanceWalletTotal: roundMoney(walletSum('balance')),
        rechargeWalletTotal: roundMoney(walletSum('recharge')),
    };
};

export const AdminDashboardServices = { getStats };
