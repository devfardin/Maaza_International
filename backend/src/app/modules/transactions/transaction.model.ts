import { model, Schema } from "mongoose";
import { TTransaction } from "./transaction.interface";

const transactionSchema = new Schema<TTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        type: {
            type: String,
            enum: {
                values: ["deposit", "withdrawal", "daily_checkin", "profit", "commission", "product_purchase", "new_user_bonus"],
                message: "Invalid transaction type",
            },
            required: [true, "Transaction type is required"],
        },
        flow: {
            type: String,
            enum: {
                values: ["credit", "debit"],
                message: "Flow must be credit or debit",
            },
            required: [true, "Transaction flow is required"],
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [1, "Amount must be at least 1 BDT"],
        },
        walletAffected: {
            type: String,
            enum: {
                values: ["recharge", "balance"],
                message: "Wallet must be recharge or balance",
            },
            required: [true, "Wallet affected is required"],
        },
        // optional — links back to the source document (e.g. DepositRequest, Product)
        referenceId: {
            type: Schema.Types.ObjectId,
            default: null,
        },
        note: {
            type: String,
            required: [true, "Note is required"],
            trim: true,
        },
        // balance snapshot after this transaction for audit purposes
        balanceAfter: {
            type: Number,
            required: [true, "Balance after is required"],
        },
    },
    { timestamps: true } // createdAt acts as the transaction timestamp
);

// index for fast per-user history queries sorted by newest first
transactionSchema.index({ userId: 1, createdAt: -1 });

export const TransactionModel = model<TTransaction>("Transaction", transactionSchema);
