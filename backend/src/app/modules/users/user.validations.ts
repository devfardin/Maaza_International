import z from "zod";

const createUserValidation = z.object({
    body: z.object({
        fullName: z
            .string()
            .min(2, "Full name must be at least 2 characters")
            .max(50, "Full name must not exceed 50 characters"),

        email: z
            .string()
            .email("Please provide a valid email address")
            .optional(),

        phone: z
            .string()
            .regex(
                /^\+?[0-9]{11}$/,
                "Please provide a valid phone number (11 digits)"
            ),

        passwordHash: z
            .string()
            .min(8, "Password must be at least 8 characters"),

        referredBy: z.string().optional(),

        role: z.enum(["user", "admin", "super_admin"]).default("user"),

        status: z.enum(["active", "suspended", "blocked"]).default("active"),

        membershipLevel: z.number().int().min(1).default(1).optional(),

        avatar: z.string().url("Avatar must be a valid URL").optional(),
    }),
});

const updateUserValidation = z.object({
    body: z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(50).optional(),
        email: z.string().email("Please provide a valid email address").optional(),
        phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number").optional(),
        passwordHash: z.string().min(8, "Password must be at least 8 characters").optional(),
        referralCode: z.string().min(4).optional(),
        referredBy: z.string().optional(),
        role: z.enum(["user", "admin", "super_admin"]).optional(),
        status: z.enum(["active", "suspended", "blocked"]).optional(),
        membershipLevel: z.number().int().min(0).optional(),
        avatar: z.string().url("Avatar must be a valid URL").optional(),
        isDeleted: z.boolean().optional(),
    }),
});

export const UserValidations = { createUserValidation, updateUserValidation };