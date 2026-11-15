import { Types } from "mongoose";

// Membership levels
export type TMembershipLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Product status
export type TProductStatus = "active" | "inactive" | "outofstock";


// Team commission configuration
export type TTeamCommission = {
    level: "A" | "B"; // A = buyer's direct inviter, B = the inviter's inviter
    rate: number; // Example: 0.10 = 10%
    basis: "daily-income" | "total-reward" | "purchase-price";
};

// Product bonus configuration
export type TProductBonus = {
    invitationBonus: number;
    upgradeBonus: number;
};

// Product reward configuration
export type TProductReward = {
    dailyIncome: number;
    validityDays: number;
    totalEstimatedRevenue: number;
    frequency: "daily" | "weekly" | "monthly";
    startAfterPurchaseDays: number;
    claimUnit?: "hour" | "day";  // hourly products claim every N hours, daily products every N days
    claimIntervalHours?: number; // used when claimUnit = "hour"
    claimIntervalDays: number;   // used when claimUnit = "day": each claim pays the income of N days
};

// Product purchase restrictions
export type TProductPurchaseRules = {
    purchaseLimit: number;
    allowedMembershipLevels: TMembershipLevel[];
};

// Main product type
export type TProduct = {
    // Basic information
    name: string;
    category: Types.ObjectId;

    description: string;

    // Product media
    image: string;

    // Pricing
    price: number;
    points: number;

    // Stock management — decremented atomically on every purchase
    quantity: number;

    // Reward information
    rewardPlan: TProductReward;

    // Bonuses
    bonuses: TProductBonus;

    // Team commission
    teamCommissions: TTeamCommission[];


    // Purchase restrictions
    purchaseRules: TProductPurchaseRules;

    // Product statistics
    purchaseCount: number;
    viewCount: number;

    // Product display settings
    isFeatured: boolean;
    sortOrder: number;

    // Product status
    status: TProductStatus;
    isDeleted: boolean;

    // Approval: products added by an admin wait for a super admin before members can see them
    approvalStatus?: "pending" | "approved" | "rejected";
    createdBy?: Types.ObjectId;
    approvedBy?: Types.ObjectId | null;
    approvedAt?: Date | null;
};
