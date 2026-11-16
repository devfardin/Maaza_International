import { model, Schema } from 'mongoose';
import { DEFAULT_VIP_LEVELS, DEFAULT_WEEKLY_SALARIES } from '../../config/constants';

export type TVipLevel = {
    level: number;               // 1..8 (VIP number)
    qualifiedReferrals: number;  // valid referrals required
    minSpent: number;            // BDT the user must have spent on own purchases
    dailyCheckinBonus: number;   // BDT credited per daily check-in
    weeklySalary: number;        // BDT paid every Monday claim window (0 = no weekly salary)
};

const vipLevelSchema = new Schema<TVipLevel>(
    {
        level: { type: Number, required: true, unique: true, min: 1, max: 8 },
        qualifiedReferrals: { type: Number, required: true, min: 0, default: 0 },
        minSpent: { type: Number, required: true, min: 0, default: 0 },
        dailyCheckinBonus: { type: Number, required: true, min: 0, default: 0 },
        weeklySalary: { type: Number, required: true, min: 0, default: 0 },
    },
    { timestamps: true }
);

export const VipLevelModel = model<TVipLevel>('VipLevel', vipLevelSchema);

// Seeds the default VIP ladder on first use. Called from every read path that
// depends on the ladder, so a fresh database never reads an empty table.
export const ensureVipLevelDefaults = async () => {
    const count = await VipLevelModel.countDocuments();
    if (count === 0) {
        await VipLevelModel.insertMany(
            DEFAULT_VIP_LEVELS.map((l) => ({ ...l, weeklySalary: DEFAULT_WEEKLY_SALARIES[l.level] ?? 0 }))
        );
        return;
    }

    // Ladders created before weekly salary existed: give those rows the default salary once.
    const missing = await VipLevelModel.countDocuments({ weeklySalary: { $exists: false } });
    if (missing > 0) {
        await VipLevelModel.bulkWrite(
            Object.entries(DEFAULT_WEEKLY_SALARIES).map(([level, salary]) => ({
                updateOne: {
                    filter: { level: Number(level), weeklySalary: { $exists: false } },
                    update: { $set: { weeklySalary: salary } },
                },
            }))
        );
        // rows that are not in the salary table (VIP 1-3) get 0
        await VipLevelModel.updateMany({ weeklySalary: { $exists: false } }, { $set: { weeklySalary: 0 } });
    }
};
