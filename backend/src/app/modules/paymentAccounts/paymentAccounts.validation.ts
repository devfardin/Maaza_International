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
        accountNumber: z.string().trim().optional(),
        accountHolderName: z.string().trim().min(2, "Account holder name is required").optional(),
        status: z.enum(["active", "inactive"], { message: "Status must be active or inactive" }).optional(),
    }),
});

export const PaymentAccountsValidations = {
    createPaymentAccountValidation,
    updatePaymentAccountValidation
};
