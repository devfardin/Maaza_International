import express from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { AdminDashboardServices } from './adminDashboard.services';

const router = express.Router();

// GET /admin-dashboard/stats — admin and super admin (wallet totals: super admin only)
router.get(
    '/stats',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    catchAsync(async (req, res) => {
        const result = await AdminDashboardServices.getStats(req.user!.role);
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Dashboard stats retrieved', data: result });
    })
);

// GET /admin-dashboard/member-wallets — super admin only
router.get(
    '/member-wallets',
    auth(USER_ROLE.super_admin),
    catchAsync(async (_req, res) => {
        const result = await AdminDashboardServices.getMemberWallets();
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Member wallets retrieved', data: result });
    })
);

// GET /admin-dashboard/my-handled — admin and super admin: requests the signed-in admin handled
router.get(
    '/my-handled',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    catchAsync(async (req, res) => {
        const result = await AdminDashboardServices.getMyHandled(req.user!.userId);
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Handled requests retrieved', data: result });
    })
);

export const AdminDashboardRoutes = router;
