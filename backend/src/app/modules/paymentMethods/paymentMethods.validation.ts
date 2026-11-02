import z from "zod";

const createPaymentMethodValidation = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).trim(),
        code: z.string({ message: "Code is required" }).trim(),
        accountNumber: z.string({ message: "Account number is required" }).trim(),
        accountType: z.enum(["Merchant", "Personal", "Agent"], { message: "Account type must be Merchant, Personal, or Agent" }),
        instructions: z.string({ message: "Instructions are required" }).trim(),
        isActive: z.boolean().default(true),
    }),
});

const updatePaymentMethodValidation = z.object({
    body: z.object({
        name: z.string().trim().optional(),
        code: z.string().trim().optional(),
        accountNumber: z.string().trim().optional(),
        accountType: z.enum(["Merchant", "Personal", "Agent"]).optional(),
        instructions: z.string().trim().optional(),
        isActive: z.boolean().optional(),
    }),
});

export const PaymentMethodsValidations = {
    createPaymentMethodValidation,
    updatePaymentMethodValidation,
};
