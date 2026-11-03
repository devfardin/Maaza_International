import { model, Schema } from 'mongoose';
import { TWallet } from './wallet.interface';

const walletSchema = new Schema<TWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
        },
        rechargeBalance: {
            type: Number,
            default: 0,
            min: [0, 'Recharge balance cannot be negative'],
        },
        withdrawBalance: {
            type: Number,
            default: 0,
            min: [0, 'Balance cannot be negative'],
        },
        currency: {
            type: String,
            default: 'BDT',
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'suspended', 'closed'],
            default: 'active',
        },
    },
    { timestamps: true }
);

export const WalletModel = model<TWallet>('Wallet', walletSchema);
