import { model, Schema } from 'mongoose';
import { TProductPurchase, TReferralCommissionSnapshot } from './productPurchases.interface';

const referralCommissionSnapshotSchema = new Schema<TReferralCommissionSnapshot>(
    {
        level: { type: String, enum: ['B', 'C'], required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        commissionRate: { type: Number, required: true },
        commissionAmount: { type: Number, required: true },
    },
    { _id: false }
);

const productPurchaseSchema = new Schema<TProductPurchase>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },
        purchasePrice: {
            type: Number,
            required: true,
            min: 1
        },
        dailyIncome: {
            type: Number,
            required: true,
            min: 1
        },
        totalRevenue: {
            type: Number,
            required: true,
            min: 1
        },
        validityDays: {
            type: Number,
            required: true,
            min: 1
        },

        paymentSource: {
            type: String,
            enum: ['recharge', 'balance'],
            required: true,
        },

        purchasedAt: {
            type: Date,
            required: true,
        },
        nextClaimAt: {
            type: Date,
            required: true,

        },
        lastClaimAt: {
            type: Date,
            default: null
        },
        totalClaimedDays: {
            type: Number,
            default: 0
        },
        receivedAmount: {
            type: Number,
            default: 0
        },

        referralCommissions: {
            type: [referralCommissionSnapshotSchema],
            default: [],
        },

        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled', 'expired'],
            default: 'active',
        },
    },
    { timestamps: true }
);

productPurchaseSchema.index({ userId: 1, status: 1 });
productPurchaseSchema.index({ nextClaimAt: 1 });

export const ProductPurchaseModel = model<TProductPurchase>('ProductPurchase', productPurchaseSchema);
