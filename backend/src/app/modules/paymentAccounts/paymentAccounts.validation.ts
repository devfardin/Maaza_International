import z from "zod";

const createPaymentAccountValidation = z.object({
    body: z.object({
        method: z.enum(["bkash", "nogod"], { message: "Payment method is required" }),
        accountNumber: z.string({ message: "Account number is required" }).trim(),
        isPrimary: z.boolean().default(true),
        accountHolderName: z.string({ message: "Account holder name is required" }).trim(),
    }),
});

const updatePaymentAccountValidation = z.object({
    body: z.object({
        method: z.enum(["bkash", "nogod"]).optional(),
        accountNumber: z.string().trim().optional(),
        accountHolderName: z.string().trim().optional(),
        isPrimary: z.boolean().optional(),
        verifiedAt: z.date().optional(),
        status: z.enum(["active", "pending"]).optional(),
    }),
});

export const PaymentAccountsValidations = {
    createPaymentAccountValidation,
    updatePaymentAccountValidation
};
