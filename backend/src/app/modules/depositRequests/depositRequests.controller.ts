import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DepositRequestServices } from "./depositRequests.services";
import { assertSelfOrAdmin } from "../../utils/assertOwnership";
import { AdminActivityServices } from "../adminActivity/adminActivity.services";

// create a new deposit request
const createDepositRequest = catchAsync(async (req, res) => {
    const result = await DepositRequestServices.createDepositRequest(req.user!.userId, req.body);
    sendResponse(res, {
        success: true,
        statusCode: status.CREATED,
        message: "Deposit request submitted successfully",
        data: result,
    });
});

// get all deposit requests (admin only)
const getAllDepositRequests = catchAsync(async (req, res) => {
    const result = await DepositRequestServices.getAllDepositRequests();
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Deposit requests retrieved successfully",
        data: result,
    });
});

// get deposit requests for a specific user
const getDepositRequestsByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    assertSelfOrAdmin(req, userId);
    const result = await DepositRequestServices.getDepositRequestsByUser(userId);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "User deposit requests retrieved successfully",
        data: result,
    });
});

// approve or reject a deposit request (admin only)
const updateDepositRequestStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await DepositRequestServices.updateDepositRequestStatus(id, req.body, req.user!.userId);
    await AdminActivityServices.record(
        req.user!,
        `deposit_${req.body.status}`,
        `${req.body.status === "approved" ? "Approved" : "Rejected"} deposit of ${(result.amount / 100).toFixed(2)} BDT (TrxID ${result.transactionId})`,
        { type: "deposit_request", id }
    );
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: "Deposit request status updated successfully",
        data: result,
    });
});

export const DepositRequestController = {
    createDepositRequest,
    getAllDepositRequests,
    getDepositRequestsByUser,
    updateDepositRequestStatus,
};
