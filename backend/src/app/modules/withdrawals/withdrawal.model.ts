import { model, Schema, Types } from 'mongoose';

export type TWithdrawalStatus = 'pending' | 'approved' | 'rejected';

export type TWithdrawal = {
    userId: Types.ObjectId;
    // poisha, integer
    amount: number;
    currency: 'BDT';
    // payout destination snapshot — copied so later edits to the saved account don't change history
    method: 'bkash' | 'nogod';
    accountNumber: string;
    accountHolderName: string;
    status: TWithdrawalStatus;
    adminNote: string;
    // optional payout reference typed by the admin after sending the money
    payoutReference: string;
    processedBy: Types.ObjectId | null;
    processedAt: Date | null;
};

const withdrawalSchema = new Schema<TWithdrawal>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        amount: { type: Number, required: true, min: [10000, 'Minimum withdrawal is 100 BDT'] },
        currency: { type: String, enum: ['BDT'], default: 'BDT' },
        method: { type: String, enum: ['bkash', 'nogod'], required: true },
        accountNumber: { type: String, required: true, trim: true },
        accountHolderName: { type: String, required: true, trim: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        adminNote: { type: String, default: '', trim: true },
        payoutReference: { type: String, default: '', trim: true },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        processedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });

export const WithdrawalModel = model<TWithdrawal>('Withdrawal', withdrawalSchema);
