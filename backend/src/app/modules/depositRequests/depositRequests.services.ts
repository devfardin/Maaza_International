import status from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";
import { TDepositRequest } from "./depositRequests.interface";
import { DepositRequestModel } from "./depositRequests.model";
import { WalletModel } from "../wallets/wallet.model";

// create a new deposit request
const createDepositRequest = async (payload: TDepositRequest) => {

    // check user exists
    const isUserExist = await UserModel.findById(payload.userId);
    if (!isUserExist) {
        throw new AppError(status.NOT_FOUND, "User not found!");
    }

    // only regular users can submit deposit requests
    if (isUserExist.role !== "user") {
        throw new AppError(status.UNAUTHORIZED, "Only users can submit deposit requests!");
    }

    // prevent duplicate transaction ID
    const isDuplicate = await DepositRequestModel.findOne({ transactionId: payload.transactionId });
    if (isDuplicate) {
        throw new AppError(status.BAD_REQUEST, "This transaction ID already submited!");
    }

    // validate sender number as a valid BD mobile number
    if (!/^01[3-9]\d{8}$/.test(payload.senderNumber)) {
        throw new AppError(status.BAD_REQUEST, "Please provide a valid sender mobile number!");
    }

    const result = await DepositRequestModel.create(payload);
    return result;
};

// get all deposit requests (admin)
const getAllDepositRequests = async () => {
    const result = await DepositRequestModel.find().populate("userId", "fullName email phone").populate("approvedBy", "fullName email");
    return result;
};

// get deposit requests by user ID
const getDepositRequestsByUser = async (userId: string) => {
    const result = await DepositRequestModel.find({ userId }).sort({ createdAt: -1 });
    return result;
};


// update deposit request status (admin approve/reject)
const updateDepositRequestStatus = async (
    id: string,
    payload: { status: "approved" | "rejected"; adminNote?: string; approvedBy: string }
) => {
    // check request exists
    const isExist = await DepositRequestModel.findById(id);
    if (!isExist) {
        throw new AppError(status.NOT_FOUND, "Deposit request not found!");
    }

    // only pending requests can be reviewed
    // if (isExist.status !== "pending") {
    //     throw new AppError(status.BAD_REQUEST, "This request has already been reviewed!");
    // }

    const updateData = {
        status: payload.status,
        adminNote: payload.status === "approved" ? "Recharge approved by admin" : (payload.adminNote || ""),
        approvedBy: payload.approvedBy,
    };

    const result = await DepositRequestModel.findByIdAndUpdate(id, updateData, { new: true });

    if (payload.status === "approved") {
        await WalletModel.findOneAndUpdate(
            { userId: isExist.userId },
            { $inc: { rechargeBalance: isExist.amount } }
        );
    } else if(payload.status === "rejected"){
        await WalletModel.findOneAndUpdate(
            { userId: isExist.userId },
            { $inc: { rechargeBalance: -isExist.amount } }
        );
    }
    return result;
};

export const DepositRequestServices = {
    createDepositRequest,
    getAllDepositRequests,
    getDepositRequestsByUser,
    updateDepositRequestStatus,
};
