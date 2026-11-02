import status from "http-status";
import { TPaymentAccounts } from "./paymentAccounts.interface";
import { PaymentAccountsModel } from "./paymentAccounts.model";
import AppError from "../../errors/AppError";

// create paymentAccount
const createPaymentAccount = async (payload: TPaymentAccounts) => {
    const isExist = await PaymentAccountsModel.findOne({ accountNumber: payload.accountNumber, method: payload.method });
    if (isExist) {
       throw new AppError(status.BAD_REQUEST, "This account is already exist!");
    }
    const result = await PaymentAccountsModel.create(payload);
    return result;
}

export const PaymentAccountsServices = {
    createPaymentAccount
}