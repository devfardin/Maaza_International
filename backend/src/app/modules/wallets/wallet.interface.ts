import { Types } from 'mongoose';

export type TWalletType = 'recharge' | 'balance';

export type TWallet = {
    userId: Types.ObjectId;
    walletType: TWalletType;
    balance: number;
    currency: 'BDT';
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};
