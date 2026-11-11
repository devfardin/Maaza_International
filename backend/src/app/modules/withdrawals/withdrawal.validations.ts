import z from 'zod';

// amount is whole BDT from the client; the server converts it to poisha
const createWithdrawalValidation = z.object({
    body: z.object({
        amount: z
            .number({ message: 'Amount is required' })
            .int('Amount must be a whole number of BDT')
            .min(100, 'Minimum withdrawal is 100 BDT')
            .max(1000000, 'Amount is too large'),
        paymentAccountId: z.string({ message: 'Select a payout account' }).min(1, 'Select a payout account'),
    }),
});

const updateWithdrawalStatusValidation = z.object({
    body: z.object({
        status: z.enum(['approved', 'rejected'], { message: 'Status must be approved or rejected' }),
        adminNote: z.string().trim().max(500).optional(),
        payoutReference: z.string().trim().max(100).optional(),
    }),
});

export const WithdrawalValidations = { createWithdrawalValidation, updateWithdrawalStatusValidation };
