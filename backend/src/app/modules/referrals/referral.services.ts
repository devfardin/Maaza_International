import { roundMoney } from '../../utils/money';
import { ClientSession, Types } from 'mongoose';
import { TransactionModel } from '../transactions/transaction.model';
import { UserModel } from '../users/user.model';
import { ProductPurchaseModel } from '../productPurchages/productPurchases.model';
import { ReferralModel } from './referral.model';

// Create a referral record when a new user registers with a referral code.
// The record starts as INVALID; it becomes valid after the invitee buys a product.
const createReferral = async (
    referrerId: Types.ObjectId,
    referredId: Types.ObjectId,
    session?: ClientSession
) => {
    const [doc] = await ReferralModel.create([{ referrerId, referredId }], session ? { session } : undefined);
    return doc;
};

// Referral stats for the logged-in user:
//  - total   : everyone who registered with the code
//  - valid   : invitees who deposited AND bought a product
//  - invalid : invitees who only created an account so far
const getMyReferrals = async (referrerId: string) => {
    const referrals = await ReferralModel.find({ referrerId })
        .populate('referredId', 'fullName phone status membershipLevel createdAt')
        .sort({ createdAt: -1 });

    const total = referrals.length;
    const valid = referrals.filter((r) => r.isValid).length;

    // Signups by level, seen from me:
    //  - levelA: people who signed up with my code (direct)
    //  - levelB: people who signed up with one of my direct invitees' codes (two levels down)
    const directIds = referrals.map((r) => (r.referredId as any)?._id).filter(Boolean);
    const levelB = directIds.length
        ? await ReferralModel.countDocuments({ referrerId: { $in: directIds } })
        : 0;

    // lifetime commission earned from the team (type 'commission' = A/B claim commission)
    const earnings = await TransactionModel.aggregate([
        {
            $match: {
                userId: new Types.ObjectId(referrerId),
                type: 'commission',
                flow: 'credit',
            },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return {
        total,
        levelA: total,
        levelB,
        valid,
        invalid: total - valid,
        totalCommission: roundMoney(earnings[0]?.total ?? 0), // BDT
        referrals,
    };
};

// Mark a referral valid (first product purchase by the invited user).
// Returns the referral only the FIRST time it flips, otherwise null.
const markReferralValid = async (referredId: Types.ObjectId | string, session?: ClientSession) => {
    return ReferralModel.findOneAndUpdate(
        { referredId, isValid: false },
        { isValid: true, validatedAt: new Date() },
        { new: true, session }
    );
};

const countValidReferrals = async (referrerId: Types.ObjectId | string, session?: ClientSession) => {
    return ReferralModel.countDocuments({ referrerId, isValid: true }).session(session ?? null);
};

// Everyone in my team I can see on the referral center:
//  - direct invitees (relation A), and
//  - deeper members whose purchases pay me team commission (relation B or C).
// For each member: contact details, the products they bought, and what I earned from them.
const getMyTeamDetails = async (referrerId: string) => {
    const me = new Types.ObjectId(referrerId);

    const [directReferrals, purchasesPayingMe] = await Promise.all([
        ReferralModel.find({ referrerId: me }).select('referredId isValid').lean(),
        ProductPurchaseModel.find({ 'referralCommissions.userId': me })
            .select('userId referralCommissions')
            .lean(),
    ]);

    // relation to me for each member (direct invitee = A; otherwise the B / C snapshot)
    const relation = new Map<string, 'A' | 'B'>();
    for (const p of purchasesPayingMe) {
        const entry = p.referralCommissions.find((c) => String(c.userId) === String(me));
        if (entry && !relation.has(String(p.userId))) relation.set(String(p.userId), entry.level);
    }
    const isValidById = new Map<string, boolean>();
    for (const r of directReferrals) {
        relation.set(String(r.referredId), 'A');
        isValidById.set(String(r.referredId), r.isValid);
    }

    const memberIds = [...relation.keys()].map((id) => new Types.ObjectId(id));
    if (memberIds.length === 0) return [];

    const [members, purchases] = await Promise.all([
        UserModel.find({ _id: { $in: memberIds } })
            .select('fullName phone avatar membershipLevel')
            .lean(),
        ProductPurchaseModel.find({ userId: { $in: memberIds } })
            .select('userId productName purchasePrice purchasedAt validityDays')
            .sort({ purchasedAt: -1 })
            .lean(),
    ]);

    // what I earned from each purchase (commission + bonuses credited to me)
    const earnedRows = await TransactionModel.aggregate([
        {
            $match: {
                userId: me,
                type: 'commission',
                flow: 'credit',
                referenceId: { $in: purchases.map((p) => p._id) },
            },
        },
        { $group: { _id: '$referenceId', total: { $sum: '$amount' } } },
    ]);
    const earnedByPurchase = new Map<string, number>(earnedRows.map((r) => [String(r._id), r.total]));

    return members
        .map((m) => {
            const id = String(m._id);
            const memberPurchases = purchases.filter((p) => String(p.userId) === id);
            return {
                _id: id,
                fullName: m.fullName,
                phone: m.phone,
                avatar: m.avatar ?? '',
                membershipLevel: m.membershipLevel,
                joinedAt: m._id.getTimestamp(),
                relation: relation.get(id) ?? 'A',
                isValid: isValidById.get(id) ?? memberPurchases.length > 0,
                products: memberPurchases.map((p) => ({
                    _id: String(p._id),
                    productName: p.productName,
                    purchasePrice: p.purchasePrice,
                    purchasedAt: p.purchasedAt,
                    validityDays: p.validityDays,
                    earnedFromMe: earnedByPurchase.get(String(p._id)) ?? 0,
                })),
                earnedFromMe: memberPurchases.reduce((sum, p) => sum + (earnedByPurchase.get(String(p._id)) ?? 0), 0),
            };
        })
        .sort((a, b) => (a.relation === b.relation ? 0 : a.relation < b.relation ? -1 : 1));
};

export const ReferralServices = {
    getMyTeamDetails,
    createReferral,
    getMyReferrals,
    markReferralValid,
    countValidReferrals,
};
