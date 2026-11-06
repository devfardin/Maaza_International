import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import status from 'http-status';
import AppError from '../errors/AppError';
import config from '../config';
import { TUserRole } from '../modules/users/user.interface';
import { validateActiveUserById } from '../utils/userValidation';

const auth = (...roles: TUserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
            }

            const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;

            // Re-verify user still exists and is active in DB
            await validateActiveUserById(decoded.userId);

            if (roles.length && !roles.includes(decoded.role)) {
                throw new AppError(status.FORBIDDEN, 'You are not allowed to access this route!');
            }

            req.user = decoded;
            next();
        } catch (error) {
            next(error);
        }
    };
};

export default auth;
