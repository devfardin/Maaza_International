import status from "http-status";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";
import { WalletModel } from "../wallets/wallet.model";
import { TransactionServices } from "../transactions/transaction.services";
import { TDepositRequest } from "./depositRequests.interface";
import { DepositRequestModel } from "./depositRequests.model";

// ─── User: Submit a new deposit request ───────────────────────────────────────
const createDepositRequest = async (payload: TDepositRequest) => {

    // check user exists
    const user = await UserModel.findById(payload.userId);
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found!");
    }

    // only regular users can submit deposit requests
    if (user.role !== "user") {
        throw new AppError(status.FORBIDDEN, "Only users can submit deposit requests!");
    }

    // prevent duplicate transaction ID
    const isDuplicate = await DepositRequestModel.findOne({ transactionId: payload.transactionId });
    if (isDuplicate) {
        throw new AppError(status.BAD_REQUEST, "This transaction ID has already been submitted!");
    }

    // validate sender number as a valid BD mobile number
    if (!/^01[3-9]\d{8}$/.test(payload.senderNumber)) {
        throw new AppError(status.BAD_REQUEST, "Please provide a valid sender mobile number!");
    }

    const result = await DepositRequestModel.create(payload);
    return result;
};

// ─── Admin: Get all deposit requests ──────────────────────────────────────────
const getAllDepositRequests = async () => {
    const result = await DepositRequestModel
        .find()
        .populate("userId", "fullName email phone")
        .populate("approvedBy", "fullName email")
        .sort({ createdAt: -1 });
    return result;
};

// ─── User: Get own deposit requests by user ID ────────────────────────────────
const getDepositRequestsByUser = async (userId: string) => {
    const result = await DepositRequestModel.find({ userId }).sort({ createdAt: -1 });
    return result;
};

// ─── Admin: Approve or reject a deposit request ───────────────────────────────
const updateDepositRequestStatus = async (
    id: string,
    payload: { status: "approved" | "rejected"; adminNote?: string; approvedBy: string }
) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // check the deposit request exists
        const depositRequest = await DepositRequestModel.findById(id).session(session);
        if (!depositRequest) {
            throw new AppError(status.NOT_FOUND, "Deposit request not found!");
        }

        // prevent re-processing an already reviewed request
        if (depositRequest.status !== "pending") {
            throw new AppError(status.BAD_REQUEST, `This request has already been ${depositRequest.status}!`);
        }

        // update the deposit request with new status, admin note, and reviewer
        const updatedRequest = await DepositRequestModel.findByIdAndUpdate(
            id,
            {
                status: payload.status,
                adminNote: payload.adminNote ?? (payload.status === "approved" ? "Approved by admin" : "Rejected by admin"),
                approvedBy: payload.approvedBy,
            },
            { new: true, session }
        );

        // if approved → credit the user's recharge wallet and log the transaction
        if (payload.status === "approved") {
            const wallet = await WalletModel.findOneAndUpdate(
                { userId: depositRequest.userId, walletType: "recharge" },
                { $inc: { balance: depositRequest.amount } },
                { new: true, session }
            );

            // wallet must exist (created during user registration)
            if (!wallet) {
                throw new AppError(status.NOT_FOUND, "User recharge wallet not found!");
            }

            // record the deposit transaction for the user's history
            await TransactionServices.recordTransaction({
                userId: depositRequest.userId,
                type: "deposit",
                flow: "credit",
                amount: depositRequest.amount,
                walletAffected: "recharge",
                balanceAfter: wallet.balance,
                note: "Recharge wallet top-up via deposit request",
                referenceId: depositRequest._id as mongoose.Types.ObjectId,
                session,
            });
        }

        await session.commitTransaction();
        return updatedRequest;

    } catch (error) {
        await session.abortTransaction();
        // re-throw AppErrors as-is so the global handler formats them correctly
        throw error;
    } finally {
        // always close the session
        await session.endSession();
    }
};

export const DepositRequestServices = {
    createDepositRequest,
    getAllDepositRequests,
    getDepositRequestsByUser,
    updateDepositRequestStatus,
};
