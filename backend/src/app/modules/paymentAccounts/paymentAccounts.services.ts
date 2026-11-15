import status from "http-status";
import { Types } from "mongoose";
import { TPaymentAccounts } from "./paymentAccounts.interface";
import { PaymentAccountsModel } from "./paymentAccounts.model";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";

// A user may hold at most one bKash and one Nagad account.
const MAX_ACCOUNTS_PER_USER = 2;
const BD_MOBILE = /^01[3-9]\d{8}$/; // starts with 01, 11 digits in total

const methodLabel = (method: string) => (method === "bkash" ? "bKash" : "Nagad");

// create payment account (one per method per user; a new account starts active)
const createPaymentAccount = async (payload: TPaymentAccounts) => {
    const user = await UserModel.findOne({ _id: payload.userId, isDeleted: false });
    if (!user) throw new AppError(status.NOT_FOUND, "This user is not found!");
    if (user.role !== "user") throw new AppError(status.UNAUTHORIZED, "Only users can create payment accounts!");

    if (!BD_MOBILE.test(payload.accountNumber)) {
        throw new AppError(status.BAD_REQUEST, `Please provide a valid ${methodLabel(payload.method)} number: it must start with 01 and have 11 digits.`);
    }

    const existing = await PaymentAccountsModel.find({ userId: payload.userId });
    if (existing.length >= MAX_ACCOUNTS_PER_USER) {
        throw new AppError(status.BAD_REQUEST, "You can add only 2 payout accounts (one bKash and one Nagad). Edit an existing one instead.");
    }
    if (existing.some((a) => a.method === payload.method)) {
        throw new AppError(status.BAD_REQUEST, `You already have a ${methodLabel(payload.method)} account. Edit it instead.`);
    }

    const result = await PaymentAccountsModel.create({ ...payload, status: "active", verifiedAt: null });
    return result;
};

const getMyPaymentAccounts = async (userId: string) => {
    return await PaymentAccountsModel.find({ userId }).sort({ method: 1 });
};

// edit the number / holder name, and/or switch the account active or inactive
const updateMyPaymentAccount = async (
    userId: string,
    id: string,
    payload: { accountNumber?: string; accountHolderName?: string; status?: "active" | "inactive" }
) => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(status.BAD_REQUEST, "Invalid account id");
    const account = await PaymentAccountsModel.findOne({ _id: id, userId });
    if (!account) throw new AppError(status.NOT_FOUND, "Payout account not found");

    if (payload.accountNumber !== undefined) {
        if (!BD_MOBILE.test(payload.accountNumber)) {
            throw new AppError(status.BAD_REQUEST, `Please provide a valid ${methodLabel(account.method)} number: it must start with 01 and have 11 digits.`);
        }
        account.accountNumber = payload.accountNumber;
        account.verifiedAt = null;
    }
    if (payload.accountHolderName !== undefined) account.accountHolderName = payload.accountHolderName;
    if (payload.status !== undefined) account.status = payload.status;

    await account.save();
    return account;
};

export const PaymentAccountsServices = {
    createPaymentAccount,
    getMyPaymentAccounts,
    updateMyPaymentAccount,
};
