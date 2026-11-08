import status from 'http-status';
import AppError from '../../errors/AppError';
import { Tuser } from "./user.interface";
import { UserModel } from "./user.model";
import { generateUniqueReferralCode } from "./user.utils";
import mongoose from 'mongoose';
import { WalletServices } from '../wallets/wallet.services';
import config from '../../config';
import jwt, { JwtPayload } from 'jsonwebtoken';

const createUser = async (payload: Tuser) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const userExist = await UserModel.findOne({ $or: [{ email: payload.email }, { phone: payload.phone }] });

        if (userExist) {
            throw new AppError(status.CONFLICT, 'User already exists with this email or phone number');
        }

        // generate unique referral code
        const referralCode = await generateUniqueReferralCode(payload.phone);

        // create user inside the session
        const result = await UserModel.create([{ ...payload, referralCode }], { session });
        if (!result.length) {
            throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to create user');
        }

        // create both recharge and balance wallets for the new user
        await WalletServices.createWalletsForUser(result[0]._id, session);

        await session.commitTransaction();

        return result[0];

    } catch (error) {
        await session.abortTransaction();
        // re-throw so the global error handler formats and returns the correct response
        throw error;
    } finally {
        // always close the session whether it succeeded or failed
        await session.endSession();
    }
};
const getMe = async (userId: string, role: string) => {

    const result = await UserModel.findOne({ _id: userId, role }).select('-passwordHash').populate('referredBy');
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
    const result = await UserModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true, runValidators: true }
    );
    if (!result) {
        throw new AppError(status.BAD_REQUEST, 'Failed to delete user');
    }
    return result;
}

const changeUserStatus = async (id: string, payload: string) => {
    const isUserExists = await UserModel.findById(id);
    if (!isUserExists) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    const result = await UserModel.findByIdAndUpdate(
        id,
        { status: payload },
        { new: true, runValidators: true }
    );
    return result;
}


export const UserServices = {
    createUser,
    getMe,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    changeUserStatus,
}