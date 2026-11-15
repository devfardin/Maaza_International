import { Response } from 'express';
import { Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Realtime push (Server-Sent Events).
//
// Every open browser tab holds one SSE connection to GET /realtime/stream.
// When data changes on the server, we send a small "sync" event listing the
// RTK Query tags that became stale. The frontend invalidates those tags, so the
// affected screens refetch by themselves — no page reload needed.
//
// NOTE: connections are kept in this process's memory. This is correct for a
// single backend instance. Running several instances needs a shared broker
// (e.g. Redis pub/sub) in front of notifyUser / notifyAdmins / broadcast.
// ─────────────────────────────────────────────────────────────────────────────

// RTK Query tag names, or 'all' to refresh every cached query.
export type TSyncTags = string[] | 'all';

export type TRealtimeConnection = {
    userId: string;
    role: string;
    res: Response;
};

const ADMIN_ROLES = ['admin', 'super_admin'];

// Tags that describe shared content (not one user's data). Refreshed for everyone.
export const CONTENT_TAGS = ['Products', 'Categories', 'VipLevels', 'PaymentMethods', 'PaymentAccounts', 'Tasks', 'CommunityPosts'];

// Tags an admin screen can show; refreshed for admins when any admin-relevant change happens.
export const ADMIN_TAGS = ['Notifications', 'DepositRequests', 'Withdrawals', 'Purchases', 'Transactions', 'User', 'AdminActivity'];

const connections = new Set<TRealtimeConnection>();

const write = (res: Response, event: string, data: unknown) => {
    try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
        // socket already closed — the 'close' handler removes it
    }
};

const addConnection = (conn: TRealtimeConnection) => {
    connections.add(conn);
};

const removeConnection = (conn: TRealtimeConnection) => {
    connections.delete(conn);
};

const sendTo = (match: (conn: TRealtimeConnection) => boolean, tags: TSyncTags) => {
    for (const conn of connections) {
        if (match(conn)) write(conn.res, 'sync', { tags });
    }
};

// Refresh the given tags in every open tab of one user.
const notifyUser = (userId: Types.ObjectId | string, tags: TSyncTags) => {
    const id = String(userId);
    sendTo((c) => c.userId === id, tags);
};

// Refresh the given tags for several users at once.
const notifyUsers = (userIds: (Types.ObjectId | string)[], tags: TSyncTags) => {
    const ids = new Set(userIds.map(String));
    sendTo((c) => ids.has(c.userId), tags);
};

// Refresh the given tags on every admin / super admin screen.
const notifyAdmins = (tags: TSyncTags = ADMIN_TAGS) => {
    sendTo((c) => ADMIN_ROLES.includes(c.role), tags);
};

// Refresh the given tags for every connected client (users and admins).
const broadcast = (tags: TSyncTags) => {
    sendTo(() => true, tags);
};

// Tells one user that they moved up a VIP level (shows a congratulation toast).
const notifyVipUpgrade = (userId: Types.ObjectId | string, payload: { membershipLevel: number; vipLevel: number }) => {
    const id = String(userId);
    for (const conn of connections) {
        if (conn.userId === id) write(conn.res, 'vip-upgrade', payload);
    }
};

const sendHeartbeat = (res: Response) => {
    try {
        res.write(': ping\n\n');
    } catch {
        // ignored — the 'close' handler cleans up
    }
};

export const RealtimeServices = {
    addConnection,
    removeConnection,
    notifyUser,
    notifyUsers,
    notifyAdmins,
    notifyVipUpgrade,
    broadcast,
    sendHeartbeat,
    write,
};
