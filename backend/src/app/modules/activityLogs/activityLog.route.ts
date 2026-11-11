import express from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { ActivityLogServices } from './activityLog.services';

const router = express.Router();

// GET /activity-logs?userId=&event=&limit=  (admin only)
router.get(
    '/',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    catchAsync(async (req, res) => {
        const { userId, event, limit } = req.query as Record<string, string | undefined>;
        const result = await ActivityLogServices.getAll({
            userId,
            event,
            limit: limit ? Number(limit) : undefined,
        });
        sendResponse(res, {
            success: true,
            statusCode: status.OK,
            message: 'Activity logs retrieved successfully',
            data: result,
        });
    })
);

export const ActivityLogRoutes = router;
