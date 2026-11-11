import { model, Schema } from 'mongoose';
import { TReferral } from './referral.interface';

const referralSchema = new Schema<TReferral>(
    {
        referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        referredId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // one referral record per referred user
        },
        isValid: { type: Boolean, default: false },
        validatedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const ReferralModel = model<TReferral>('Referral', referralSchema);
