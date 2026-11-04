import express from "express";
import { TransactionController } from "./transaction.controller";

const router = express.Router();

// get all transactions (admin)
router.get("/", TransactionController.getAllTransactions);

// get all transactions for a specific user
router.get("/user/:userId", TransactionController.getUserTransactions);

// get transactions for a user filtered by type (?type=deposit)
router.get("/user/:userId/filter", TransactionController.getUserTransactionsByType);

// get a single transaction by ID
router.get("/:id", TransactionController.getSingleTransaction);

export const TransactionRoutes = router;
