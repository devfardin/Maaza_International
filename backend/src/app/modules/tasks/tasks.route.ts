import express from 'express';
import { TaskControllers } from './tasks.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a new task (admin only)
router.post(
  '/create-task',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  TaskControllers.createTask,
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
