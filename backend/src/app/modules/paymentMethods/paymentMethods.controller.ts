import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentMethodsServices } from "./paymentMethods.services";

const createPaymentMethod = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.createPaymentMethod(req.body);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method created successfully",
        data: result,
    });
});

const getAllPaymentMethods = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.getAllPaymentMethods();
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment methods retrieved successfully",
        data: result,
    });
});

const updatePaymentMethod = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.updatePaymentMethod(req.params.id, req.body);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method updated successfully",
        data: result,
    });
});

const deletePaymentMethod = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.deletePaymentMethod(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method deleted successfully",
        data: result,
    });
});

const togglePaymentMethodStatus = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.togglePaymentMethodStatus(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method status toggled successfully",
        data: result,
    });
});

export const PaymentMethodsController = {
    createPaymentMethod,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
};
