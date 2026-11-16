import status from 'http-status';
import AppError from '../../errors/AppError';
import { VipLevelModel, TVipLevel, ensureVipLevelDefaults as ensureDefaults } from './vipLevel.model';
import { UserModel } from '../users/user.model';
import { MembershipServices } from '../users/membership.services';
import { RealtimeServices } from '../realtime/realtime.services';

const getVipLevels = async () => {
    await ensureDefaults();
    return VipLevelModel.find().sort({ level: 1 });
};

// Replaces the whole ladder (8 rows) in one go.
const updateVipLevels = async (levels: TVipLevel[]) => {
    const sorted = [...levels].sort((a, b) => a.level - b.level);

    // thresholds must never decrease as the VIP level goes up
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].qualifiedReferrals < sorted[i - 1].qualifiedReferrals) {
            throw new AppError(status.BAD_REQUEST, `VIP ${sorted[i].level} needs at least as many referrals as VIP ${sorted[i - 1].level}`);
        }
    }

    await ensureDefaults();
    await VipLevelModel.bulkWrite(
        sorted.map((l) => ({
            updateOne: {
                filter: { level: l.level },
                update: { $set: {
                    // VIP 1 is the starting level for everyone: it never has requirements
                    qualifiedReferrals: l.level === 1 ? 0 : l.qualifiedReferrals,
                    minSpent: l.level === 1 ? 0 : l.minSpent,
                    dailyCheckinBonus: l.dailyCheckinBonus,
                    weeklySalary: l.weeklySalary,
                } },
                upsert: true,
            },
        }))
    );
    // A lower threshold can lift existing members to a higher VIP level right away.
    // Membership never goes down, so this only ever upgrades people.
    const members = await UserModel.find({ role: 'user', isDeleted: false }).select('_id').lean();
    for (const member of members) {
        const newLevel = await MembershipServices.evaluateUpgrade(member._id);
        if (newLevel) {
            RealtimeServices.notifyUser(member._id, ['User', 'DailyCheckin', 'Referrals']);
            RealtimeServices.notifyVipUpgrade(member._id, { membershipLevel: newLevel, vipLevel: newLevel });
        }
    }

    return VipLevelModel.find().sort({ level: 1 });
};

export const VipLevelServices = {
    getVipLevels,
    updateVipLevels,
};
