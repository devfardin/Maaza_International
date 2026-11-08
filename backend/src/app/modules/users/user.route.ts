import express, { NextFunction, Request, Response } from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';
import validationRequest from '../../middlewares/validateRequest';
import { UserValidations } from './user.validations';


const router = express.Router()

router.post('/create-user', UserController.createUser);
router.delete('/:id', UserController.deleteUser);
router.patch('/change-status/:id', auth(USER_ROLE.admin, USER_ROLE.super_admin), validationRequest(UserValidations.changeUserStatusValidation), UserController.changeUserStatus);
router.get('/me', auth(USER_ROLE.admin, USER_ROLE.super_admin, USER_ROLE.user), UserController.getMe);

export const UserRoutes = router;