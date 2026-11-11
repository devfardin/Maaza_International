import { Types } from 'mongoose';
import { AdminActivityModel, TAdminActivity } from './adminActivity.model';

type TActor = { userId: string; fullName?: string; role: string };

// Records what an admin did. Never throws — auditing must not break the action itself.
const record = async (
    actor: TActor,
    action: string,
    summary: string,
    target?: { type: string; id?: string | Types.ObjectId | null }
) => {
    if (actor.role !== 'admin' && actor.role !== 'super_admin') return;
    try {
        await AdminActivityModel.create({
            adminId: new Types.ObjectId(actor.userId),
            adminName: actor.fullName ?? '',
            adminRole: actor.role,
            action,
            summary,
            targetType: target?.type ?? '',
            targetId: target?.id ? new Types.ObjectId(String(target.id)) : null,
        } as Partial<TAdminActivity>);
    } catch (err) {
        console.error('Failed to record admin activity', err);
    }
};

const getAll = async (query: { adminId?: string; action?: string; limit?: number }) => {
    const filter: Record<string, unknown> = {};
    if (query.adminId && Types.ObjectId.isValid(query.adminId)) filter.adminId = new Types.ObjectId(query.adminId);
    if (query.action) filter.action = query.action;
    return AdminActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(query.limit || 200, 500));
};

// One row per admin: how many actions, and when they were last active
const getAdminSummary = async () => {
    return AdminActivityModel.aggregate([
        {
            $group: {
                _id: '$adminId',
                adminName: { $first: '$adminName' },
                adminRole: { $first: '$adminRole' },
                totalActions: { $sum: 1 },
                lastActionAt: { $max: '$createdAt' },
            },
        },
        { $sort: { lastActionAt: -1 } },
    ]);
};

export const AdminActivityServices = { record, getAll, getAdminSummary };
