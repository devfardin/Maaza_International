import z from "zod";

// validation for creating a deposit request
const createDepositRequestValidation = z.object({
    body: z.object({
        userId: z.string({ message: "User ID is required" }),
        amount: z.number({ message: "Amount is required" }).min(200, "Amount must be at least 200 BDT"),
        currency: z.string().trim().default("BDT"),
        methodCode: z.string({ message: "Method code is required" }).trim(),
        senderNumber: z.string({ message: "Sender number is required" }).trim(),
        transactionId: z.string({ message: "Transaction ID is required" }).trim(),
        status: z.enum(["pending", "approved", "rejected"]).default("pending"),
        adminNote: z.string().trim().default(""),
        approvedBy: z.string().nullable().default(null),
    }),
});

// validation for updating deposit request status (admin)
const updateDepositRequestStatusValidation = z.object({
    body: z.object({
        status: z.enum(["approved", "rejected"], { message: "Status must be approved or rejected" }),
        adminNote: z.string().trim().optional(),
        approvedBy: z.string({ message: "Approved by (admin ID) is required" }),
    }),
});

export const DepositRequestValidations = {
    createDepositRequestValidation,
    updateDepositRequestStatusValidation,
};
