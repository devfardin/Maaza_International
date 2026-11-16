import status from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import config from '../../config';
import { sendEmail } from '../../utils/sendEmail';
import { TClientInfo } from '../../utils/clientInfo';
import { ActivityLogServices } from '../activityLogs/activityLog.services';
import { ReferralServices } from '../referrals/referral.services';
import { WalletServices } from '../wallets/wallet.services';
import { WalletModel } from '../wallets/wallet.model';
import { ProductPurchaseModel } from '../productPurchages/productPurchases.model';
import { Tuser, TUserRole } from './user.interface';
import { UserModel } from './user.model';
import { generateUniqueReferralCode } from './user.utils';
import { sendImageToCloudinary } from '../../utils/sendImageToCloudinary';

type TRegisterPayload = Pick<Tuser, 'fullName' | 'email' | 'phone' | 'passwordHash'> & {
    referredBy?: string; // referral CODE
};

// Shared by public registration (role = user) and super_admin → create admin
const registerAccount = async (
    payload: TRegisterPayload,
    role: TUserRole,
    clientInfo?: TClientInfo
) => {
    const session = await mongoose.startSession();
    let created;

    try {
        session.startTransaction();

        const userExist = await UserModel.findOne({
            $or: [{ email: payload.email }, { phone: payload.phone }],
        }).session(session);
        if (userExist) {
            throw new AppError(status.CONFLICT, 'User already exists with this email or phone number');
        }

        // resolve referral code → inviter (public registration only)
        let referredBy: mongoose.Types.ObjectId | undefined;
        if (payload.referredBy && role === 'user') {
            const referrer = await UserModel.findOne({
                referralCode: payload.referredBy,
                isDeleted: false,
            }).session(session);
            if (!referrer) {
                throw new AppError(status.BAD_REQUEST, 'Invalid referral code');
            }
            referredBy = referrer._id;
        }

        const referralCode = await generateUniqueReferralCode(payload.phone);

        // role / status / membershipLevel are set by the SERVER, never by the client
        const result = await UserModel.create(
            [{
                fullName: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                passwordHash: payload.passwordHash,
                referralCode,
                referredBy,
                role,
                status: 'active',
                membershipLevel: 1,
            }],
            { session }
        );
        created = result[0];

        // track the referral relationship (invalid until the invitee deposits + buys)
        if (referredBy) {
            await ReferralServices.createReferral(referredBy, created._id, session);
        }

        // wallets are only needed for normal users
        if (role === 'user') {
            await WalletServices.createWalletsForUser(created._id, session);
        }

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    // Side effects AFTER the commit: they must not roll back / fail a registration
    if (clientInfo) {
        await ActivityLogServices.record('register', clientInfo, { userId: created._id, phone: created.phone });
    }
    sendEmail({
        to: created.email,
        subject: 'Welcome to Maaza International!',
        heading: `Welcome, ${created.fullName}!`,
        subheading: 'Your account has been created successfully.',
        body: `<p>You can now log in and start exploring products, earning daily income, and inviting friends.</p>`,
        button: { label: 'Go to Dashboard', url: `${config.frontend_url}/dashboard` },
    }).catch((err) => console.error('Welcome email failed', err));

    return created;
};

const createUser = (payload: TRegisterPayload, clientInfo?: TClientInfo) =>
    registerAccount(payload, 'user', clientInfo);

const createAdmin = (payload: TRegisterPayload, clientInfo?: TClientInfo) =>
    registerAccount({ ...payload, referredBy: undefined }, 'admin', clientInfo);

const getMe = async (userId: string) => {
    return UserModel.findOne({ _id: userId, isDeleted: false })
        .select('-passwordHash')
        .populate('referredBy', 'fullName phone referralCode');
};

// Every user with how many products they bought and their two wallet balances (BDT)
const getAllUsers = async () => {
    const users = await UserModel.find({ isDeleted: false }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    const ids = users.map((u) => u._id);

    const [purchaseCounts, wallets] = await Promise.all([
        // cancelled purchases are not counted as products the user owns
        ProductPurchaseModel.aggregate([
            { $match: { userId: { $in: ids }, status: { $ne: 'cancelled' } } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]),
        WalletModel.find({ userId: { $in: ids } }).select('userId walletType balance').lean(),
    ]);

    const productCounts = new Map<string, number>(purchaseCounts.map((p) => [String(p._id), p.count]));
    const balances = new Map<string, { balanceWallet: number; rechargeWallet: number }>();
    for (const w of wallets) {
        const key = String(w.userId);
        const entry = balances.get(key) ?? { balanceWallet: 0, rechargeWallet: 0 };
        if (w.walletType === 'balance') entry.balanceWallet = w.balance;
        else entry.rechargeWallet = w.balance;
        balances.set(key, entry);
    }

    return users.map((u) => {
        const key = String(u._id);
        return {
            ...u,
            productCount: productCounts.get(key) ?? 0,
            balanceWallet: balances.get(key)?.balanceWallet ?? 0,
            rechargeWallet: balances.get(key)?.rechargeWallet ?? 0,
        };
    });
};

const getSingleUser = async (id: string) => {
    return UserModel.findById(id).select('-passwordHash').populate('referredBy', 'fullName phone referralCode');
};

// Who may modify whom:
//  - nobody can modify themselves through the admin endpoints
//  - nobody can modify a super_admin
//  - only a super_admin can modify an admin
const assertCanManage = (actor: { userId: string; role: string }, target: { _id: unknown; role: string }) => {
    if (String(target._id) === actor.userId) {
        throw new AppError(status.FORBIDDEN, 'You cannot perform this action on your own account');
    }
    if (target.role === 'super_admin') {
        throw new AppError(status.FORBIDDEN, 'You do not have permission to modify a super admin');
    }
    if (target.role === 'admin' && actor.role !== 'super_admin') {
        throw new AppError(status.FORBIDDEN, 'Only a super admin can modify an admin');
    }
};

const updateUser = async (
    actor: { userId: string; role: string },
    id: string,
    payload: Partial<Pick<Tuser, 'fullName' | 'email' | 'phone' | 'avatar' | 'membershipLevel' | 'role'>>
) => {
    const target = await UserModel.findById(id);
    if (!target || target.isDeleted) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    assertCanManage(actor, target);

    if (payload.role !== undefined && actor.role !== 'super_admin') {
        throw new AppError(status.FORBIDDEN, 'Only a super admin can change roles');
    }

    return UserModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).select('-passwordHash');
};

const deleteUser = async (actor: { userId: string; role: string }, id: string) => {
    const target = await UserModel.findById(id);
    if (!target || target.isDeleted) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    assertCanManage(actor, target);

    return UserModel.findByIdAndUpdate(id, { isDeleted: true, status: 'blocked' }, { new: true }).select('-passwordHash');
};

const updateMyProfile = async (
    userId: string,
    payload: { fullName?: string; email?: string; phone?: string; avatar?: string; district?: string }
) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found');

    const update: Partial<Pick<Tuser, 'fullName' | 'email' | 'phone' | 'avatar' | 'district'>> = {};

    if (payload.fullName !== undefined) update.fullName = payload.fullName;

    if (payload.email !== undefined && payload.email !== user.email) {
        const taken = await UserModel.exists({ email: payload.email, _id: { $ne: user._id } });
        if (taken) throw new AppError(status.CONFLICT, 'This email is already used by another account');
        update.email = payload.email;
    }

    if (payload.phone !== undefined && payload.phone !== user.phone) {
        const taken = await UserModel.exists({ phone: payload.phone, _id: { $ne: user._id } });
        if (taken) throw new AppError(status.CONFLICT, 'This phone number is already used by another account');
        update.phone = payload.phone;
    }

    if (payload.avatar !== undefined) update.avatar = payload.avatar;

    if (payload.district !== undefined) update.district = payload.district;

    if (Object.keys(update).length === 0) {
        return getMe(userId);
    }

    await UserModel.updateOne({ _id: user._id }, update, { runValidators: true });
    return getMe(userId);
};

// Uploads the profile photo to Cloudinary and stores its URL on the user
const uploadMyAvatar = async (userId: string, filePath: string) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError(status.NOT_FOUND, 'User not found');

    const { secure_url } = await sendImageToCloudinary(`avatar_${user._id.toString()}_${Date.now()}`, filePath);
    await UserModel.updateOne({ _id: user._id }, { avatar: secure_url });
    return getMe(userId);
};

const changeUserStatus = async (actor: { userId: string; role: string }, id: string, newStatus: string) => {
    const target = await UserModel.findById(id);
    if (!target || target.isDeleted) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }
    assertCanManage(actor, target);

    return UserModel.findByIdAndUpdate(id, { status: newStatus }, { new: true, runValidators: true }).select('-passwordHash');
};

export const UserServices = {
    createUser,
    createAdmin,
    getMe,
    getAllUsers,
    getSingleUser,
    updateUser,
    updateMyProfile,
    uploadMyAvatar,
    deleteUser,
    changeUserStatus,
};
