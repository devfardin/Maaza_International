import { Types } from 'mongoose';

export type TPaymentSource = 'recharge' | 'balance';

export type TPurchaseStatus = 'active' | 'completed' | 'cancelled' | 'expired';

// Level A = direct referrer (buyer's referredBy)
// Level A = the buyer's direct inviter
// Level B = the inviter's inviter
export type TReferralLevel = 'A' | 'B';

// Copied from the product's teamCommissions rule at purchase time.
// The commission itself is calculated and paid on each profit claim.
export type TReferralCommissionSnapshot = {
    level: TReferralLevel;
    userId: Types.ObjectId;
    commissionRate: number;       // e.g. 0.10 for 10%
};

export type TProductPurchase = {
    userId: Types.ObjectId;
    productId: Types.ObjectId;

    // Snapshot at purchase time
    productName: string;
    purchasePrice: number;        // BDT (2 decimals)
    dailyIncome: number;          // BDT (2 decimals), per day
    claimIntervalDays: number;    // legacy day count (kept for older purchases)
    claimUnit?: "hour" | "day";   // hourly or daily product
    claimEveryHours?: number;     // interval in hours (one claim covers this many hours)
    claimedHours?: number;        // hours already claimed (progress; validity = validityDays × 24)
    totalRevenue: number;         // dailyIncome * validityDays
    validityDays: number;

    paymentSource: TPaymentSource;

    // Claim schedule
    purchasedAt: Date;
    nextClaimAt: Date;
    lastClaimAt: Date | null;
    totalClaimedDays: number;
    receivedAmount?: number;

    // Referral commission snapshot (level A and B only)
    referralCommissions: TReferralCommissionSnapshot[];

    status: TPurchaseStatus;
};
