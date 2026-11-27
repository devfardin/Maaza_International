import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';
import { RedeemCodeServices } from './redeemCode.services';

const createRedeemCode = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.createRedeemCode(req.body, req.user!);
    await AdminActivityServices.record(
        req.user!,
        'redeem_code_created',
        `Created redeem code ${result.code}: ৳${result.amount} × ${result.prizeCount} prizes`,
        { type: 'redeem_code', id: result._id }
    );
    sendResponse(res, { statusCode: status.CREATED, success: true, message: 'Redeem code created successfully', data: result });
});

const listRedeemCodes = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.listRedeemCodes(req.user!);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Redeem codes retrieved', data: result });
});

const getRedeemSummary = catchAsync(async (_req, res) => {
    const result = await RedeemCodeServices.getRedeemSummary();
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Redeem summary retrieved', data: result });
});

const setRedeemCodeStatus = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.setRedeemCodeStatus(req.params.id, req.body.isActive, req.user!);
    await AdminActivityServices.record(
        req.user!,
        result.isActive ? 'redeem_code_enabled' : 'redeem_code_disabled',
        `${result.isActive ? 'Turned on' : 'Turned off'} redeem code ${result.code}`,
        { type: 'redeem_code', id: result._id }
    );
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Redeem code updated', data: result });
});

const getRedeemCodeClaims = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.getRedeemCodeClaims(req.params.id, req.user!);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Redeem code claims retrieved', data: result });
});

const getMyClaims = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.getMyClaims(req.user!.userId);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Your redeem claims retrieved', data: result });
});

const claimRedeemCode = catchAsync(async (req, res) => {
    const result = await RedeemCodeServices.claimRedeemCode(req.user!.userId, req.body.code);
    sendResponse(res, { statusCode: status.OK, success: true, message: `৳${result.amount} added to your balance wallet`, data: result });
});

export const RedeemCodeControllers = {
    createRedeemCode,
    listRedeemCodes,
    getRedeemSummary,
    setRedeemCodeStatus,
    getRedeemCodeClaims,
    getMyClaims,
    claimRedeemCode,
};
