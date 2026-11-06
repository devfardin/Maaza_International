import status from 'http-status';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { TLoginUser } from './auth.interface';
import config from '../../config';

const SALT_ROUNDS = Number(config.bcrypt_salt_rounds) || 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildJwtPayload = (user: { _id: { toString(): string }; fullName: string; email: string; phone: string; role: string; status: string }) => ({
    userId: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
});

const signToken = (payload: object, secret: string, expiresIn: string) =>
    jwt.sign(payload, secret, { expiresIn } as SignOptions);

// ─── Shared user validation ───────────────────────────────────────────────────

const validateActiveUser = async (phone: string) => {
    const user = await UserModel.isUserExistsByPhone(phone);
    if (!user) throw new AppError(status.NOT_FOUND, 'User does not exist');
    if (user.isDeleted) throw new AppError(status.FORBIDDEN, 'User is deleted');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, `User is ${user.status}`);
    return user;
};

// ─── Login ────────────────────────────────────────────────────────────────────

const loginUser = async (payload: TLoginUser) => {
    const user = await validateActiveUser(payload.phone);

    const isPasswordMatch = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordMatch) {
        throw new AppError(status.UNAUTHORIZED, 'Password is incorrect');
    }

    const accessToken = signToken(
        buildJwtPayload(user),
        config.jwt_access_secret as string,
        config.jwt_access_expires_in ?? '7d'
    );

    return { accessToken };
};

// ─── Change Password ──────────────────────────────────────────────────────────

const changePassword = async (
    userData: JwtPayload,
    payload: { oldPassword: string; newPassword: string }
) => {
    // Re-fetch from DB — never trust JWT payload for sensitive operations
    const user = await validateActiveUser(userData.phone as string);

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
        { passwordHash: newHash },
        { new: true, runValidators: true }
    );

    return null;
};

export const AuthServices = {
    loginUser,
    changePassword,
};
