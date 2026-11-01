import z from "zod";

const createPaymentAccountValidation = z.object({
    body: z.object({
        userId: z.string({ message: "User ID is required" }),
        method: z.enum(["bkash", "nogod"], { message: "Payment method is required" }),
        accountNumber: z.string({ message: "Account number is required" }).trim(),
        accountHolderName: z.string({ message: "Account holder name is required" }).trim(),
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
