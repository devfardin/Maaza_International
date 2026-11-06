import status from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";
import { TLoginUser } from "./auth.interface";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../../config";


const loginUser = async (payload: TLoginUser) => {

    // checking if the user exist
    // const user = await UserModel.findOne({ phone: payload.phone });
    const user = await UserModel.isUserExistsByPhone(payload.phone);
    console.log(user);


    if (!user) {
        throw new AppError(status.NOT_FOUND, 'User does not exist');
    }

    // checking if the user is already deleted
    if (user?.isDeleted) {
        throw new AppError(status.FORBIDDEN, 'User is deleted');
    }

    // checking if the user is blocked
    if (user?.status !== 'active') {
        throw new AppError(status.FORBIDDEN, `User is ${user?.status}`);
    }

    // check if the password is carrect
    if (user?.passwordHash !== payload?.password) {
        throw new AppError(status.UNAUTHORIZED, 'Password is incorrect');
    }

    // access granted: send AccessToken, RefreshToken
    const jwtpayload = {
        userId: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
    }
    const accessToken = jwt.sign(jwtpayload, config.jwt_access_secret as string, {
        expiresIn: (config.jwt_access_expires_in ?? '7d'),
    } as SignOptions)
    
    return {
        accessToken,
        
    }



}

export const AuthServices = {
    loginUser,
}