import z from 'zod';

const walletTypeParamValidation = z.object({
    params: z.object({
        walletType: z.enum(['recharge', 'balance']),
    }),
});

export const WalletValidations = { walletTypeParamValidation };
