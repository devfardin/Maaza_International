import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TransactionServices } from "./transaction.services";
import { TTransactionType } from "./transaction.interface";
import { assertSelfOrAdmin } from "../../utils/assertOwnership";

// get all transactions for a specific user
const getUserTransactions = catchAsync(async (req, res) => {
    const { userId } = req.params;
    assertSelfOrAdmin(req, userId);
    const result = await TransactionServices.getUserTransactions(userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User transactions retrieved successfully",
        data: result,
    });
});

// get transactions for a user filtered by type (?type=deposit)
const getUserTransactionsByType = catchAsync(async (req, res) => {
    const { userId } = req.params;
    assertSelfOrAdmin(req, userId);
    const { type } = req.query;
    const result = await TransactionServices.getUserTransactionsByType(userId, type as TTransactionType);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "User transactions retrieved successfully",
        data: result,
    });
});

// get all transactions (admin)
const getAllTransactions = catchAsync(async (req, res) => {
    const result = await TransactionServices.getAllTransactions();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "All transactions retrieved successfully",
        data: result,
    });
});

// get a single transaction by ID
const getSingleTransaction = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await TransactionServices.getSingleTransaction(id);
    // populated userId is an object; compare against its _id
    const owner = (result.userId as unknown as { _id?: unknown })?._id ?? result.userId;
    assertSelfOrAdmin(req, String(owner));
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Transaction retrieved successfully",
        data: result,
    });
});

export const TransactionController = {
    getUserTransactions,
    getUserTransactionsByType,
    getAllTransactions,
    getSingleTransaction,
};
