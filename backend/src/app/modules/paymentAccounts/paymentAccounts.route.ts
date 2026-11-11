import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { PaymentAccountsValidations } from './paymentAccounts.validation';
import { PaymentAccountsController } from './paymentAccounts.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a payout account (bKash/Nagad) for the authenticated user
router.post(
  '/create-payment-accounts',
  auth(USER_ROLE.user),
  validationRequest(PaymentAccountsValidations.createPaymentAccountValidation),
  PaymentAccountsController.createPaymentAccount,
);

// Get all payout accounts for the authenticated user
router.get(
  '/my-accounts',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  PaymentAccountsController.getMyPaymentAccounts,
);

export const PaymentAccountRoutes = router;
