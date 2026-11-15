import status from "http-status";
import { TPaymentMethods } from "./paymentMethods.interface";
import { PaymentMethodsModel } from "./paymentMethods.model";
import AppError from "../../errors/AppError";

// "bKash Personal" → "bkash-personal"
const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const createPaymentMethod = async (payload: Omit<TPaymentMethods, "code" | "image"> & { code?: string }, image: string) => {
    const code = slugify(payload.code || payload.name);
    if (!code) {
        throw new AppError(status.BAD_REQUEST, "Could not generate a code from the name, please provide one");
    }

    const isExist = await PaymentMethodsModel.findOne({ code });
    if (isExist) {
        throw new AppError(status.BAD_REQUEST, "This payment method already exists!");
    }
    return PaymentMethodsModel.create({ ...payload, code, image });
};

// public list — only what users may pay with
const getActivePaymentMethods = async () => {
    return PaymentMethodsModel.find({ isActive: true })
        .select("-__v")
        .sort({ createdAt: 1 });
};

// admin list — everything, including inactive methods
const getAllPaymentMethods = async () => {
    return PaymentMethodsModel.find().sort({ createdAt: 1 });
};

const updatePaymentMethod = async (id: string, payload: Partial<TPaymentMethods>, image?: string) => {
    const update: Partial<TPaymentMethods> = { ...payload };
    if (update.code !== undefined) {
        update.code = slugify(update.code);
        const clash = await PaymentMethodsModel.findOne({ code: update.code, _id: { $ne: id } });
        if (clash) throw new AppError(status.BAD_REQUEST, "This payment method code is already in use!");
    }
    if (image) update.image = image;

    const result = await PaymentMethodsModel.findByIdAndUpdate(id, update, { new: true });
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
    return PaymentMethodsModel.findByIdAndUpdate(
        id,
        { isActive: !paymentMethod.isActive },
        { new: true }
    );
};

export const PaymentMethodsServices = {
    createPaymentMethod,
    getActivePaymentMethods,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodStatus,
};
