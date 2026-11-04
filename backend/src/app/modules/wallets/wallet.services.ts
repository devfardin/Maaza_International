import status from 'http-status';
import mongoose, { ClientSession } from 'mongoose';
import AppError from '../../errors/AppError';
import { TWalletType } from './wallet.interface';
import { WalletModel } from './wallet.model';

// Called inside user registration transaction — not exposed as an API
const createWalletsForUser = async (userId: mongoose.Types.ObjectId, session: ClientSession) => {
    const wallets = await WalletModel.insertMany(
        [
            { userId, walletType: 'recharge', balance: 0, currency: 'BDT', isActive: true },
            { userId, walletType: 'balance', balance: 0, currency: 'BDT', isActive: true },
        ],
        { session }
    );

    if (wallets.length !== 2) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to create user wallets');
    }
    return wallets;
};

const getUserWallets = async (userId: string) => {
    const wallets = await WalletModel.find({ userId });

    if (!wallets.length) {
        throw new AppError(status.NOT_FOUND, 'Wallets not found for this user');
    }

    const recharge = wallets.find((w) => w.walletType === 'recharge');
    const balance = wallets.find((w) => w.walletType === 'balance');

    return {
        rechargeWallet: {
            balance: recharge?.balance ?? 0,
            formattedBalance: ((recharge?.balance ?? 0) / 100).toFixed(2),
            currency: recharge?.currency ?? 'BDT',
        },
        balanceWallet: {
            balance: balance?.balance ?? 0,
            formattedBalance: ((balance?.balance ?? 0) / 100).toFixed(2),
            currency: balance?.currency ?? 'BDT',
        },
    };
};

const getWalletByType = async (userId: string, walletType: TWalletType) => {
    
    const wallet = await WalletModel.findOne({ userId, walletType });

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }

    return {
        balance: wallet.balance,
        formattedBalance: (wallet.balance / 100).toFixed(2),
        currency: wallet.currency,
        isActive: wallet.isActive,
    };
};

const validateWallet = async (userId: string, walletType: TWalletType, session?: ClientSession) => {
    const wallet = await WalletModel.findOne({ userId, walletType }).session(session ?? null);

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }

    if (!wallet.isActive) {
        throw new AppError(status.FORBIDDEN, `${walletType} wallet is inactive`);
    }

    return wallet;
};

// Amount must be a positive integer in poisha
const creditWallet = async (
    userId: string,
    walletType: TWalletType,
    amount: number,
    session: ClientSession
) => {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Amount must be a positive integer in poisha');
    }

    await validateWallet(userId, walletType, session);

    const updated = await WalletModel.findOneAndUpdate(
        { userId, walletType },
        { $inc: { balance: amount } },
        { new: true, session, runValidators: true }
    );

    if (!updated) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to credit wallet');
    }

    return updated;
};

const debitWallet = async (
    userId: string,
    walletType: TWalletType,
    amount: number,
    session: ClientSession
) => {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new AppError(status.BAD_REQUEST, 'Amount must be a positive integer in poisha');
    }

    const wallet = await validateWallet(userId, walletType, session);

    if (wallet.balance < amount) {
        throw new AppError(status.BAD_REQUEST, 'Insufficient wallet balance');
    }

    // Atomic conditional update — prevents concurrent overspend
    const updated = await WalletModel.findOneAndUpdate(
        { user: userId, walletType, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session, runValidators: true }
    );

    if (!updated) {
        throw new AppError(status.BAD_REQUEST, 'Insufficient wallet balance');
    }

    return updated;
};

const checkBalance = async (userId: string, walletType: TWalletType) => {
    const wallet = await WalletModel.findOne({ userId, walletType });

    if (!wallet) {
        throw new AppError(status.NOT_FOUND, `${walletType} wallet not found`);
    }

    return wallet.balance;
};

export const WalletServices = {
    createWalletsForUser,
    getUserWallets,
    getWalletByType,
    creditWallet,
    debitWallet,
    checkBalance,
    validateWallet,
};
