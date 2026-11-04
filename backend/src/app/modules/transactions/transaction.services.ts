import status from "http-status";
import { ClientSession, Types } from "mongoose";
import AppError from "../../errors/AppError";
import { TTransactionFlow, TTransactionType, TWalletAffected } from "./transaction.interface";
import { TransactionModel } from "./transaction.model";

// ─── Payload type for recording a transaction ─────────────────────────────────
type TRecordTransactionPayload = {
    userId: string | Types.ObjectId;
    type: TTransactionType;
    flow: TTransactionFlow;
    amount: number;
    walletAffected: TWalletAffected;
    balanceAfter: number;
    note: string;
    referenceId?: string | Types.ObjectId | null;
    session?: ClientSession; // pass a session when called inside a DB transaction
};

// ─── Core helper: called internally from other services ───────────────────────
// Every feature (deposit, withdrawal, purchase …) calls this to log a record.
const recordTransaction = async (payload: TRecordTransactionPayload) => {
    const doc = {
        userId: payload.userId,
        type: payload.type,
        flow: payload.flow,
        amount: payload.amount,
        walletAffected: payload.walletAffected,
        balanceAfter: payload.balanceAfter,
        note: payload.note,
        referenceId: payload.referenceId ?? null,
    };

    // insertMany returns an array; we use it so we can pass a session
    const [result] = await TransactionModel.insertMany([doc], {
        session: payload.session,
    });

    return result;
};

// ─── Get full transaction history for a user ──────────────────────────────────
const getUserTransactions = async (userId: string) => {
    const result = await TransactionModel
        .find({ userId })
        .sort({ createdAt: -1 }); // newest first
    return result;
};

// ─── Get transactions filtered by type (e.g. only deposits) ──────────────────
const getUserTransactionsByType = async (userId: string, type: TTransactionType) => {
    const result = await TransactionModel
        .find({ userId, type })
        .sort({ createdAt: -1 });
    return result;
};

// ─── Admin: get all transactions across all users ─────────────────────────────
const getAllTransactions = async () => {
    const result = await TransactionModel
        .find()
        .populate("userId", "fullName email phone")
        .sort({ createdAt: -1 });
    return result;
};

// ─── Get a single transaction by ID ───────────────────────────────────────────
const getSingleTransaction = async (id: string) => {
    const result = await TransactionModel.findById(id).populate("userId", "fullName email phone");
    if (!result) {
        throw new AppError(status.NOT_FOUND, "Transaction not found!");
    }
    return result;
};

export const TransactionServices = {
    recordTransaction,   // used internally by other services — not exposed as API
    getUserTransactions,
    getUserTransactionsByType,
    getAllTransactions,
    getSingleTransaction,
};
