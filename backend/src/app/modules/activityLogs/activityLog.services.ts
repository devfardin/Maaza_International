import { ClientSession, Types } from 'mongoose';
import { TClientInfo } from '../../utils/clientInfo';
import { ActivityLogModel, TActivityEvent } from './activityLog.model';

const record = async (
    event: TActivityEvent,
    info: TClientInfo,
    opts: { userId?: Types.ObjectId | string | null; phone?: string; session?: ClientSession } = {}
) => {
    // Logging must never break registration / login
    try {
        await ActivityLogModel.create(
            [{ event, ...info, userId: opts.userId ?? null, phone: opts.phone }],
            opts.session ? { session: opts.session } : undefined
        );
    } catch (err) {
        console.error('Failed to record activity log', err);
    }
};

const getAll = async (query: { userId?: string; event?: string; limit?: number }) => {
    const filter: Record<string, unknown> = {};
    if (query.userId) filter.userId = query.userId;
    if (query.event) filter.event = query.event;
    return ActivityLogModel.find(filter)
        .populate('userId', 'fullName phone email role')
        .sort({ createdAt: -1 })
        .limit(Math.min(query.limit || 200, 500));
};

export const ActivityLogServices = { record, getAll };
