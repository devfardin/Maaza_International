  import express, { NextFunction, Request, Response } from 'express';
import { UserController } from './user.controller';
import { AnyZodObject } from 'zod/v3';

  const router = express.Router()

  // const validateRequest = (schema: AnyZodObject) => {
  //   return async (req: Request, res: Response, next: NextFunction) => {
  //     const zodParsedData = await schema.parseAsync({
  //       body: req.body,
  //     })
  //     next();
  //   }
  // }

  router.post('/create-user', UserController.createUser);

  export const UserRoutes = router;