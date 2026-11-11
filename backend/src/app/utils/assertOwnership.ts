import { Request } from 'express';
import status from 'http-status';
import AppError from '../errors/AppError';

// A normal user may only access their OWN data. Admins may access anyone's.
export const assertSelfOrAdmin = (req: Request, targetUserId: string) => {
    const actor = req.user;
    if (!actor) throw new AppError(status.UNAUTHORIZED, 'You are not authorized!');
    const isAdmin = actor.role === 'admin' || actor.role === 'super_admin';
    if (!isAdmin && actor.userId !== String(targetUserId)) {
        throw new AppError(status.FORBIDDEN, 'You can only access your own data');
    }
};
