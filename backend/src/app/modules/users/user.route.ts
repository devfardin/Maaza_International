  import express, { NextFunction, Request, Response } from 'express';
import { UserController } from './user.controller';
import { AnyZodObject } from 'zod/v3';

  const router = express.Router()

  router.post('/create-user', UserController.createUser);

  export const UserRoutes = router;