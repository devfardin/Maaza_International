import { Types } from 'mongoose';
import { AdminActivityModel, TAdminActivity } from './adminActivity.model';
import { DepositRequestModel } from '../depositRequests/depositRequests.model';
import { WithdrawalModel } from '../withdrawals/withdrawal.model';

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

type TRequestInfo = {
    kind: 'deposit' | 'withdrawal';
    memberName: string;
    memberPhone: string;
    amount: number;
    netAmount?: number;
    status: string;
};

// Attaches the member and the request amount to every deposit / withdrawal row,
// so the activity log shows WHICH member's request each admin handled.
const getAll = async (query: { adminId?: string; action?: string; limit?: number }) => {
    const filter: Record<string, unknown> = {};
    if (query.adminId && Types.ObjectId.isValid(query.adminId)) filter.adminId = new Types.ObjectId(query.adminId);
    if (query.action) filter.action = query.action;
    const rows = await AdminActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(query.limit || 200, 500))
        .lean();

    const depositIds = rows.filter((r) => r.targetType === 'deposit_request' && r.targetId).map((r) => r.targetId);
    const withdrawalIds = rows.filter((r) => r.targetType === 'withdrawal' && r.targetId).map((r) => r.targetId);

    const [deposits, withdrawals] = await Promise.all([
        depositIds.length
            ? DepositRequestModel.find({ _id: { $in: depositIds } })
                .select('amount status userId')
                .populate('userId', 'fullName phone')
                .lean()
            : Promise.resolve([]),
        withdrawalIds.length
            ? WithdrawalModel.find({ _id: { $in: withdrawalIds } })
                .select('amount netAmount status userId')
                .populate('userId', 'fullName phone')
                .lean()
            : Promise.resolve([]),
    ]);

    const info = new Map<string, TRequestInfo>();
    const toInfo = (doc: any, kind: TRequestInfo['kind']): TRequestInfo => ({
        kind,
        memberName: doc.userId?.fullName ?? 'Unknown member',
        memberPhone: doc.userId?.phone ?? '',
        amount: doc.amount,
        netAmount: doc.netAmount,
        status: doc.status,
    });
    deposits.forEach((d: any) => info.set(String(d._id), toInfo(d, 'deposit')));
    withdrawals.forEach((w: any) => info.set(String(w._id), toInfo(w, 'withdrawal')));

    return rows.map((r) => ({
        ...r,
        request: r.targetId ? info.get(String(r.targetId)) ?? null : null,
    }));
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
