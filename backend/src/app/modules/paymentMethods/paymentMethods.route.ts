import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { PaymentMethodsValidations } from './paymentMethods.validation';
import { PaymentMethodsController } from './paymentMethods.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a new payment method (admin only)
router.post(
  '/create-payment-method',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(PaymentMethodsValidations.createPaymentMethodValidation),
  PaymentMethodsController.createPaymentMethod,
);

// Get all payment methods (public — needed for deposit form)
router.get('/', PaymentMethodsController.getAllPaymentMethods);

// Update a payment method (admin only)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(PaymentMethodsValidations.updatePaymentMethodValidation),
  PaymentMethodsController.updatePaymentMethod,
);

// Toggle active/inactive status of a payment method (admin only)
router.patch(
  '/toggle-status/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  PaymentMethodsController.togglePaymentMethodStatus,
);

// Delete a payment method (admin only)
router.delete(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  PaymentMethodsController.deletePaymentMethod,
);

export const PaymentMethodRoutes = router;
