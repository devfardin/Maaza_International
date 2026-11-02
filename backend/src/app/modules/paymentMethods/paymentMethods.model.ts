import { model, Schema } from "mongoose";
import { TPaymentMethods } from "./paymentMethods.interface";

const paymentMethodsSchema = new Schema<TPaymentMethods>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Code is required"],
            trim: true,
            unique: true,
        },
        accountNumber: {
            type: String,
            required: [true, "Account number is required"],
            trim: true,
        },
        accountType: {
            type: String,
            enum: { values: ["Merchant", "Personal", "Agent"], message: "Account type must be Merchant, Personal, or Agent" },
            required: [true, "Account type is required"],
        },
        instructions: {
            type: String,
            required: [true, "Instructions are required"],
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const PaymentMethodsModel = model<TPaymentMethods>("PaymentMethod", paymentMethodsSchema);
