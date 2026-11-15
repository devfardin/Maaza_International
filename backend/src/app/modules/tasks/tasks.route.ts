import express from 'express';
import { TaskControllers } from './tasks.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { upload, sendImageToCloudinary } from '../../utils/sendImageToCloudinary';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import status from 'http-status';

const router = express.Router();

// Create a new task (admin only)
router.post(
  '/create-task',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  TaskControllers.createTask,
);

// Upload a task image (admin and super admin) — multipart field "file", returns { url }
router.post(
  '/upload-image',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  upload.single('file'),
  catchAsync(async (req, res) => {
    if (!req.file) throw new AppError(status.BAD_REQUEST, 'Please choose an image to upload');
    const { secure_url } = await sendImageToCloudinary(`task_${Date.now()}`, req.file.path);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Image uploaded', data: { url: secure_url } });
  }),
);

// Get all tasks (public)
router.get('/', TaskControllers.getAllTasks);

// Get a single task by ID (public)
router.get('/:id', TaskControllers.getSingleTask);

// Update a task (admin only)
router.put(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  TaskControllers.updateTask,
);

// Soft-delete a task (admin only)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  TaskControllers.deleteTask,
);

export const TaskRoutes = router;
