import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import status from 'http-status';
import AppError from '../errors/AppError';
import config from '../config';

const auth = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new AppError(status.UNAUTHORIZED, 'No token provided');
        }

        const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload & {
            userId: string;
            role: string;
            email: string;
        };

        if (roles.length && !roles.includes(decoded.role)) {
            throw new AppError(status.FORBIDDEN, 'You are not authorized');
        }

        req.user = decoded;
        next();
    };
};

export default auth;
