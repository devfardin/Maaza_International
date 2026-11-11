import express from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { AdminActivityServices } from './adminActivity.services';

const router = express.Router();

// Super admin only: track what every admin is doing
router.get(
    '/summary',
    auth(USER_ROLE.super_admin),
    catchAsync(async (_req, res) => {
        const result = await AdminActivityServices.getAdminSummary();
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Admin summary retrieved', data: result });
    })
);

// GET /admin-activity?adminId=&action=&limit=
router.get(
    '/',
    auth(USER_ROLE.super_admin),
    catchAsync(async (req, res) => {
        const { adminId, action, limit } = req.query as Record<string, string | undefined>;
        const result = await AdminActivityServices.getAll({
            adminId,
            action,
            limit: limit ? Number(limit) : undefined,
        });
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Admin activity retrieved', data: result });
    })
);

export const AdminActivityRoutes = router;
