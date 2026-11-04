import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WalletServices } from './wallet.services';
import AppError from '../../errors/AppError';
import { TWalletType } from './wallet.interface';
import { UserModel } from '../users/user.model';

const getMyWallets = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const existUser = UserModel.findById({ _id: userId })
    if (!existUser) throw new AppError(status.UNAUTHORIZED, 'Unauthorized'); 

    const result = await WalletServices.getUserWallets(userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallets retrieved successfully',
        data: result,
    });
});

const checkBalance = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const existUser = UserModel.findById(userId)
    if (!existUser) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');


    const { walletType } = req.params;
    if (walletType !== 'recharge' && walletType !== 'balance') {
        throw new AppError(status.BAD_REQUEST, 'Invalid wallet type. Must be recharge or balance');
    }

    const result = await WalletServices.getWalletByType(userId, walletType as TWalletType);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: `${walletType} wallet retrieved successfully`,
        data: result,
    });
})

const getMyWalletByType = catchAsync(async (req, res) => {

    const { userId } = req.params;
    const existUser = UserModel.findById(userId)

    if (!existUser) throw new AppError(status.UNAUTHORIZED, 'Unauthorized');

    const { walletType } = req.query;
    if (walletType !== 'recharge' && walletType !== 'balance') {
        throw new AppError(status.BAD_REQUEST, 'Invalid wallet type. Must be recharge or balance');
    }

    const result = await WalletServices.getWalletByType(userId, walletType as TWalletType);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: `${walletType} wallet retrieved successfully`,
        data: result,
    });
});

export const WalletController = {
    getMyWallets,
    getMyWalletByType,
    checkBalance
};
