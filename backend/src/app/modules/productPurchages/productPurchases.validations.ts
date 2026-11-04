import { z } from 'zod';

const purchaseProductValidation = z.object({
    body: z.object({
        productId: z.string(),
        paymentSource: z.enum(['recharge', 'balance']),
    }),
});

export const ProductPurchaseValidations = {
    purchaseProductValidation,
};
