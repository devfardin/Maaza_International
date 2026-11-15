import z from 'zod';
import { moneySchema } from '../../utils/money';

const walletTypeParamValidation = z.object({
    params: z.object({
        walletType: z.enum(['recharge', 'balance']),
    }),
});

const exchangeWalletValidation = z.object({
    body: z
        .object({
            from: z.enum(['recharge', 'balance'], { message: 'Choose the wallet to move money from' }),
            to: z.enum(['recharge', 'balance'], { message: 'Choose the wallet to move money to' }),
            amount: moneySchema('Amount is required').positive('Amount must be greater than 0'),
        })
        .refine((body) => body.from !== body.to, { message: 'Choose two different wallets', path: ['to'] }),
});

export const WalletValidations = { walletTypeParamValidation, exchangeWalletValidation };
