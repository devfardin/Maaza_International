import { model, Schema } from 'mongoose';
import { TWallet } from './wallet.interface';

const walletSchema = new Schema<TWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        walletType: {
            type: String,
            enum: {
                values: ['recharge', 'balance'],
                message: 'Wallet type must be either recharge or balance',
            },
            required: [true, 'Wallet type is required'],
        },
        balance: {
            type: Number,
            default: 0,
            min: [0, 'Balance cannot be negative'],
        },
        currency: {
            type: String,
            default: 'BDT',
            enum: ['BDT'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate wallet types per user
walletSchema.index({ userId: 1, walletType: 1 }, { unique: true });

export const WalletModel = model<TWallet>('Wallet', walletSchema);
