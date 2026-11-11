import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import status from 'http-status';
import AppError from '../errors/AppError';
import config from '../config';
import { TUserRole } from '../modules/users/user.interface';
import { validateActiveUserById } from '../utils/userValidation';

// Accepts both "Bearer <token>" and a raw token
export const extractToken = (header?: string): string | null => {
    if (!header) return null;
    const value = header.trim();
    return value.toLowerCase().startsWith('bearer ') ? value.slice(7).trim() : value;
};

const auth = (...roles: TUserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = extractToken(req.headers.authorization);
            if (!token) {
                throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
            }

            let decoded: JwtPayload;
            try {
                decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
            } catch {
                throw new AppError(status.UNAUTHORIZED, 'Invalid or expired token!');
            }

            // password-reset tokens must never work as access tokens
            if (decoded.purpose) {
                throw new AppError(status.UNAUTHORIZED, 'Invalid token!');
            }

            // Always trust the DB (not the token) for role and account state
            const user = await validateActiveUserById(decoded.userId);

            // invalidate tokens issued before the last password change
            if (user.passwordChangedAt && decoded.iat && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
                throw new AppError(status.UNAUTHORIZED, 'Password was changed. Please log in again!');
            }

            if (roles.length && !roles.includes(user.role)) {
                throw new AppError(status.FORBIDDEN, 'You are not allowed to access this route!');
            }

            req.user = {
                ...decoded,
                userId: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
            };
            next();
        } catch (error) {
            next(error);
        }
    };
};

export default auth;
