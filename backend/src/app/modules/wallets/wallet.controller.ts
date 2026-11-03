import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WalletServices } from './wallet.services';

const getAllWallets = catchAsync(async (_req, res) => {
    const result = await WalletServices.getAllWallets();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallets retrieved successfully',
        data: result
    });
});

const getWalletByUser = catchAsync(async (req, res) => {
    const result = await WalletServices.getWalletByUser(req.params.userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallet retrieved successfully',
        data: result
    });
});

const updateWallet = catchAsync(async (req, res) => {
    const result = await WalletServices.updateWallet(req.params.userId, req.body);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallet updated successfully',
        data: result
    });
});

const deleteWallet = catchAsync(async (req, res) => {
    await WalletServices.deleteWallet(req.params.userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallet deleted successfully',
        data: null
    });
});

export const WalletController = {
    getAllWallets,
    getWalletByUser,
    updateWallet,
    deleteWallet,
};
