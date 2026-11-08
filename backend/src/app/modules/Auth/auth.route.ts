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

// Refresh Token router
router.post('/refresh-token',
    validationRequest(AuthValidation.refreshTokenValidationSchema),
    AuthControllers.refreshToken,
);

// Change Password router
router.post('/change-password',
    auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
    validationRequest(AuthValidation.chagnePasswordValidationSchema),
    AuthControllers.chagnePassword,
);

// Forget Password router
router.post('/forget-password', validationRequest(AuthValidation.forgetPasswordValidationSchema),
    AuthControllers.forgetPassword,
);
// Reset Password router
router.post('/reset-password', validationRequest(AuthValidation.resetPasswordValidationSchema),     AuthControllers.resetPassword,
);


export const AuthRoutes = router;