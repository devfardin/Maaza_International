import { model, Schema, Types } from 'mongoose';

export type TAdminActivity = {
    adminId: Types.ObjectId;
    adminName: string;
    adminRole: 'admin' | 'super_admin';
    // e.g. deposit_approved, withdrawal_rejected, user_status_changed, product_created
    action: string;
    summary: string;
    targetType?: string;
    targetId?: Types.ObjectId | null;
};

const adminActivitySchema = new Schema<TAdminActivity>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        adminName: { type: String, default: '', trim: true },
        adminRole: { type: String, enum: ['admin', 'super_admin'], required: true },
        action: { type: String, required: true, trim: true },
        summary: { type: String, required: true, trim: true },
        targetType: { type: String, default: '' },
        targetId: { type: Schema.Types.ObjectId, default: null },
    },
    { timestamps: true }
);

adminActivitySchema.index({ createdAt: -1 });

export const AdminActivityModel = model<TAdminActivity>('AdminActivity', adminActivitySchema);
