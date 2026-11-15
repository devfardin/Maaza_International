import { NextFunction, Request, Response } from 'express';
import { CONTENT_TAGS, RealtimeServices } from '../modules/realtime/realtime.services';

// After every successful write (POST / PATCH / PUT / DELETE), tell the affected
// screens to refresh. This covers the common case — the user changed their own
// data (purchase, check-in, withdrawal request, profile edit, ...).
// Cross-user changes (an admin approving a deposit, a commission paid to an
// upline member) are pushed explicitly from the service that makes them.
const realtimeMutations = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    res.on('finish', () => {
        if (res.statusCode >= 400 || !req.user) return;

        if (req.user.role === 'user') {
            RealtimeServices.notifyUser(req.user.userId, 'all');
        } else {
            // An admin changed shared content: refresh it everywhere and the admin screens
            RealtimeServices.notifyAdmins('all');
            RealtimeServices.broadcast(CONTENT_TAGS);
        }
    });

    next();
};

export default realtimeMutations;
