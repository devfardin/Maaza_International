import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductPurchaseServices } from './productPurchases.services';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';

const purchaseProduct = catchAsync(async (req, res) => {
    // const userId = req.user?.userId;
    const { userId } = req.body;
    // const userId = await UserModel.findOne({_id: user});
    if (!userId) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const { productId, paymentSource } = req.body;
    const result = await ProductPurchaseServices.purchaseProduct(userId, productId, paymentSource);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Product purchased successfully',
        data: result,
    });
});

const claimDailyIncome = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const { purchaseId } = req.params;
    const result = await ProductPurchaseServices.claimDailyIncome(userId, purchaseId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Daily income claimed successfully',
        data: result,
    });
});

const getMyPurchases = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const result = await ProductPurchaseServices.getMyPurchases(userId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Purchases retrieved successfully',
        data: result,
    });
});

const getSinglePurchase = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const { purchaseId } = req.params;
    const result = await ProductPurchaseServices.getSinglePurchase(userId, purchaseId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Purchase retrieved successfully',
        data: result,
    });
});

const getClaimHistory = catchAsync(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const { purchaseId } = req.params;
    const result = await ProductPurchaseServices.getClaimHistory(userId, purchaseId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Claim history retrieved successfully',
        data: result,
    });
});

export const ProductPurchaseController = {
    purchaseProduct,
    claimDailyIncome,
    getMyPurchases,
    getSinglePurchase,
    getClaimHistory,
};
