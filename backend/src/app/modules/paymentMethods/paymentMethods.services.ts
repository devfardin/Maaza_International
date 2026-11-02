import status from "http-status";
import { TPaymentMethods } from "./paymentMethods.interface";
import { PaymentMethodsModel } from "./paymentMethods.model";
import AppError from "../../errors/AppError";

const createPaymentMethod = async (payload: TPaymentMethods) => {

    const isExist = await PaymentMethodsModel.findOne({ code: payload.code });
    if (isExist) {
        throw new AppError(status.BAD_REQUEST, "This payment method already exists!");
    }
    const result = await PaymentMethodsModel.create(payload);
    return result;
};

const getAllPaymentMethods = async () => {
    const result = await PaymentMethodsModel.find();
    return result;
};

const updatePaymentMethod = async (id: string, payload: Partial<TPaymentMethods>) => {
    const result = await PaymentMethodsModel.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new AppError(status.NOT_FOUND, "Payment method not found!");
    }
    return result;
};

const deletePaymentMethod = async (id: string) => {
    const result = await PaymentMethodsModel.findByIdAndDelete(id);
    if (!result) {
        throw new AppError(status.NOT_FOUND, "Payment method not found!");
    }
    return result;
};

const togglePaymentMethodStatus = async (id: string) => {
    const paymentMethod = await PaymentMethodsModel.findById(id);
    if (!paymentMethod) {
        throw new AppError(status.NOT_FOUND, "Payment method not found!");
    }
    const result = await PaymentMethodsModel.findByIdAndUpdate(
        id,
        { isActive: !paymentMethod.isActive },
        { new: true }
    );
    return result;
};

export const PaymentMethodsServices = {
    createPaymentMethod,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
};
