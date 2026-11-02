import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { PaymentMethodsValidations } from './paymentMethods.validation';
import { PaymentMethodsController } from './paymentMethods.controller';

const router = express.Router();

router.post(
    '/create-payment-method',
    validationRequest(PaymentMethodsValidations.createPaymentMethodValidation),
    PaymentMethodsController.createPaymentMethod
);

router.get('/', PaymentMethodsController.getAllPaymentMethods);

router.patch(
    '/:id',
    validationRequest(PaymentMethodsValidations.updatePaymentMethodValidation),
    PaymentMethodsController.updatePaymentMethod
);

router.delete('/:id', PaymentMethodsController.deletePaymentMethod);

router.patch('/toggle-status/:id', PaymentMethodsController.togglePaymentMethodStatus);

export const PaymentMethodRoutes = router;
