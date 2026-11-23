import { moneyIncrement } from '../../utils/money';
import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { MembershipServices } from '../users/membership.services';
import { VipLevelModel, ensureVipLevelDefaults } from '../vipLevels/vipLevel.model';
import { ReferralServices } from '../referrals/referral.services';
import { DailyCheckinModel } from './dailyCheckin.model';
import { SALARY_TIMEZONE_OFFSET_HOURS } from '../../config/constants';

// The check-in day resets at 12 AM Bangladesh time (UTC+6), not at UTC midnight.
const todayBD = () => new Date(Date.now() + SALARY_TIMEZONE_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 10);

// Live VIP level (referrals + spend) and the bonus that goes with it.
const getBonusForUser = async (userId: Types.ObjectId | string) => {
    const [qualifiedReferrals, totalSpent] = await Promise.all([
        ReferralServices.countValidReferrals(userId),
        MembershipServices.getTotalSpent(userId),
    ]);
    const vipLevel = await MembershipServices.resolveVipLevel(qualifiedReferrals, totalSpent);
    await ensureVipLevelDefaults();
    const row = vipLevel > 0 ? await VipLevelModel.findOne({ level: vipLevel }) : null;
    return { vipLevel, qualifiedReferrals, bonusAmount: row?.dailyCheckinBonus ?? 0 };
};

const getStatus = async (userId: string) => {
    const { vipLevel, qualifiedReferrals, bonusAmount } = await getBonusForUser(userId);
    const today = await DailyCheckinModel.findOne({ userId, checkinDate: todayBD() });
    const last = await DailyCheckinModel.findOne({ userId }).sort({ checkinDate: -1 });
    return {
        vipLevel,
        qualifiedReferrals,
        bonusAmount,
        checkedInToday: !!today,
        todayAmount: today?.amount ?? 0,
        lastCheckinAt: last?.createdAt ?? null,
    };
};

// Check in for today. Credits the VIP bonus to the BALANCE (withdrawable) wallet.
const checkIn = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user || user.isDeleted || user.status !== 'active' || user.role !== 'user') {
        throw new AppError(status.FORBIDDEN, 'User account is not eligible for daily check-in');
    }

    const { vipLevel, bonusAmount } = await getBonusForUser(userId);
    const checkinDate = todayBD();

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // unique (userId, checkinDate) index makes a double check-in impossible, even under races
        let record;
        try {
            [record] = await DailyCheckinModel.create(
                [{ userId, checkinDate, vipLevel, amount: bonusAmount }],
                { session }
            );
        } catch (err) {
            if ((err as { code?: number })?.code === 11000) {
                throw new AppError(status.BAD_REQUEST, 'You have already checked in today');
            }
            throw err;
        }

        let balanceAfter: number | null = null;
        if (bonusAmount > 0) {
            const wallet = await WalletModel.findOneAndUpdate(
                { userId, walletType: 'balance', isActive: true },
                moneyIncrement('balance', bonusAmount),
                { new: true, session }
            );
            if (!wallet) throw new AppError(status.NOT_FOUND, 'Balance wallet not found');
            balanceAfter = wallet.balance;

            await TransactionServices.recordTransaction({
                userId,
                type: 'daily_checkin',
                flow: 'credit',
                amount: bonusAmount,
                walletAffected: 'balance',
                balanceAfter: wallet.balance,
                note: `Daily check-in bonus (VIP ${vipLevel})`,
                referenceId: record._id as Types.ObjectId,
                session,
            });
        }

        await session.commitTransaction();
        return { amount: bonusAmount, vipLevel, balanceAfter, checkinDate };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

export const DailyCheckinServices = { getStatus, checkIn };
