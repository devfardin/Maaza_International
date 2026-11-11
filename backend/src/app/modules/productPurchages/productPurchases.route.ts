import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { ProductPurchaseValidations } from './productPurchases.validations';
import { ProductPurchaseController } from './productPurchases.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Purchase a product (authenticated user)
router.post(
  '/purchase',
  auth(USER_ROLE.user),
  validationRequest(ProductPurchaseValidations.purchaseProductValidation),
  ProductPurchaseController.purchaseProduct,
);

// Claim daily income for a purchase (authenticated user)
router.post(
  '/:purchaseId/claim',
  auth(USER_ROLE.user),
  ProductPurchaseController.claimDailyIncome,
);

// Get all purchases for the authenticated user
router.get(
  '/my-purchases',
  auth(USER_ROLE.user),
  ProductPurchaseController.getMyPurchases,
);

// Get a single purchase by ID (authenticated user)
router.get(
  '/:purchaseId',
  auth(USER_ROLE.user),
  ProductPurchaseController.getSinglePurchase,
);

// Get daily claim history for a purchase (authenticated user)
router.get(
  '/:purchaseId/claim-history',
  auth(USER_ROLE.user),
  ProductPurchaseController.getClaimHistory,
);

export const ProductPurchaseRoutes = router;
