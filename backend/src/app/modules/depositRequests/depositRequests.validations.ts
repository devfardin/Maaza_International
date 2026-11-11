import z from "zod";

// user submits: amount (BDT), methodCode, senderNumber, transactionId.
// userId comes from the auth token; status / adminNote / approvedBy are set by the server.
const createDepositRequestValidation = z.object({
    body: z.object({
        amount: z.number({ message: "Amount is required" }).int("Amount must be a whole number").min(200, "Amount must be at least 200 BDT").max(1000000, "Amount is too large"),
        currency: z.literal("BDT").default("BDT"),
        methodCode: z.string({ message: "Method code is required" }).trim().min(1),
        senderNumber: z.string({ message: "Sender number is required" }).trim(),
        transactionId: z.string({ message: "Transaction ID is required" }).trim().min(4).max(60),
    }),
});

// admin submits: status (approved/rejected) and an optional note.
const updateDepositRequestStatusValidation = z.object({
    body: z.object({
        status: z.enum(["approved", "rejected"], { message: "Status must be approved or rejected" }),
        adminNote: z.string().trim().max(500).optional(),
    }),
});

export const DepositRequestValidations = {
    createDepositRequestValidation,
    updateDepositRequestStatusValidation,
};
