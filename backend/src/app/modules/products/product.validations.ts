import { z } from "zod";

const teamCommissionSchema = z.object({
    level: z.enum(["B", "C", "D"], { message: "Commission level must be B, C, or D" }),
    rate: z.number({ message: "Commission rate must be a number" }).min(0, "Rate cannot be negative").max(1, "Rate cannot exceed 1 (100%)"),
    basis: z.enum(["daily-income", "total-reward", "purchase-price"], { message: "Basis must be daily-income, total-reward, or purchase-price" }),
});

const productRewardSchema = z.object({
    dailyIncome: z.number({ message: "Daily income must be a number" }).nonnegative("Daily income cannot be negative"),
    validityDays: z.number({ message: "Validity days must be a number" }).int("Validity days must be a whole number").positive("Validity days must be greater than 0"),
    totalEstimatedRevenue: z.number({ message: "Total estimated revenue must be a number" }).nonnegative("Total estimated revenue cannot be negative"),
    frequency: z.enum(["daily", "weekly", "monthly"], { message: "Frequency must be daily, weekly, or monthly" }),
    startAfterPurchaseDays: z.number({ message: "Start after purchase days must be a number" }).int("Must be a whole number").nonnegative("Cannot be negative").default(0),
});

const productBonusSchema = z.object({
    invitationBonus: z.number({ message: "Invitation bonus must be a number" }).nonnegative("Invitation bonus cannot be negative").default(0),
    upgradeBonus: z.number({ message: "Upgrade bonus must be a number" }).nonnegative("Upgrade bonus cannot be negative").default(0),
});

const productPurchaseRulesSchema = z.object({
    purchaseLimit: z.number({ message: "Purchase limit must be a number" }).int("Purchase limit must be a whole number").positive("Purchase limit must be greater than 0"),
    allowedMembershipLevels: z.array(
        z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8)])
    ).min(1, "At least one membership level must be allowed"),
});

const createProductValidation = z.object({
    body: z.object({
        name: z.string({ message: "Product name is required" }).min(2, "Product name must be at least 2 characters"),
        category: z.string({ message: "Category is required" }).regex(/^[a-f\d]{24}$/i, "Category must be a valid ID"),
        description: z.string({ message: "Description is required" }).min(10, "Description must be at least 10 characters"),
        image: z.string({ message: "Image URL is required" }).url("Image must be a valid URL"),
        price: z.number({ message: "Price must be a number" }).positive("Price must be greater than 0"),
        points: z.number({ message: "Points must be a number" }).nonnegative("Points cannot be negative").default(0),
        rewardPlan: productRewardSchema,
        bonuses: productBonusSchema,
        teamCommissions: z.array(teamCommissionSchema).default([
            { level: "B", rate: 0.10, basis: "purchase-price" },
            { level: "C", rate: 0.05, basis: "purchase-price" },
            { level: "D", rate: 0.02, basis: "purchase-price" },
        ]).optional(),
        purchaseRules: productPurchaseRulesSchema,
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int("Sort order must be a whole number").default(0),
        status: z.enum(["active", "inactive", "outofstock"], { message: "Status must be active, inactive, or outofstock" }).default("active"),
    }),
});

export const ProductValidations = { createProductValidation };
