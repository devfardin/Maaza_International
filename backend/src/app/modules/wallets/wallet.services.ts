import { TWallet } from './wallet.interface';
import { WalletModel } from './wallet.model';

const createWallet = async (payload: Pick<TWallet, 'userId'>) => {
    return await WalletModel.create(payload);
};

const getAllWallets = async () => {
    return await WalletModel.find().populate('userId', 'fullName email phone');
};

const getWalletByUser = async (userId: string) => {
    return await WalletModel.findOne({ userId }).populate('userId', 'fullName email phone');
};

const updateWallet = async (userId: string, payload: Partial<Pick<TWallet, 'rechargeBalance' | 'withdrawBalance' | 'currency' | 'status'>>) => {
    return await WalletModel.findOneAndUpdate({ userId }, { $set: payload }, { new: true, runValidators: true });
};

const deleteWallet = async (userId: string) => {
    return await WalletModel.findOneAndDelete({ userId });
};

export const WalletServices = {
    createWallet,
    getAllWallets,
    getWalletByUser,
    updateWallet,
    deleteWallet,
};
