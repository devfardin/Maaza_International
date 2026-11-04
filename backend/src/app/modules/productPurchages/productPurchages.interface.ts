import { Types } from "mongoose";

export type TPaymentSource = "recharge" | "balance";

export type TPurchaseStatus =
  | "active"
  | "completed"
  | "cancelled";

export type TTeamLevel = "B" | "C" | "D";

export type TReferralSnapshot = {
  level: TTeamLevel;
  userId: Types.ObjectId;
  commissionRate: number;
};

export type TProductPurchase = {
  userId: Types.ObjectId;
  productId: Types.ObjectId;

  // Purchase price snapshot
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;

  // Which wallet paid for this purchase
  paymentSource: TPaymentSource;

  // Reward configuration snapshot
  dailyIncome: number;
  validityDays: number;
  totalEstimatedRevenue: number;

  // Daily claim schedule
  purchasedAt: Date;
  nextClaimAt: Date;
  lastClaimAt: Date | null;
  totalClaimedDays: number;

  // Referral chain at purchase time
  referralChain: TReferralSnapshot[];

  status: TPurchaseStatus;
};