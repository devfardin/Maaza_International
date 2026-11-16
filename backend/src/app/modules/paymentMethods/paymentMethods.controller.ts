import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { resolveImage } from "../../utils/resolveImage";
import { PaymentMethodsServices } from "./paymentMethods.services";
import { AdminActivityServices } from "../adminActivity/adminActivity.services";

// new file → uploaded; otherwise the Media Library image URL is used
const resolvePaymentImage = (file: { path: string } | undefined, name: string, url?: string) =>
    resolveImage(file, `payment_${name.replace(/[^a-z0-9]+/gi, "_")}_${Date.now()}`, url);

const createPaymentMethod = catchAsync(async (req, res) => {
    // if (!req.file) throw new AppError(status.BAD_REQUEST, "Payment method image is required");
    const image = await resolvePaymentImage(req.file, req.body.name, req.body.image);
    const result = await PaymentMethodsServices.createPaymentMethod(req.body, image!);
    await AdminActivityServices.record(req.user!, "payment_method_created", `Created payment method ${result.name}`, { type: "payment_method", id: result._id });
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method created successfully",
        data: result,
    });
});

const getActivePaymentMethods = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.getActivePaymentMethods();
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment methods retrieved successfully",
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
    const image = await resolvePaymentImage(req.file, req.body.name ?? "payment", req.body.image);
    // the image is passed separately, so the raw body value is not written
    const { image: _imageUrl, ...payload } = req.body;
    const result = await PaymentMethodsServices.updatePaymentMethod(req.params.id, payload, image);
    await AdminActivityServices.record(req.user!, "payment_method_updated", `Updated payment method ${result.name}`, { type: "payment_method", id: result._id });
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method updated successfully",
        data: result,
    });
});

const deletePaymentMethod = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.deletePaymentMethod(req.params.id);
    await AdminActivityServices.record(req.user!, "payment_method_deleted", `Deleted payment method ${result.name}`, { type: "payment_method", id: result._id });
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method deleted successfully",
        data: result,
    });
});

const togglePaymentMethodStatus = catchAsync(async (req, res) => {
    const result = await PaymentMethodsServices.togglePaymentMethodStatus(req.params.id);
    await AdminActivityServices.record(req.user!, "payment_method_toggled", `${result?.isActive ? "Activated" : "Deactivated"} payment method ${result?.name}`, { type: "payment_method", id: result?._id });
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Payment method status toggled successfully",
        data: result,
    });
});

export const PaymentMethodsController = {
    createPaymentMethod,
    getActivePaymentMethods,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
};
