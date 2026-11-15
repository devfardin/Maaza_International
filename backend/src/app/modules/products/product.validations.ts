import { z } from "zod";
import { moneySchema } from "../../utils/money";

const teamCommissionSchema = z.object({
    level: z.enum(["A", "B"], { message: "Commission level must be A or B" }),
    rate: z.number({ message: "Commission rate must be a number" }).min(0, "Rate cannot be negative").max(1, "Rate cannot exceed 1 (100%)"),
    basis: z.enum(["daily-income", "total-reward", "purchase-price"], { message: "Basis must be daily-income, total-reward, or purchase-price" }),
});

const productRewardSchema = z.object({
    dailyIncome: moneySchema("Daily income must be a number").nonnegative("Daily income cannot be negative"),
    validityDays: z.number({ message: "Validity days must be a number" }).int("Validity days must be a whole number").positive("Validity days must be greater than 0"),
    totalEstimatedRevenue: moneySchema("Total estimated revenue must be a number").nonnegative("Total estimated revenue cannot be negative"),
    frequency: z.enum(["daily", "weekly", "monthly"], { message: "Frequency must be daily, weekly, or monthly" }).default("daily"),
    startAfterPurchaseDays: z.number({ message: "Start after purchase days must be a number" }).int("Must be a whole number").nonnegative("Cannot be negative").default(0),
    // "hour": a claim every N hours. "day": a claim every N days (product variant type).
    claimUnit: z.enum(["hour", "day"], { message: "Claim unit must be hour or day" }).default("day"),
    claimIntervalHours: z.number({ message: "Claim interval must be a number" }).int("Claim interval must be a whole number of hours").min(1, "Claim interval must be at least 1 hour").max(720, "Claim interval cannot exceed 720 hours").default(1),
    claimIntervalDays: z.number({ message: "Claim interval must be a number" }).int("Claim interval must be a whole number of days").min(1, "Claim interval must be at least 1 day").max(30, "Claim interval cannot exceed 30 days").default(1),
});

const productBonusSchema = z.object({
    invitationBonus: moneySchema("Invitation bonus must be a number").nonnegative("Invitation bonus cannot be negative").default(0),
    upgradeBonus: moneySchema("Upgrade bonus must be a number").nonnegative("Upgrade bonus cannot be negative").default(0),
});

const productPurchaseRulesSchema = z.object({
    purchaseLimit: z.number({ message: "Purchase limit must be a number" }).int("Purchase limit must be a whole number").positive("Purchase limit must be greater than 0"),
    allowedMembershipLevels: z.array(
        z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)])
    ).min(1, "At least one membership level must be allowed"),
});

// NOTE: the image is uploaded as a file (multipart) — it is not part of the JSON.
// All money values (price, dailyIncome, bonuses …) are in BDT, up to 2 decimals.
const productBody = z.object({
    name: z.string({ message: "Product name is required" }).trim().min(2, "Product name must be at least 2 characters"),
    category: z.string({ message: "Category is required" }).regex(/^[a-f\d]{24}$/i, "Category must be a valid ID"),
    description: z.string({ message: "Description is required" }).trim().min(10, "Description must be at least 10 characters"),
    price: moneySchema("Price must be a number").positive("Price must be greater than 0"),
    points: z.number({ message: "Points must be a number" }).nonnegative("Points cannot be negative").default(0),
    quantity: z.number({ message: "Stock quantity is required" }).int("Quantity must be a whole number").nonnegative("Quantity cannot be negative"),
    rewardPlan: productRewardSchema,
    bonuses: productBonusSchema,
    teamCommissions: z.array(teamCommissionSchema).optional(),
    purchaseRules: productPurchaseRulesSchema,
    isFeatured: z.boolean().default(false),
    sortOrder: z.number().int("Sort order must be a whole number").default(0),
    status: z.enum(["active", "inactive", "outofstock"], { message: "Status must be active, inactive, or outofstock" }).default("active"),
});

const createProductValidation = z.object({ body: productBody });

// partial update — purchaseCount / viewCount / isDeleted / image can't be set through it
const updateProductValidation = z.object({
    body: productBody.partial().extend({
        // .partial() keeps the defaults; make sure omitted keys stay omitted
        points: z.number().nonnegative().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        status: z.enum(["active", "inactive", "outofstock"]).optional(),
    }),
});

export const ProductValidations = { createProductValidation, updateProductValidation };
