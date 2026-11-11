import express from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { USER_ROLE } from '../users/user.constant';
import { NotificationServices } from './notification.services';

const router = express.Router();
const adminOnly = auth(USER_ROLE.super_admin, USER_ROLE.admin);

// GET /notifications?limit=&unreadOnly=true  — admin bell feed + unread count
router.get(
    '/',
    adminOnly,
    catchAsync(async (req, res) => {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const unreadOnly = req.query.unreadOnly === 'true';
        const result = await NotificationServices.listForAdmin(req.user!.userId, { limit, unreadOnly });
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Notifications retrieved', data: result });
    })
);

// PATCH /notifications/read-all — must be declared before '/:id/read'
router.patch(
    '/read-all',
    adminOnly,
    catchAsync(async (req, res) => {
        const result = await NotificationServices.markAllRead(req.user!.userId);
        sendResponse(res, { success: true, statusCode: status.OK, message: 'All notifications marked as read', data: result });
    })
);

// PATCH /notifications/:id/read
router.patch(
    '/:id/read',
    adminOnly,
    catchAsync(async (req, res) => {
        const result = await NotificationServices.markRead(req.user!.userId, req.params.id);
        sendResponse(res, { success: true, statusCode: status.OK, message: 'Notification marked as read', data: result });
    })
);

export const NotificationRoutes = router;
