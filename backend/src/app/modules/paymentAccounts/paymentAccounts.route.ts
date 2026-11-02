import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { PaymentAccountsValidations } from './paymentAccounts.validation';
import { PaymentAccountsController } from './paymentAccounts.controller';


const router = express.Router()

// create router
router.post(
    '/create-paymentaccounts',
    validationRequest(PaymentAccountsValidations.createPaymentAccountValidation),
    PaymentAccountsController.createPaymentAccount
);



export const PaymentAccountRoutes = router;