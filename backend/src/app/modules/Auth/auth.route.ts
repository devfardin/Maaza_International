import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';

const router = express.Router()

// Login User router
router.post('/login',
    validationRequest(AuthValidation.loginValidationSchema),
    AuthControllers.loginUser
);



export const AuthRoutes = router;