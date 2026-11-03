import status from 'http-status';
import AppError from '../../errors/AppError';
import { Tuser } from "./user.interface";
import { UserModel } from "./user.model";
import { generateUniqueReferralCode } from "./user.utils";
import { WalletModel } from "../wallets/wallet.model";

const createUser = async (payload: Tuser) => {
    const userExist = await UserModel.findOne({ $or: [{ email: payload.email }, { phone: payload.phone }] });

    if (userExist) {
        throw new AppError(status.CONFLICT, 'User already exists with this email or phone number');
    }

    const referralCode = await generateUniqueReferralCode(payload.phone);
    const result = await UserModel.create({ ...payload, referralCode });

    await WalletModel.create({ userId: result._id });

    return result;
};

export const UserServices = {
    createUser,
}