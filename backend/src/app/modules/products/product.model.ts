import { model, Schema } from "mongoose";
import { TProduct, TProductBonus, TProductPurchaseRules, TProductReward, TTeamCommission } from "./product.interface";

const teamCommissionSchema = new Schema<TTeamCommission>({
    level: {
        type: String,
        enum: ["B", "C", "D"],
        required: [true, "Commission level is required"],
    },
    rate: {
        type: Number,
        required: [true, "Commission rate is required"],
    },
    basis: {
        type: String,
        enum: ["daily-income", "total-reward", "purchase-price"],
        required: [true, "Commission basis is required"],
    },
}, { _id: false });

const productBonusSchema = new Schema<TProductBonus>({
    invitationBonus: {
        type: Number,
        required: [true, "Invitation bonus is required"],
        default: 0,
    },
    upgradeBonus: {
        type: Number,
        required: [true, "Upgrade bonus is required"],
        default: 0,
    },
}, { _id: false });

const productRewardSchema = new Schema<TProductReward>({
    dailyIncome: {
        type: Number,
        required: [true, "Daily income is required"],
    },
    validityDays: {
        type: Number,
        required: [true, "Validity days is required"],
    },
    totalEstimatedRevenue: {
        type: Number,
        required: [true, "Total estimated revenue is required"],
    },
    frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        required: [true, "Reward frequency is required"],
    },
    startAfterPurchaseDays: {
        type: Number,
        required: [true, "Start after purchase days is required"],
        default: 0,
    },
}, { _id: false });

const productPurchaseRulesSchema = new Schema<TProductPurchaseRules>({
    purchaseLimit: {
        type: Number,
        required: [true, "Purchase limit is required"],
    },
    allowedMembershipLevels: {
        type: [Number],
        required: [true, "Allowed membership levels are required"],
    },
}, { _id: false });

const productSchema = new Schema<TProduct>({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Product category is required"],
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true,
    },
    image: {
        type: String,
        required: [true, "Product image is required"],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
    },
    points: {
        type: Number,
        required: [true, "Product points are required"],
        default: 0,
    },
    quantity: {
        type: Number,
        required: [true, "Stock quantity is required"],
        min: [0, "Quantity cannot be negative"],
        default: 0,
    },
    rewardPlan: {
        type: productRewardSchema,
        required: [true, "Reward plan is required"],
    },
    bonuses: {
        type: productBonusSchema,
        required: [true, "Bonus configuration is required"],
    },
    teamCommissions: {
        type: [teamCommissionSchema],
        default: [
            { level: "B", rate: 0.10, basis: "daily-income" },
            { level: "C", rate: 0.05, basis: "daily-income" },
        ],
    },
    purchaseRules: {
        type: productPurchaseRulesSchema,
        required: [true, "Purchase rules are required"],
    },
    purchaseCount: {
        type: Number,
        default: 0,
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "outofstock"],
        default: "active",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const ProductModel = model<TProduct>("Product", productSchema);
