import status from 'http-status';
import AppError from '../../errors/AppError';
import { Tuser } from "./user.interface";
import { UserModel } from "./user.model";
import { generateUniqueReferralCode } from "./user.utils";
import { WalletModel } from "../wallets/wallet.model";
import mongoose from 'mongoose';

const createUser = async (payload: Tuser) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // const userExist = await UserModel.findOne({ $or: [{ email: payload.email }, { phone: payload.phone }] });

        // if (userExist) {
        //     throw new AppError(status.CONFLICT, 'User already exists with this email or phone number');
        // }

        // Generate Referl id
        const referralCode = await generateUniqueReferralCode(payload.phone);

        // first transition
        const result = await UserModel.create([{ ...payload, referralCode }], { session });
        if (!result.length) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to create user');
        }

        // second transition
        const userWallet = await WalletModel.create([{ userId: result[0]._id }], { session });
        if (!userWallet.length) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to create user wallet');
        }

        // session Commit
        await session.commitTransaction();

        // end session
        await session.endSession();

        return result;

    } catch (error) {
        await session.abortTransaction();
        await session.endSession();
    }
};
const getMe = async (id: string) => {
    const result = await UserModel.findById(id).select('-password');
    return result;
}
const getAllUsers = async () => {
    const result = await UserModel.find();
    return result;
}

const getSingleUser = async (id: string) => {
    const result = await UserModel.findById(id);
    return result;
}

const updateUser = async (id: string, payload: Partial<Tuser>) => {
    const isUserExists = await UserModel.findById(id);
    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    const result = await UserModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
}

const deleteUser = async (id: string) => {
    const isUserExists = await UserModel.findById(id);
    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    const result = await UserModel.findByIdAndUpdate({ id }, { isDeleted: true }, { new: true  /* if session */ });
    return result;
}


export const UserServices = {
    createUser,
    getMe,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
}