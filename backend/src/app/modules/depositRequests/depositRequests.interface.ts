import { Types } from "mongoose";

export type TDepositRequest = {
    // User reference
    userId: Types.ObjectId;
    // Deposit amount
    amount: number;
    // Currency code
    currency: string;
    // Payment method code (e.g. bkash-157)
    methodCode: string;
    // Sender mobile number
    senderNumber: string;
    // Payment gateway transaction ID
    transactionId: string;
    // Request status
    status: "pending" | "approved" | "rejected";
    // Admin note on review
    adminNote: string;
    // Admin who approved/rejected
    approvedBy: Types.ObjectId | null;
};
