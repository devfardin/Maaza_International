import express from 'express';
import { WalletController } from './wallet.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import validationRequest from '../../middlewares/validateRequest';
import { WalletValidations } from './wallet.validations';

const router = express.Router();

// Move money between a member's balance and recharge wallets (super_admin only)
router.post(
  '/:userId/exchange',
  auth(USER_ROLE.super_admin),
  validationRequest(WalletValidations.exchangeWalletValidation),
  WalletController.exchangeWallets,
);

// Get all wallets for a user by userId (own wallets, or any member for a super_admin)
router.get(
  '/:userId',
  auth(USER_ROLE.super_admin, USER_ROLE.user),
  WalletController.getMyWallets,
);

// Get a specific wallet by userId and walletType (?walletType=main)
router.get(
  '/:userId/walletType',
  auth(USER_ROLE.super_admin, USER_ROLE.user),
  WalletController.getMyWalletByType,
);

export const WalletRoutes = router;
