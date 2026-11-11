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
import { TClientInfo } from '../../utils/clientInfo';
import { ActivityLogServices } from '../activityLogs/activityLog.services';

const SALT_ROUNDS = Number(config.bcrypt_salt_rounds) || 12;

// Reset tokens use their own secret + purpose claim so they can never be used
// as access tokens (and access tokens can never be used to reset a password).
const resetSecret = () => `${config.jwt_access_secret}:password-reset`;

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (payload: TLoginUser, clientInfo?: TClientInfo) => {
    const user = await UserModel.isUserExistsByPhone(payload.phone);

    // identical error for "no such user" and "wrong password" (no user enumeration)
    const isPasswordMatch = user ? await bcrypt.compare(payload.password, user.passwordHash) : false;
    if (!user || !isPasswordMatch) {
        if (clientInfo) {
            await ActivityLogServices.record('login_failed', clientInfo, { userId: user?._id, phone: payload.phone });
        }
        throw new AppError(status.UNAUTHORIZED, 'Invalid phone number or password');
    }

    if (user.isDeleted) throw new AppError(status.FORBIDDEN, 'This account has been deleted');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, `Your account is ${user.status}`);

    const accessToken = createToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        config.jwt_access_expires_in ?? '1d'
    );
    const refreshToken = createToken(
        buildJwtPayload(user),
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in ?? '90d'
    );

    // admin tracking: IP, device type, browser, OS
    if (clientInfo) {
        await ActivityLogServices.record('login', clientInfo, { userId: user._id, phone: user.phone });
    }

    return { accessToken, refreshToken, role: user.role };
};

const refreshToken = async (token: string) => {
    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, config.jwt_refresh_secret as string) as JwtPayload;
    } catch {
        throw new AppError(status.UNAUTHORIZED, 'Invalid refresh token');
    }

    const user = await validateActiveUserByPhone(decoded.phone);

    if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
        throw new AppError(status.UNAUTHORIZED, 'Password was changed. Please log in again!');
    }

    const newAccessToken = createToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        config.jwt_access_expires_in ?? '1d'
    );

    return { accessToken: newAccessToken };
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (
    userData: JwtPayload,
    payload: { oldPassword: string; newPassword: string }
) => {
    // Re-fetch from DB — never trust JWT payload for sensitive operations
    const user = await validateActiveUserByPhone(userData.phone as string);

    const isOldPasswordMatch = await bcrypt.compare(payload.oldPassword, user.passwordHash);
    if (!isOldPasswordMatch) {
        throw new AppError(status.UNAUTHORIZED, 'Old password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(payload.newPassword, user.passwordHash);
    if (isSamePassword) {
        throw new AppError(status.BAD_REQUEST, 'New password must be different from the old password');
    }

    const newHash = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);

    // passwordChangedAt invalidates every token issued before this moment
    await UserModel.findByIdAndUpdate(user._id, { passwordHash: newHash, passwordChangedAt: new Date() });

    return null;
};

// ─── Forget password ──────────────────────────────────────────────────────────
// Always resolves the same way so attackers can't discover which phones are registered.
const forgetPassword = async (phone: string) => {
    const user = await UserModel.isUserExistsByPhone(phone);
    if (!user || user.isDeleted || user.status !== 'active') return;

    const resetToken = jwt.sign(
        { userId: user._id.toString(), phone: user.phone, purpose: 'password-reset' },
        resetSecret(),
        { expiresIn: '10m' }
    );

    const resetLink = `${config.frontend_url}/reset-password?token=${resetToken}`;

    await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        heading: 'Password Reset Request',
        subheading: 'Use the link below to reset your password.',
        body: `<p>Click the button below to reset your password.</p>
                <p>This link expires in <strong>10 minutes</strong>.</p>`,
        footerNote: 'If you did not request a password reset, please secure your account.',
        button: { label: 'Reset Password', url: resetLink },
    });
};

const resetPassword = async (token: string, payload: { phone: string; newPassword: string }) => {
    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, resetSecret()) as JwtPayload;
    } catch {
        throw new AppError(status.UNAUTHORIZED, 'Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password-reset' || decoded.phone !== payload.phone) {
        throw new AppError(status.FORBIDDEN, 'Invalid reset token');
    }

    const user = await validateActiveUserByPhone(decoded.phone as string);

    // a reset token may be used only once: reject if the password changed after it was issued
    if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
        throw new AppError(status.UNAUTHORIZED, 'This reset link has already been used');
    }

    const newHash = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);
    await UserModel.findByIdAndUpdate(user._id, { passwordHash: newHash, passwordChangedAt: new Date() });

    return null;
};

export const AuthServices = {
    loginUser,
    changePassword,
    refreshToken,
    forgetPassword,
    resetPassword,
};
