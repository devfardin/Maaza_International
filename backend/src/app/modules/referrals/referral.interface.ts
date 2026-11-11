import { Types } from 'mongoose';

export type TReferral = {
    referrerId: Types.ObjectId;   // user who owns the referral code
    referredId: Types.ObjectId;   // user who registered using the code
    isValid: boolean;             // true after the referred user deposits AND buys a product
    validatedAt?: Date | null;
};
