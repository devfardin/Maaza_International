import express from 'express';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import { ProductPurchaseValidations } from './productPurchases.validations';
import { ProductPurchaseController } from './productPurchases.controller';

const router = express.Router();

// All routes require authentication
router.post(
    '/purchase/:userId',
    // auth('user'),
    validationRequest(ProductPurchaseValidations.purchaseProductValidation),
    ProductPurchaseController.purchaseProduct
);

router.post(
    '/:purchaseId/claim',
    auth('user'),
    ProductPurchaseController.claimDailyIncome
);

router.get(
    '/my-purchases',
    auth('user'),
    ProductPurchaseController.getMyPurchases
);

router.get(
    '/:purchaseId',
    auth('user'),
    ProductPurchaseController.getSinglePurchase
);

router.get(
    '/:purchaseId/claim-history',
    auth('user'),
    ProductPurchaseController.getClaimHistory
);

export const ProductPurchaseRoutes = router;
