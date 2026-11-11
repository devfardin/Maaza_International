import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { assertSelfOrAdmin } from '../../utils/assertOwnership';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';
import { WithdrawalServices } from './withdrawal.services';
import { TWithdrawalStatus } from './withdrawal.model';

// user: request a withdrawal
const createWithdrawal = catchAsync(async (req, res) => {
    const result = await WithdrawalServices.createWithdrawal(req.user!.userId, req.body);
    sendResponse(res, {
        success: true,
        statusCode: status.CREATED,
        message: 'Withdrawal request submitted successfully',
        data: result,
    });
});

// user: own withdrawal history
const getMyWithdrawals = catchAsync(async (req, res) => {
    const result = await WithdrawalServices.getMyWithdrawals(req.user!.userId);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Withdrawals retrieved successfully',
        data: result,
    });
});

// user id in path: self or admin
const getWithdrawalsByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    assertSelfOrAdmin(req, userId);
    const result = await WithdrawalServices.getMyWithdrawals(userId);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Withdrawals retrieved successfully',
        data: result,
    });
});

// admin: all withdrawals (?status=pending)
const getAllWithdrawals = catchAsync(async (req, res) => {
    const s = req.query.status as TWithdrawalStatus | undefined;
    const result = await WithdrawalServices.getAllWithdrawals(s ? { status: s } : {});
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Withdrawals retrieved successfully',
        data: result,
    });
});

// admin: approve or reject
const updateWithdrawalStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await WithdrawalServices.updateWithdrawalStatus(id, req.body, req.user!.userId);
    await AdminActivityServices.record(
        req.user!,
        `withdrawal_${req.body.status}`,
        `${req.body.status === 'approved' ? 'Approved' : 'Rejected'} withdrawal of ${(result.amount / 100).toFixed(2)} BDT`,
        { type: 'withdrawal', id }
    );
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: `Withdrawal ${req.body.status} successfully`,
        data: result,
    });
});

export const WithdrawalController = {
    createWithdrawal,
    getMyWithdrawals,
    getWithdrawalsByUser,
    getAllWithdrawals,
    updateWithdrawalStatus,
};
