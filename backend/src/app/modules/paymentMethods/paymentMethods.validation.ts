import z from "zod";

// Money-free, but the rich-text fields are capped so one record can't blow up the API.
const richText = z.string().max(20000, "Text is too long").trim();

const createPaymentMethodValidation = z.object({
    body: z.object({
        name: z.string({ message: "Name is required" }).trim().min(2, "Name must be at least 2 characters").max(60),
        code: z.string().trim().regex(/^[a-z0-9-]+$/, "Code may only contain lowercase letters, numbers and dashes").max(40).optional(),
        accountNumber: z.string({ message: "Account number is required" }).trim().min(3, "Account number is required").max(120),
        accountType: z.enum(["Merchant", "Personal", "Agent"], { message: "Account type must be Merchant, Personal, or Agent" }),
        description: richText.optional().default(""),
        instructions: richText.optional().default(""),
        isActive: z.boolean().default(true),
    }),
});

const updatePaymentMethodValidation = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(60).optional(),
        code: z.string().trim().regex(/^[a-z0-9-]+$/, "Code may only contain lowercase letters, numbers and dashes").max(40).optional(),
        accountNumber: z.string().trim().min(3).max(120).optional(),
        accountType: z.enum(["Merchant", "Personal", "Agent"]).optional(),
        description: richText.optional(),
        instructions: richText.optional(),
        isActive: z.boolean().optional(),
    }),
});

export const PaymentMethodsValidations = {
    createPaymentMethodValidation,
    updatePaymentMethodValidation,
};
