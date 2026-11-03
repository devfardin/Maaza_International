import { Types } from 'mongoose';

export type TWallet = {
    userId: Types.ObjectId;
    rechargeBalance: number;
    withdrawBalance: number;
    currency: string;
    status: 'active' | 'suspended' | 'closed';
};
