import { ClientSession, Types } from 'mongoose';
import { MEMBERSHIP_RULES } from '../../config/constants';
import { ReferralServices } from '../referrals/referral.services';
import { ProductPurchaseModel } from '../productPurchages/productPurchases.model';
import { UserModel } from './user.model';

// Total amount (poisha) the user has spent on their own product purchases
const getTotalSpent = async (userId: Types.ObjectId | string, session?: ClientSession) => {
    const rows = await ProductPurchaseModel.aggregate([
        { $match: { userId: new Types.ObjectId(String(userId)) } },
        { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
    ]).session(session ?? null);
    return rows[0]?.total ?? 0;
};

// Re-evaluates a user's membership level. A user moves up ONE level at a time
// when they meet the rule for the next level:
//   level 1 → 2 : 5 valid referrals (invitees who deposited + bought a product)
//                 AND ৳15,000 spent on their own purchases.
// Returns the new level if the user was upgraded, otherwise null.
const evaluateUpgrade = async (userId: Types.ObjectId | string, session?: ClientSession): Promise<number | null> => {
    const user = await UserModel.findById(userId).session(session ?? null);
    if (!user || user.isDeleted || user.role !== 'user') return null;

    const rule = MEMBERSHIP_RULES.find((r) => r.level === user.membershipLevel + 1);
    if (!rule) return null; // already at the highest configured level

    const [validReferrals, totalSpent] = await Promise.all([
        ReferralServices.countValidReferrals(user._id, session),
        getTotalSpent(user._id, session),
    ]);

    if (validReferrals < rule.validReferrals || totalSpent < rule.totalSpent) return null;

    // conditional update protects against double upgrades under concurrency
    const updated = await UserModel.findOneAndUpdate(
        { _id: user._id, membershipLevel: user.membershipLevel },
        { membershipLevel: rule.level },
        { new: true, session }
    );
    return updated ? rule.level : null;
};

// Progress towards the next level (used by the referral page)
const getProgress = async (userId: string) => {
    const user = await UserModel.findById(userId);
    if (!user) return null;
    const rule = MEMBERSHIP_RULES.find((r) => r.level === user.membershipLevel + 1);
    const [validReferrals, totalSpent] = await Promise.all([
        ReferralServices.countValidReferrals(userId),
        getTotalSpent(userId),
    ]);
    return {
        currentLevel: user.membershipLevel,
        nextLevel: rule?.level ?? null,
        validReferrals,
        totalSpent,
        required: rule ? { validReferrals: rule.validReferrals, totalSpent: rule.totalSpent } : null,
    };
};

export const MembershipServices = { evaluateUpgrade, getProgress, getTotalSpent };
