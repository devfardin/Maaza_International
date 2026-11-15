import express from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { AdminDashboardServices } from './adminDashboard.services';

const router = express.Router();

// GET /admin-dashboard/stats — admin and super admin
router.get(
    '/stats',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    catchAsync(async (_req, res) => {
        const result = await AdminDashboardServices.getStats();
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Dashboard stats retrieved', data: result });
    })
);

export const AdminDashboardRoutes = router;
