import status from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import config from "../../config";
import { BDT, MIN_DEPOSIT, WELCOME_BONUS } from "../../config/constants";
import { sendEmail } from "../../utils/sendEmail";
import { UserModel } from "../users/user.model";
import { WalletModel } from "../wallets/wallet.model";
import { TransactionServices } from "../transactions/transaction.services";
import { DepositRequestModel } from "./depositRequests.model";

type TCreatePayload = {
    amount: number; // BDT from the client
    currency?: string;
    methodCode: string;
    senderNumber: string;
    transactionId: string;
};

// ─── User: Submit a new deposit request ───────────────────────────────────────
const createDepositRequest = async (userId: string, payload: TCreatePayload) => {
    const user = await UserModel.findById(userId);
    if (!user || user.isDeleted) {
        throw new AppError(status.NOT_FOUND, "User not found!");
    }
    if (user.role !== "user") {
        throw new AppError(status.FORBIDDEN, "Only users can submit deposit requests!");
    }

    if (!/^01[3-9]\d{8}$/.test(payload.senderNumber)) {
        throw new AppError(status.BAD_REQUEST, "Please provide a valid sender mobile number!");
    }

    // money is stored in poisha everywhere
    const amount = Math.round(payload.amount * BDT);
    if (amount < MIN_DEPOSIT) {
        throw new AppError(status.BAD_REQUEST, "Amount must be at least 200 BDT");
    }

    // limit how many unreviewed requests a user can stack up
    const pending = await DepositRequestModel.countDocuments({ userId, status: "pending" });
    if (pending >= 5) {
        throw new AppError(status.TOO_MANY_REQUESTS, "You already have 5 pending deposit requests. Please wait for review.");
    }

    // the unique index on transactionId is the real guard against races (E11000 → 409 below)
    try {
        return await DepositRequestModel.create({
            userId,
            amount,
            currency: "BDT",
            methodCode: payload.methodCode,
            senderNumber: payload.senderNumber,
            transactionId: payload.transactionId,
        });
    } catch (err: any) {
        if (err?.code === 11000) {
            throw new AppError(status.CONFLICT, "This transaction ID has already been submitted!");
        }
        throw err;
    }
};

// ─── Admin: Get all deposit requests ──────────────────────────────────────────
const getAllDepositRequests = async () => {
    return DepositRequestModel
        .find()
        .populate("userId", "fullName email phone")
        .populate("approvedBy", "fullName email")
        .sort({ createdAt: -1 });
};

// ─── User: Get own deposit requests ───────────────────────────────────────────
const getDepositRequestsByUser = async (userId: string) => {
    return DepositRequestModel.find({ userId }).sort({ createdAt: -1 });
};

// ─── Admin: Approve or reject a deposit request ───────────────────────────────
const updateDepositRequestStatus = async (
    id: string,
    payload: { status: "approved" | "rejected"; adminNote?: string },
    adminId: string
) => {
    const session = await mongoose.startSession();
    let updatedRequest;
    let welcomeBonusPaid = false;

    try {
        session.startTransaction();

        // Atomic "pending → reviewed" flip: two admins clicking at once can only win once,
        // so the wallet can never be credited twice.
        updatedRequest = await DepositRequestModel.findOneAndUpdate(
            { _id: id, status: "pending" },
            {
                status: payload.status,
                adminNote: payload.adminNote ?? (payload.status === "approved" ? "Approved by admin" : "Rejected by admin"),
                approvedBy: adminId,
            },
            { new: true, session }
        );

        if (!updatedRequest) {
            const existing = await DepositRequestModel.findById(id).session(session);
            if (!existing) throw new AppError(status.NOT_FOUND, "Deposit request not found!");
            throw new AppError(status.BAD_REQUEST, `This request has already been ${existing.status}!`);
        }

        if (payload.status === "approved") {
            // 1. credit the deposit
            const wallet = await WalletModel.findOneAndUpdate(
                { userId: updatedRequest.userId, walletType: "recharge" },
                { $inc: { balance: updatedRequest.amount } },
                { new: true, session }
            );
            if (!wallet) throw new AppError(status.NOT_FOUND, "User recharge wallet not found!");

            await TransactionServices.recordTransaction({
                userId: updatedRequest.userId,
                type: "deposit",
                flow: "credit",
                amount: updatedRequest.amount,
                walletAffected: "recharge",
                balanceAfter: wallet.balance,
                note: "Recharge wallet top-up via deposit request",
                referenceId: updatedRequest._id as mongoose.Types.ObjectId,
                session,
            });

            // 2. one-time welcome bonus on the user's FIRST approved deposit.
            //    The conditional update makes it impossible to pay twice.
            const bonusUser = await UserModel.findOneAndUpdate(
                { _id: updatedRequest.userId, welcomeBonusClaimed: { $ne: true } },
                { welcomeBonusClaimed: true },
                { session }
            );
            if (bonusUser) {
                const bonusWallet = await WalletModel.findOneAndUpdate(
                    { userId: updatedRequest.userId, walletType: "recharge" },
                    { $inc: { balance: WELCOME_BONUS } },
                    { new: true, session }
                );
                if (!bonusWallet) throw new AppError(status.NOT_FOUND, "User recharge wallet not found!");

                await TransactionServices.recordTransaction({
                    userId: updatedRequest.userId,
                    type: "new_user_bonus",
                    flow: "credit",
                    amount: WELCOME_BONUS,
                    walletAffected: "recharge",
                    balanceAfter: bonusWallet.balance,
                    note: "Welcome bonus on first deposit",
                    referenceId: updatedRequest._id as mongoose.Types.ObjectId,
                    session,
                });
                welcomeBonusPaid = true;
            }
        }

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    // Email is sent AFTER the commit and can never fail / roll back the approval
    if (payload.status === "approved") {
        const user = await UserModel.findById(updatedRequest.userId);
        if (user?.email) {
            const amountBDT = (updatedRequest.amount / BDT).toFixed(2);
            const bonusLine = welcomeBonusPaid
                ? `<p>🎁 We also added your <strong>৳${(WELCOME_BONUS / BDT).toFixed(0)}</strong> welcome bonus!</p>`
                : "";
            sendEmail({
                to: user.email,
                subject: "Deposit Approved — Maaza International",
                heading: "Your Deposit Has Been Approved!",
                subheading: `৳${amountBDT} has been credited to your recharge wallet.`,
                body: `
                    <p>Great news, <strong>${escapeHtml(user.fullName)}</strong>!</p>
                    <p>Your deposit of <strong>৳${amountBDT}</strong> has been reviewed and approved.</p>
                    <p>Transaction ID: ${escapeHtml(updatedRequest.transactionId)}</p>
                    ${bonusLine}
                `,
                button: { label: "Go to Dashboard", url: `${config.frontend_url}/dashboard` },
                footerNote: "If you did not submit this deposit request, please contact support immediately.",
            }).catch((err) => console.error("Deposit email failed", err));
        }
    }

    return updatedRequest;
};

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export const DepositRequestServices = {
    createDepositRequest,
    getAllDepositRequests,
    getDepositRequestsByUser,
    updateDepositRequestStatus,
};
