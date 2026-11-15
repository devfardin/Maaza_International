import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WalletServices } from './wallet.services';
import AppError from '../../errors/AppError';
import { TWalletType } from './wallet.interface';
import { assertSelfOrAdmin } from '../../utils/assertOwnership';
import { moneyText } from '../../utils/money';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';

const getMyWallets = catchAsync(async (req, res) => {
    const { userId } = req.params;
    assertSelfOrAdmin(req, userId);
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
    assertSelfOrAdmin(req, userId);
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
    assertSelfOrAdmin(req, userId);
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

// Admin / super_admin: move money between a member's balance and recharge wallets
const exchangeWallets = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const result = await WalletServices.exchangeWallets(userId, req.body);
    await AdminActivityServices.record(
        req.user!,
        'wallet_exchanged',
        `Moved ${moneyText(req.body.amount)} from ${req.body.from} to ${req.body.to} wallet`,
        { type: 'user', id: userId }
    );
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Wallet exchange completed',
        data: result,
    });
});

export const WalletController = {
    getMyWallets,
    getMyWalletByType,
    checkBalance,
    exchangeWallets,
};
