import { model, Schema, Types } from 'mongoose';

export type TDailyCheckin = {
    userId: Types.ObjectId;
    checkinDate: string;   // 'YYYY-MM-DD' (UTC) — one check-in per user per day
    vipLevel: number;      // VIP level at the time of check-in (0 = none)
    amount: number;        // BDT credited to balance wallet
    createdAt?: Date;
};

const dailyCheckinSchema = new Schema<TDailyCheckin>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        checkinDate: { type: String, required: true },
        vipLevel: { type: Number, default: 0, min: 0 },
        amount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

dailyCheckinSchema.index({ userId: 1, checkinDate: 1 }, { unique: true });

export const DailyCheckinModel = model<TDailyCheckin>('DailyCheckin', dailyCheckinSchema);
