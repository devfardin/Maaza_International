import { z } from 'zod';

const purchaseProductValidation = z.object({
    body: z.object({
        productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
        paymentSource: z.enum(['recharge', 'balance']),
    }),
});

export const ProductPurchaseValidations = {
    purchaseProductValidation,
};
