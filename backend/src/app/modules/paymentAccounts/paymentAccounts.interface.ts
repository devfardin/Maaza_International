import { Types } from "mongoose"

export type TPaymentAccounts = {
    // Basic information
    userId: Types.ObjectId;
    method: "bkash" | "nogod";
    accountNumber: string;
    accountHolderName: string;
    verifiedAt: boolean;
    status: 'active' | 'pending';
}