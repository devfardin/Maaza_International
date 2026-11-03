import z from 'zod';

const updateWalletValidation = z.object({
    body: z.object({
        rechargeBalance: z.number().min(0).optional(),
        balance: z.number().min(0).optional(),
        currency: z.string().optional(),
        status: z.enum(['active', 'suspended', 'closed']).optional(),
    }),
});

export const WalletValidations = { updateWalletValidation };
