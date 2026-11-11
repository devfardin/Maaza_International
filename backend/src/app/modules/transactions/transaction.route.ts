import express from 'express';
import { TransactionController } from './transaction.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Get all transactions (admin only)
router.get(
  '/',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  TransactionController.getAllTransactions,
);

// Get all transactions for a specific user
router.get(
  '/user/:userId',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  TransactionController.getUserTransactions,
);

// Get transactions for a user filtered by type (?type=deposit)
router.get(
  '/user/:userId/filter',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  TransactionController.getUserTransactionsByType,
);

// Get a single transaction by ID
router.get(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  TransactionController.getSingleTransaction,
);

export const TransactionRoutes = router;
