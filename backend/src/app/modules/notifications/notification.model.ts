import { model, Schema, Types } from 'mongoose';

// Events that are pushed to every admin's notification bell
export type TNotificationType = 'deposit_request' | 'withdrawal_request' | 'product_purchase';

export type TNotification = {
    type: TNotificationType;
    title: string;
    message: string;
    // the user who caused the event (buyer / depositor / withdrawer)
    actorId: Types.ObjectId;
    actorName: string;
    actorPhone: string;
    // poisha — optional for events that have no amount
    amount: number | null;
    // id of the deposit request / withdrawal / purchase the event refers to
    referenceId: Types.ObjectId | null;
    // admin ids that have already read this notification
    readBy: Types.ObjectId[];
};

const notificationSchema = new Schema<TNotification>(
    {
        type: {
            type: String,
            enum: ['deposit_request', 'withdrawal_request', 'product_purchase'],
            required: true,
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, default: '', trim: true },
        actorPhone: { type: String, default: '', trim: true },
        amount: { type: Number, default: null },
        referenceId: { type: Schema.Types.ObjectId, default: null },
        readBy: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    },
    { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export const NotificationModel = model<TNotification>('Notification', notificationSchema);
