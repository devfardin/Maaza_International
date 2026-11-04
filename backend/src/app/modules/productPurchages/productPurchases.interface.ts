import { Types } from 'mongoose';

export type TPaymentSource = 'recharge' | 'balance';

export type TPurchaseStatus = 'active' | 'completed' | 'cancelled' | 'expired';

// Level A = direct referrer (buyer's referredBy)
// Level B = referrer's referrer
// Level C = level B's referrer
export type TReferralLevel = 'B' | 'C';

export type TReferralCommissionSnapshot = {
    level: TReferralLevel;
    userId: Types.ObjectId;
    commissionRate: number;       // e.g. 0.10 for 10%
    commissionAmount: number;     // pre-calculated integer in poisha
};

export type TProductPurchase = {
    userId: Types.ObjectId;
    productId: Types.ObjectId;

    // Snapshot at purchase time
    productName: string;
    purchasePrice: number;        // integer in poisha
    dailyIncome: number;          // integer in poisha
    totalRevenue: number;         // dailyIncome * validityDays
    validityDays: number;

    paymentSource: TPaymentSource;

    // Claim schedule
    purchasedAt: Date;
    nextClaimAt: Date;
    lastClaimAt: Date | null;
    totalClaimedDays: number;
    receivedAmount?: number;

    // Referral commission snapshot (level B and C only)
    referralCommissions: TReferralCommissionSnapshot[];

    status: TPurchaseStatus;
};
