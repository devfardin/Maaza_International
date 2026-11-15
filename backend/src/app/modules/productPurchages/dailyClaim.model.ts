import { model, Schema, Types } from 'mongoose';

export type TDailyClaim = {
    purchaseId: Types.ObjectId;
    userId: Types.ObjectId;
    claimDate: string;          // 'YYYY-MM-DD' — one claim per purchase per calendar day
    incomeAmount: number;       // BDT credited to buyer (2 decimals)
    claimedAt: Date;
};

const dailyClaimSchema = new Schema<TDailyClaim>(
    {
        purchaseId: {
            type: Schema.Types.ObjectId,
            ref: 'ProductPurchase',
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        claimDate: {
            type: String,
            required: true
        },
        incomeAmount: {
            type: Number,
            required: true,
            min: 0.01
        },
        claimedAt: {
            type: Date,
            required: true
        },
    },
    { timestamps: false }
);

// Prevents duplicate claims for the same purchase on the same calendar day
dailyClaimSchema.index({ purchaseId: 1, claimDate: 1 }, { unique: true });

export const DailyClaimModel = model<TDailyClaim>('DailyClaim', dailyClaimSchema);
