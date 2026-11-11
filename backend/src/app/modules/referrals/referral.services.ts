import { ClientSession, Types } from 'mongoose';
import { TransactionModel } from '../transactions/transaction.model';
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

    // lifetime commission + invitation bonus earned from the team
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
        valid,
        invalid: total - valid,
        totalCommission: earnings[0]?.total ?? 0, // poisha
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

export const ReferralServices = {
    createReferral,
    getMyReferrals,
    markReferralValid,
    countValidReferrals,
};
