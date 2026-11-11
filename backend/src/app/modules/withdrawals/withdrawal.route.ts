import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalValidations } from './withdrawal.validations';

const router = express.Router();

// user: submit a withdrawal request
router.post(
  '/create-withdrawal',
  auth(USER_ROLE.user),
  validationRequest(WithdrawalValidations.createWithdrawalValidation),
  WithdrawalController.createWithdrawal,
);

// user: own withdrawal history (declared before '/user/:userId')
router.get('/my', auth(USER_ROLE.user), WithdrawalController.getMyWithdrawals);

// self or admin
router.get(
  '/user/:userId',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  WithdrawalController.getWithdrawalsByUser,
);

// admin: all withdrawals
router.get('/', auth(USER_ROLE.super_admin, USER_ROLE.admin), WithdrawalController.getAllWithdrawals);

// admin: approve / reject
router.patch(
  '/:id/status',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(WithdrawalValidations.updateWithdrawalStatusValidation),
  WithdrawalController.updateWithdrawalStatus,
);

export const WithdrawalRoutes = router;
