import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentAccountsServices } from "./paymentAccounts.services";

// create payment Account for users
const createPaymentAccount = catchAsync(
    async(req, res) => {
        const result = await PaymentAccountsServices.createPaymentAccount({ ...req.body, userId: req.user!.userId });
        sendResponse(res, {
            success: true,
            statusCode: status.OK,
            message: "Payment account created successfully",
            data: result
        })
    }
)

// get payment accounts for the authenticated user
const getMyPaymentAccounts = catchAsync(async (req, res) => {
    const { userId } = req.user!;
    const result = await PaymentAccountsServices.getMyPaymentAccounts(userId);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment accounts retrieved successfully",
        data: result,
    });
});

export const PaymentAccountsController = {
    createPaymentAccount,
    getMyPaymentAccounts,
}