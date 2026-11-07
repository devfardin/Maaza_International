import status from 'http-status';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import { TLoginUser } from './auth.interface';
import config from '../../config';
import { validateActiveUserByPhone } from '../../utils/userValidation';
import { UserModel } from '../users/user.model';
import { buildJwtPayload, createToken } from './auth.utils';

const SALT_ROUNDS = Number(config.bcrypt_salt_rounds) || 12;


// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (payload: TLoginUser) => {
    const user = await validateActiveUserByPhone(payload.phone);

    const isPasswordMatch = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordMatch) {
        throw new AppError(status.UNAUTHORIZED, 'Password is incorrect');
    }

    // access token
    const accessToken = createToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        config.jwt_access_expires_in ?? '1d'
    );

    // create refresh token
    const refreshToken = createToken(
        buildJwtPayload(user),
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in ?? '90d'
    );

    return {
        accessToken,
        refreshToken
    };
};



// ─── Change Password ──────────────────────────────────────────────────────────

const changePassword = async (
    userData: JwtPayload,
    payload: { oldPassword: string; newPassword: string }
) => {
    // Re-fetch from DB — never trust JWT payload for sensitive operations
    const user = await validateActiveUserByPhone(userData.phone as string);

    // Verify old password against stored hash
    const isOldPasswordMatch = await bcrypt.compare(payload.oldPassword, user.passwordHash);
    if (!isOldPasswordMatch) {
        throw new AppError(status.UNAUTHORIZED, 'Old password is incorrect');
    }

    // Prevent reusing the same password
    const isSamePassword = await bcrypt.compare(payload.newPassword, user.passwordHash);
    if (isSamePassword) {
        throw new AppError(status.BAD_REQUEST, 'New password must be different from the old password');
    }

    const newHash = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);

    await UserModel.findByIdAndUpdate(
        user._id,
        {
            passwordHash: newHash,
            passwordChangedAt: new Date()
        },
        { new: true, runValidators: true }
    );

    return null;
};

export const AuthServices = {
    loginUser,
    changePassword,
};
