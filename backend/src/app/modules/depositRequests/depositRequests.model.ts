import { model, Schema } from "mongoose";
import { TDepositRequest } from "./depositRequests.interface";

const depositRequestSchema = new Schema<TDepositRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [20000, "Amount must be at least 200 BDT"], // stored in poisha
        },
        currency: {
            type: String,
            required: [true, "Currency is required"],
            trim: true,
            default: "BDT",
        },
        methodCode: {
            type: String,
            required: [true, "Method code is required"],
            trim: true,
        },
        senderNumber: {
            type: String,
            required: [true, "Sender number is required"],
            trim: true,
        },
        transactionId: {
            type: String,
            required: [true, "Transaction ID is required"],
            trim: true,
            unique: true,
        },
        status: {
            type: String,
            enum: { values: ["pending", "approved", "rejected"], message: "Status must be pending, approved, or rejected" },
            default: "pending",
        },
        adminNote: {
            type: String,
            default: "",
            trim: true,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

export const DepositRequestModel = model<TDepositRequest>("DepositRequest", depositRequestSchema);
