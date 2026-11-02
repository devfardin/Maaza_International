import { model, Schema } from "mongoose";
import { TPaymentAccounts } from "./paymentAccounts.interface";

const paymentAccountsSchema = new Schema<TPaymentAccounts>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        method: {
            type: String,
            enum: { values: ["bkash", "nogod"], message: "Method must be bkash or nogod" },
            required: [true, "Payment method is required"],
        },
        accountNumber: {
            type: Number,
            required: [true, "Account number is required"],
            trim: true,
        },
        isPrimary: {
            type: Boolean,
            default: true,
        },
        accountHolderName: {
            type: String,
            required: [true, "Account holder name is required"],
            trim: true,
        },
        verifiedAt: {
        type: Date,
        default: null,
    },
        status: {
            type: String,
            enum: ["active", "pending"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const PaymentAccountsModel = model<TPaymentAccounts>("PaymentAccount", paymentAccountsSchema);
