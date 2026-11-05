  import express, { NextFunction, Request, Response } from 'express';
import { UserController } from './user.controller';


  const router = express.Router()

  router.post('/create-user', UserController.createUser);
  router.delete('/:id', UserController.deleteUser);
  router.patch('/:id/status', UserController.changeUserStatus);

  export const UserRoutes = router;