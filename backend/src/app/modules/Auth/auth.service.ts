import status from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "../users/user.model";
import { TLoginUser } from "./auth.interface";


const loginUser = async (payload: TLoginUser) => {

    // checking if the user exist
    const userExists = await UserModel.findOne({ phone: payload.phone });
    if (!userExists) {
        throw new AppError(status.NOT_FOUND, 'User does not exist');
    }

    // checking if the user is already deleted
    if (userExists?.isDeleted) {
        throw new AppError(status.FORBIDDEN, 'User is deleted');
    }

    // checking if the user is blocked
    if (userExists?.status !== 'active') {
        throw new AppError(status.FORBIDDEN, `User is ${userExists?.status}`);
    }

    // check if the password is carrect
    if ( userExists?.passwordHash !== payload?.password ) {
        throw new AppError(status.UNAUTHORIZED, 'Password is incorrect');
    }
    // access granted: send AccessToken, RefreshToken

    

}

export const AuthServices = {
    loginUser,
}