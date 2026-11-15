import { model, Schema } from 'mongoose';
import { DEFAULT_VIP_LEVELS } from '../../config/constants';

export type TVipLevel = {
    level: number;               // 1..8 (VIP number)
    qualifiedReferrals: number;  // valid referrals required
    minSpent: number;            // BDT the user must have spent on own purchases
    dailyCheckinBonus: number;   // BDT credited per daily check-in
};

const vipLevelSchema = new Schema<TVipLevel>(
    {
        level: { type: Number, required: true, unique: true, min: 1, max: 8 },
        qualifiedReferrals: { type: Number, required: true, min: 0, default: 0 },
        minSpent: { type: Number, required: true, min: 0, default: 0 },
        dailyCheckinBonus: { type: Number, required: true, min: 0, default: 0 },
    },
    { timestamps: true }
);

export const VipLevelModel = model<TVipLevel>('VipLevel', vipLevelSchema);

// Seeds the default VIP ladder on first use. Called from every read path that
// depends on the ladder, so a fresh database never reads an empty table.
export const ensureVipLevelDefaults = async () => {
    const count = await VipLevelModel.countDocuments();
    if (count === 0) {
        await VipLevelModel.insertMany(DEFAULT_VIP_LEVELS.map((l) => ({ ...l })));
    }
};
