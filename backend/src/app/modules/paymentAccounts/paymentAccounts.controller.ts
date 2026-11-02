import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentAccountsServices } from "./paymentAccounts.services";

// create payment Account for users
const createPaymentAccount = catchAsync(
    async(req, res) => {
        const result = await PaymentAccountsServices.createPaymentAccount(req.body);
        sendResponse(res, {
            success: true,
            statusCode: status.OK,
            message: "Payment account created successfully",
            data: result
        })
    }
)

export const PaymentAccountsController = {
    createPaymentAccount
}