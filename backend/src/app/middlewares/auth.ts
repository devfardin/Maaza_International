import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import status from 'http-status';
import AppError from '../errors/AppError';
import config from '../config';
import { TUserRole } from '../modules/users/user.interface';



const auth = (...roles: TUserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const token = req.headers.authorization;
        if (!token) {
            throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
        }

        jwt.verify(token, config.jwt_access_secret as string, function (error, decoded) {
            if (error) {
                throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
            }

            const { role } = decoded as JwtPayload;
            if (roles.length && !roles.includes(role)) {
                throw new AppError(status.FORBIDDEN, 'You are not allowed to access this route!');
            }

            req.user = decoded as JwtPayload;

            next();
        })

    };
};

export default auth;
