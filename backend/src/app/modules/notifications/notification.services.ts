import status from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { NotificationModel, TNotification } from './notification.model';

// Creates an admin-facing notification. Never throws: a notification failure
// must not break the user's deposit / withdrawal / purchase.
const notifyAdmins = async (payload: Omit<TNotification, 'readBy'>) => {
    try {
        await NotificationModel.create({ ...payload, readBy: [] });
    } catch (err) {
        console.error('Failed to create admin notification', err);
    }
};

const listForAdmin = async (adminId: string, opts: { limit?: number; unreadOnly?: boolean } = {}) => {
    const limit = Math.min(opts.limit || 50, 200);
    const filter: Record<string, unknown> = {};
    if (opts.unreadOnly) filter.readBy = { $ne: new Types.ObjectId(adminId) };

    const [docs, unreadCount] = await Promise.all([
        NotificationModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
        NotificationModel.countDocuments({ readBy: { $ne: new Types.ObjectId(adminId) } }),
    ]);

    const items = docs.map((n) => ({
        ...n,
        isRead: (n.readBy ?? []).some((id) => String(id) === adminId),
    }));

    return { items, unreadCount };
};

const markRead = async (adminId: string, id: string) => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(status.BAD_REQUEST, 'Invalid notification id');
    const result = await NotificationModel.updateOne(
        { _id: id },
        { $addToSet: { readBy: new Types.ObjectId(adminId) } }
    );
    if (!result.matchedCount) throw new AppError(status.NOT_FOUND, 'Notification not found');
    return { id };
};

const markAllRead = async (adminId: string) => {
    const result = await NotificationModel.updateMany(
        { readBy: { $ne: new Types.ObjectId(adminId) } },
        { $addToSet: { readBy: new Types.ObjectId(adminId) } }
    );
    return { updated: result.modifiedCount };
};

export const NotificationServices = { notifyAdmins, listForAdmin, markRead, markAllRead };
