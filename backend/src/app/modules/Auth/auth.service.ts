import status from 'http-status';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import { TLoginUser } from './auth.interface';
import config from '../../config';
import { validateActiveUserByPhone } from '../../utils/userValidation';
import { UserModel } from '../users/user.model';
import { buildJwtPayload, createToken } from './auth.utils';
import { sendEmail } from '../../utils/sendEmail';

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

const refreshToken = async (token: string) => {
    // verify refresh token
    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt_refresh_secret as string) as JwtPayload;
    } catch (error) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
    }

    const user = await validateActiveUserByPhone(decoded.phone);

    // generate new access token
    const newAccessToken = createToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        config.jwt_access_expires_in ?? '1d'
    );

    return {
        accessToken: newAccessToken,
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

// forget password
const forgetPassword = async (phone: string) => {
    const user = await validateActiveUserByPhone(phone);


    // generate reset token
    const resetToken = createToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        '10m'
    );

    const resetLink = `${config.frontend_url}/reset-password?userId=${user?._id}&token=${resetToken}`;

    // In a real app, you would send this token via email/SMS
    await sendEmail({
        to: 'contactfardin22@gmail.com',
        subject: 'Reset Your Password',
        heading: 'Password Reset Request',
        subheading: 'Use the link below to reset your password.',
        body: `<p>Click the button below to reset your password.</p>
                <p>This OTP expires in <strong>10 minutes</strong>.</p>`,
        footerNote: 'If you did not request a password reset, please secure your account.',
        button: {
            label: 'Reset Password',
            url: resetLink,
        }
    });
};

const resetPassword = async (
    token: string,
    payload: { phone: string; newPassword: string }
) => {
    // verify reset token
    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
    } catch (error) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid or expired reset token');
    }
    console.log(payload.phone, decoded.userId);
    
    

    // verify user id
    if (decoded.phone as string !== payload.phone) {
        throw new AppError(status.FORBIDDEN, 'Forbidden: User ID mismatch');
    }

    // Re-fetch user to ensure they exist and are active
    const user = await validateActiveUserByPhone(decoded.phone as string);

    // hash new password
    const newHash = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);

    // update password
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
    refreshToken,
    forgetPassword,
    resetPassword,
};
