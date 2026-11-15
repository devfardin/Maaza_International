import { roundMoney } from '../../utils/money';
import { ClientSession, Types } from 'mongoose';
import { ReferralServices } from '../referrals/referral.services';
import { ProductPurchaseModel } from '../productPurchages/productPurchases.model';
import { UserModel } from './user.model';
import { VipLevelModel, ensureVipLevelDefaults } from '../vipLevels/vipLevel.model';
import { BASE_VIP_LEVEL } from '../../config/constants';

// Total amount (BDT) the user has spent on their own product purchases
const getTotalSpent = async (userId: Types.ObjectId | string, session?: ClientSession) => {
    const rows = await ProductPurchaseModel.aggregate([
        { $match: { userId: new Types.ObjectId(String(userId)) } },
        { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
    ]).session(session ?? null);
    return roundMoney(rows[0]?.total ?? 0);
};

// Highest VIP level (0 = none) reached from valid referrals and spend.
// The VIP ladder lives in the database and is managed from the admin dashboard.
const resolveVipLevel = async (qualifiedReferrals: number, totalSpent: number, session?: ClientSession): Promise<number> => {
    await ensureVipLevelDefaults();
    const ladder = await VipLevelModel.find().sort({ level: 1 }).session(session ?? null);
    // everyone is at least at the base VIP level; higher rows are reached with referrals and spend
    let vip = BASE_VIP_LEVEL;
    for (const row of ladder) {
        if (qualifiedReferrals >= row.qualifiedReferrals && totalSpent >= row.minSpent) vip = Math.max(vip, row.level);
    }
    return vip;
};

// membershipLevel = VIP level (new members start at VIP 1)
// Re-evaluates a user's membership. Membership only ever goes UP here.
// Returns the new membershipLevel if the user was upgraded, otherwise null.
const evaluateUpgrade = async (userId: Types.ObjectId | string, session?: ClientSession): Promise<number | null> => {
    const user = await UserModel.findById(userId).session(session ?? null);
    if (!user || user.isDeleted || user.role !== 'user') return null;

    const [validReferrals, totalSpent] = await Promise.all([
        ReferralServices.countValidReferrals(user._id, session),
        getTotalSpent(user._id, session),
    ]);

    const newLevel = await resolveVipLevel(validReferrals, totalSpent, session);
    if (newLevel <= user.membershipLevel) return null;

    // conditional update protects against double upgrades under concurrency
    const updated = await UserModel.findOneAndUpdate(
        { _id: user._id, membershipLevel: user.membershipLevel },
        { membershipLevel: newLevel },
        { new: true, session }
    );
    return updated ? newLevel : null;
};

// Progress towards the next VIP level (used by the referral page)
const getProgress = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) return null;
    const [validReferrals, totalSpent] = await Promise.all([
        ReferralServices.countValidReferrals(userId),
        getTotalSpent(userId),
    ]);
    const vipLevel = user.membershipLevel;
    await ensureVipLevelDefaults();
    const next = await VipLevelModel.findOne({ level: vipLevel + 1 });
    return {
        membershipLevel: user.membershipLevel,
        vipLevel,
        nextLevel: next?.level ?? null,
        nextVipLevel: next?.level ?? null,
        validReferrals,
        totalSpent,
        required: next ? { validReferrals: next.qualifiedReferrals, totalSpent: next.minSpent } : null,
    };
};

export const MembershipServices = { evaluateUpgrade, getProgress, getTotalSpent, resolveVipLevel };
