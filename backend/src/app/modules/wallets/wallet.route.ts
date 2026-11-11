import express from 'express';
import { WalletController } from './wallet.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Get all wallets for a user by userId
router.get(
  '/:userId',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  WalletController.getMyWallets,
);

// Get a specific wallet by userId and walletType (?walletType=main)
router.get(
  '/:userId/walletType',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  WalletController.getMyWalletByType,
);

export const WalletRoutes = router;
