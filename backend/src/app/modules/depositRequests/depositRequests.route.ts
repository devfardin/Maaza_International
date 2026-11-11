import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { DepositRequestController } from './depositRequests.controller';
import { DepositRequestValidations } from './depositRequests.validations';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Submit a new deposit/recharge request (user only)
router.post(
  '/create-deposit-request',
  auth(USER_ROLE.user),
  validationRequest(DepositRequestValidations.createDepositRequestValidation),
  DepositRequestController.createDepositRequest,
);

// Get all deposit requests (admin only)
router.get(
  '/',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  DepositRequestController.getAllDepositRequests,
);

// Get deposit requests for a specific user
router.get(
  '/user/:userId',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  DepositRequestController.getDepositRequestsByUser,
);

// Approve or reject a deposit request (admin only)
router.patch(
  '/:id/status',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(DepositRequestValidations.updateDepositRequestStatusValidation),
  DepositRequestController.updateDepositRequestStatus,
);

export const DepositRequestRoutes = router;
