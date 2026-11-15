import express, { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import validationRequest from '../../middlewares/validateRequest';
import { PaymentMethodsValidations } from './paymentMethods.validation';
import { PaymentMethodsController } from './paymentMethods.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { upload } from '../../utils/sendImageToCloudinary';
import AppError from '../../errors/AppError';

const router = express.Router();

// multipart requests carry the JSON fields in a "data" string next to the image file
const parseDataField = (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data === undefined) return next();
    try {
        req.body = JSON.parse(req.body.data);
        next();
    } catch {
        next(new AppError(status.BAD_REQUEST, 'Payment method data must be valid JSON in the "data" field'));
    }
};

// Create a new payment method (super admin only)
router.post(
  '/create-payment-method',
  auth(USER_ROLE.super_admin),
  upload.single('file'),
  parseDataField,
  validationRequest(PaymentMethodsValidations.createPaymentMethodValidation),
  PaymentMethodsController.createPaymentMethod,
);

// Active payment methods — public (shown on the deposit page)
router.get('/', PaymentMethodsController.getActivePaymentMethods);

// Every payment method incl. inactive (admin + super admin)
router.get('/admin/all', auth(USER_ROLE.super_admin, USER_ROLE.admin), PaymentMethodsController.getAllPaymentMethods);

// Update a payment method (super admin only; image optional)
router.put(
  '/:id',
  auth(USER_ROLE.super_admin),
  upload.single('file'),
  parseDataField,
  validationRequest(PaymentMethodsValidations.updatePaymentMethodValidation),
  PaymentMethodsController.updatePaymentMethod,
);

// Toggle active/inactive status (super admin only)
router.patch(
  '/toggle-status/:id',
  auth(USER_ROLE.super_admin),
  PaymentMethodsController.togglePaymentMethodStatus,
);

// Delete a payment method (super admin only)
router.delete(
  '/:id',
  auth(USER_ROLE.super_admin),
  PaymentMethodsController.deletePaymentMethod,
);

export const PaymentMethodRoutes = router;
