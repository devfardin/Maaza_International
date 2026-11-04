import z from "zod";

// user submits: userId, amount, methodCode, senderNumber, transactionId
// status / adminNote / approvedBy are set by the server — not accepted from the client
const createDepositRequestValidation = z.object({
    body: z.object({
        userId: z.string({ message: "User ID is required" }),
        amount: z.number({ message: "Amount is required" }).min(200, "Amount must be at least 200 BDT"),
        currency: z.string().trim().default("BDT"),
        methodCode: z.string({ message: "Method code is required" }).trim(),
        senderNumber: z.string({ message: "Sender number is required" }).trim(),
        transactionId: z.string({ message: "Transaction ID is required" }).trim(),
    }),
});

// admin submits: status (approved/rejected), optional adminNote, approvedBy (admin ID)
const updateDepositRequestStatusValidation = z.object({
    body: z.object({
        status: z.enum(["approved", "rejected"], { message: "Status must be approved or rejected" }),
        adminNote: z.string().trim().optional(),
        approvedBy: z.string({ message: "Admin ID (approvedBy) is required" }),
    }),
});

export const DepositRequestValidations = {
    createDepositRequestValidation,
    updateDepositRequestStatusValidation,
};
