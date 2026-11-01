import { z } from "zod";

const productValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        category: z.string(),
        description: z.string().min(1),
        image: z.string().url(),
        price: z.number().positive(),
        points: z.number().nonnegative(),
        validityDays: z.number().positive(),
        dailyIncome: z.number().positive().nullable(),
        totalRevenue: z.number().positive().nullable(),
        purchaseLimit: z.number().positive(),
        allowedMembershipLevels: z.array(z.number()).min(1),
        status: z.enum(["active", "inactive"]).default("active"),
    }),
});


export const ProductValidations = { productValidationSchema };
