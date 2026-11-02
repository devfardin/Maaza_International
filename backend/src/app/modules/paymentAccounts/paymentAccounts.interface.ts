import { Types } from "mongoose"

export type TPaymentAccounts = {
    // Basic information
    userId: Types.ObjectId;
    method: "bkash" | "nogod";
    accountNumber: number;
    isPrimary: boolean;
    accountHolderName: string;
    verifiedAt: Date | null;
    status: 'active' | 'pending';
}