import { Types } from "mongoose";

// all possible transaction types across the platform
export type TTransactionType =
    | "deposit"          // recharge wallet top-up after deposit request approved
    | "withdrawal"       // user withdraws balance to mobile banking (debited when requested)
    | "withdrawal_refund" // a rejected withdrawal returned to the balance wallet
    | "daily_checkin"    // daily check-in bonus credited to balance wallet
    | "profit"           // product profit credited to balance wallet
    | "commission"       // referral / team commission credited to balance wallet
    | "product_purchase" // user buys a product (deducted from recharge wallet)
    | "new_user_bonus";  // one-time bonus on new user registration

// which wallet was affected by this transaction
export type TWalletAffected = "recharge" | "balance";

// direction of money flow from the user's perspective
export type TTransactionFlow = "credit" | "debit";

export type TTransaction = {
    // the user this transaction belongs to
    userId: Types.ObjectId;

    // what kind of transaction this is
    type: TTransactionType;

    // credit = money in, debit = money out
    flow: TTransactionFlow;

    // transaction amount in BDT
    amount: number;

    // which wallet was affected
    walletAffected: TWalletAffected;

    // optional reference to the source document (deposit request, product, task …)
    referenceId?: Types.ObjectId | null;

    // human-readable note shown in transaction history (e.g. "Daily check-in bonus")
    note: string;

    // wallet balance snapshot AFTER this transaction (useful for audit trail)
    balanceAfter: number;
};
