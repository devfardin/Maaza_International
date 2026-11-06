import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router()

// Login User router
router.post('/login',
    validationRequest(AuthValidation.loginValidationSchema),
    AuthControllers.loginUser
);

// Change Password router
router.post('/change-password',
    auth(USER_ROLE.admin, USER_ROLE.super_admin, USER_ROLE.user),
    validationRequest(AuthValidation.chagnePasswordValidationSchema),
    AuthControllers.chagnePassword,
);


export const AuthRoutes = router;