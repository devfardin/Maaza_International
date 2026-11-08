  import express, { NextFunction, Request, Response } from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';


  const router = express.Router()

  router.post('/create-user', UserController.createUser);
  router.delete('/:id', UserController.deleteUser);
  router.patch('/:id/status', UserController.changeUserStatus);
  router.get('/me', auth(USER_ROLE.admin, USER_ROLE.super_admin, USER_ROLE.user), UserController.getMe);

  export const UserRoutes = router;