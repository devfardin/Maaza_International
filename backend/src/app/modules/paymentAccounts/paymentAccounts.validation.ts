import z from "zod";

const createPaymentAccountValidation = z.object({
    body: z.object({
        userId: z.string({ required_error: "User ID is required" }),
        method: z.enum(["bkash", "nogod"], { required_error: "Payment method is required" }),
        accountNumber: z.string({ required_error: "Account number is required" }).trim(),
        accountHolderName: z.string({ required_error: "Account holder name is required" }).trim(),
        verifiedAt: z.boolean().default(false),
        status: z.enum(["active", "pending"]).default("pending"),
    }),
});

const updatePaymentAccountValidation = z.object({
    body: z.object({
        method: z.enum(["bkash", "nogod"]).optional(),
        accountNumber: z.string().trim().optional(),
        accountHolderName: z.string().trim().optional(),
        verifiedAt: z.boolean().optional(),
        status: z.enum(["active", "pending"]).optional(),
    }),
});

export const PaymentAccountsValidations = { createPaymentAccountValidation, updatePaymentAccountValidation };
