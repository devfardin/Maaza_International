import { model, Schema, Types } from 'mongoose';

export type TActivityEvent = 'register' | 'login' | 'login_failed';

export type TActivityLog = {
    userId?: Types.ObjectId | null;
    phone?: string;
    event: TActivityEvent;
    ip: string;
    deviceType: string;
    browser: string;
    os: string;
    userAgent: string;
};

const activityLogSchema = new Schema<TActivityLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        phone: { type: String, trim: true },
        event: { type: String, enum: ['register', 'login', 'login_failed'], required: true },
        ip: { type: String, required: true },
        deviceType: { type: String, default: 'unknown' },
        browser: { type: String, default: 'Unknown' },
        os: { type: String, default: 'Unknown' },
        userAgent: { type: String, default: '' },
    },
    { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLogModel = model<TActivityLog>('ActivityLog', activityLogSchema);
