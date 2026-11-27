import { model, Schema, Types } from 'mongoose';

// A redeem code: an admin creates it with a bonus amount, a number of prizes and the VIP levels
// allowed to claim it. Every prize is one claim, so prizeCount is also how many people can claim.
export type TRedeemCode = {
    code: string;                 // upper-case, unique (e.g. EID2026)
    amount: number;               // BDT credited to the balance wallet for each claim
    prizeCount: number;           // total prizes = how many members can claim
    claimedCount: number;         // prizes already claimed
    allowedVipLevels: number[];   // VIP levels (1..8) that may claim, e.g. [2, 3]
    startsAt: Date;               // code can be claimed from this moment (start of the start day, Bangladesh time)
    expiresAt: Date;              // code stops working at this moment (end of the end day, Bangladesh time)
    isActive: boolean;            // admin can switch a code off without deleting it
    createdBy: Types.ObjectId;    // admin who created it (super admin can see who)
    createdByName: string;        // snapshot of the creator's name
    createdByRole: 'admin' | 'super_admin';
};

const redeemCodeSchema = new Schema<TRedeemCode>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        amount: { type: Number, required: true, min: [0.01, 'Amount must be at least 0.01 BDT'] },
        prizeCount: { type: Number, required: true, min: [1, 'There must be at least 1 prize'] },
        claimedCount: { type: Number, default: 0, min: 0 },
        allowedVipLevels: {
            type: [Number],
            required: true,
            validate: {
                validator: (levels: number[]) => levels.length > 0 && levels.every((l) => l >= 1 && l <= 8),
                message: 'Choose at least one VIP level (1 to 8)',
            },
        },
        startsAt: { type: Date, required: [true, 'Start date is required'], index: true },
        expiresAt: {
            type: Date,
            required: [true, 'End date is required'],
            validate: {
                validator: function (this: { startsAt?: Date }, v: Date) {
                    return !this.startsAt || v > this.startsAt;
                },
                message: 'End date must be after the start date',
            },
        },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        createdByName: { type: String, default: '', trim: true },
        createdByRole: { type: String, enum: ['admin', 'super_admin'], required: true },
    },
    { timestamps: true }
);

export const RedeemCodeModel = model<TRedeemCode>('RedeemCode', redeemCodeSchema);

// One row per member who claimed a code. The unique index is the final guard against a member
// claiming the same code twice, even if two requests arrive at the same time.
export type TRedeemClaim = {
    redeemCode: Types.ObjectId;
    code: string;
    userId: Types.ObjectId;
    amount: number;
    vipLevel: number;             // the member's VIP level at the moment of claiming
    createdAt?: Date;             // claim time
};

const redeemClaimSchema = new Schema<TRedeemClaim>(
    {
        redeemCode: { type: Schema.Types.ObjectId, ref: 'RedeemCode', required: true },
        code: { type: String, required: true, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        vipLevel: { type: Number, required: true, min: 1, max: 8 },
    },
    { timestamps: true }
);

redeemClaimSchema.index({ redeemCode: 1, userId: 1 }, { unique: true });
redeemClaimSchema.index({ redeemCode: 1, createdAt: -1 });

export const RedeemClaimModel = model<TRedeemClaim>('RedeemClaim', redeemClaimSchema);
