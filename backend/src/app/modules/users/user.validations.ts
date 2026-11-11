import z from "zod";

const phoneRegex = /^\+?[0-9]{11}$/;

const baseUserBody = {
    fullName: z
        .string({ message: "Full name is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(50, "Full name must not exceed 50 characters"),
    email: z.string({ message: "Email is required" }).trim().toLowerCase().email("Please provide a valid email address"),
    phone: z.string({ message: "Phone is required" }).trim().regex(phoneRegex, "Please provide a valid phone number (11 digits)"),
    // field name kept for frontend compatibility — the server hashes it
    passwordHash: z
        .string({ message: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must not exceed 72 characters"),
};

// PUBLIC registration. Only these keys are accepted — role / status /
// membershipLevel can NEVER be supplied by the client (zod strips unknown keys).
const createUserValidation = z.object({
    body: z.object({
        ...baseUserBody,
        referredBy: z.string().trim().max(30).optional(), // referral CODE of the inviter
    }),
});

// super_admin only: create an admin account
const createAdminValidation = z.object({
    body: z.object({ ...baseUserBody }),
});

// admin update of another user. Passwords and referral data are not editable here.
const updateUserValidation = z.object({
    body: z.object({
        fullName: z.string().trim().min(2).max(50).optional(),
        email: z.string().trim().toLowerCase().email().optional(),
        phone: z.string().trim().regex(phoneRegex, "Please provide a valid phone number (11 digits)").optional(),
        avatar: z.string().url("Avatar must be a valid URL").optional(),
        membershipLevel: z.number().int().min(1).max(8).optional(),
        role: z.enum(["user", "admin"]).optional(), // super_admin only — enforced in the service
    }).strict(),
});

const changeUserStatusValidation = z.object({
    body: z.object({
        status: z.enum(["active", "suspended", "blocked"]),
    }),
});

export const UserValidations = {
    createUserValidation,
    createAdminValidation,
    updateUserValidation,
    changeUserStatusValidation,
};
