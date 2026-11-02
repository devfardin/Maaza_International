import status from "http-status";
import { TPaymentAccounts } from "./paymentAccounts.interface";
import { PaymentAccountsModel } from "./paymentAccounts.model";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";

// create paymentAccount
const createPaymentAccount = async (payload: TPaymentAccounts) => {

    // check payment method
    const isExist = await PaymentAccountsModel.findOne({ accountNumber: payload.accountNumber, method: payload.method });
    if (isExist) {
       throw new AppError(status.BAD_REQUEST, "This account is already exist!");
    }

    // check valid user
    const isUserExist = await UserModel.findOne({ _id: payload.userId });
    if (!isUserExist) {
        throw new AppError(status.NOT_FOUND, "This user is not found!");
    }

    // check user role
    if (isUserExist.role !== "user") {
        throw new AppError(status.UNAUTHORIZED, "Only users can create payment accounts!");
    }
    const accountNumber = payload.accountNumber;
    // check account number is valid bangladesh number
    if (!/^01[3-9]\d{8}$/.test(accountNumber)) {
  throw new AppError(
    status.BAD_REQUEST,
    `Please provide a valid ${payload.method} mobile number!`
  );
}

    // create account if not exist
    const result = await PaymentAccountsModel.create(payload);
    return result;
}

export const PaymentAccountsServices = {
    createPaymentAccount
}