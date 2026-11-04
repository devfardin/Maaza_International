import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { ProductModel } from '../products/product.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { ProductPurchaseModel } from './productPurchases.model';
import { DailyClaimModel } from './dailyClaim.model';
import { TPaymentSource, TReferralCommissionSnapshot } from './productPurchases.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns UTC date string 'YYYY-MM-DD' for a given date */
const toDateString = (d: Date): string => d.toISOString().slice(0, 10);

/** Returns start of next UTC day from now */
const startOfNextUTCDay = (from: Date): Date => {
    const d = new Date(from);
    d.setUTCHours(24, 0, 0, 0);
    return d;
};

// ─── Purchase ─────────────────────────────────────────────────────────────────

const purchaseProduct = async (userId: string, productId: string, paymentSource: TPaymentSource) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Verify user
        const user = await UserModel.findById(userId).session(session);
        if (!user || user.isDeleted || user.status !== 'active') {
            throw new AppError(status.FORBIDDEN, 'User account is not eligible for purchases');
        }

        // 2. Verify product
        const product = await ProductModel.findById(productId).session(session);
        if (!product || product.isDeleted || product.status !== 'active') {
            throw new AppError(status.NOT_FOUND, 'Product not available');
        }

        // 3. Membership eligibility
        // if (!product.purchaseRules.allowedMembershipLevels.includes(user.membershipLevel as any)) {
        //     throw new AppError(status.FORBIDDEN, 'Your membership level is not eligible for this product');
        // }

        // 4. Single purchase rule — one active purchase per product per user
        if (product.purchaseRules.purchaseLimit === 1) {
            const existing = await ProductPurchaseModel.findOne({
                userId,
                productId,
                status: 'active',
            }).session(session);
            if (existing) {
                throw new AppError(status.CONFLICT, 'You already have an active purchase for this product');
            }
        }

        // 5. Price in poisha (integer) — product.price is stored in poisha
        const purchasePrice = product.price;

        // 6. Deduct from wallet atomically
        const debitedWallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: paymentSource, balance: { $gte: purchasePrice }, isActive: true },
            { $inc: { balance: -purchasePrice } },
            { new: true, session }
        );
        if (!debitedWallet) {
            throw new AppError(status.BAD_REQUEST, `Insufficient ${paymentSource} wallet balance`);
        }

        // 7. Build referral commission snapshot (level B and C)
        //    Hierarchy: buyer → level A (buyer.referredBy) → level B (A.referredBy) → level C (B.referredBy)
        const dailyIncome = product.rewardPlan.dailyIncome; // integer in poisha

        const referralCommissions: TReferralCommissionSnapshot[] = [];

        const levelAUser = user.referredBy
            ? await UserModel.findById(user.referredBy).session(session)
            : null;

        if (levelAUser) {
            // Level B = level A's referrer
            const levelBUser = levelAUser.referredBy
                ? await UserModel.findById(levelAUser.referredBy).session(session)
                : null;

            if (levelBUser) {
                const bRate = 0.10;
                referralCommissions.push({
                    level: 'B',
                    userId: levelBUser._id as Types.ObjectId,
                    commissionRate: bRate,
                    commissionAmount: Math.floor(dailyIncome * bRate),
                });

                // Level C = level B's referrer
                const levelCUser = levelBUser.referredBy
                    ? await UserModel.findById(levelBUser.referredBy).session(session)
                    : null;

                if (levelCUser) {
                    const cRate = 0.05;
                    referralCommissions.push({
                        level: 'C',
                        userId: levelCUser._id as Types.ObjectId,
                        commissionRate: cRate,
                        commissionAmount: Math.floor(dailyIncome * cRate),
                    });
                }
            }
        }

        // 8. Determine first claim availability
        const now = new Date();
        const startAfter = product.rewardPlan.startAfterPurchaseDays ?? 0;
        const nextClaimAt = startAfter > 0
            ? new Date(now.getTime() + startAfter * 24 * 60 * 60 * 1000)
            : startOfNextUTCDay(now);

        // 9. Create ProductPurchase document
        const [purchase] = await ProductPurchaseModel.insertMany(
            [
                {
                    userId: new Types.ObjectId(userId),
                    productId: product._id,
                    productName: product.name,
                    purchasePrice,
                    dailyIncome,
                    totalRevenue: product.rewardPlan.totalEstimatedRevenue,
                    validityDays: product.rewardPlan.validityDays,
                    paymentSource,
                    purchasedAt: now,
                    nextClaimAt,
                    lastClaimAt: null,
                    totalClaimedDays: 0,
                    referralCommissions,
                    status: 'active',
                },
            ],
            { session }
        );

        // 10. Record purchase transaction
        await TransactionServices.recordTransaction({
            userId,
            type: 'product_purchase',
            flow: 'debit',
            amount: purchasePrice,
            walletAffected: paymentSource,
            balanceAfter: debitedWallet.balance,
            note: `Purchased product: ${product.name}`,
            referenceId: purchase._id as Types.ObjectId,
            session,
        });

        // 11. Increment product purchase count
        await ProductModel.findByIdAndUpdate(productId, { $inc: { purchaseCount: 1 } }, { session });

        await session.commitTransaction();
        return purchase;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

// ─── Daily Income Claim ───────────────────────────────────────────────────────

const claimDailyIncome = async (userId: string, purchaseId: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const now = new Date();
        const todayStr = toDateString(now);

        // 1. Load and validate purchase
        const purchase = await ProductPurchaseModel.findById(purchaseId).session(session);
        if (!purchase) {
            throw new AppError(status.NOT_FOUND, 'Purchase not found');
        }
        if (purchase.userId.toString() !== userId) {
            throw new AppError(status.FORBIDDEN, 'This purchase does not belong to you');
        }
        if (purchase.status !== 'active') {
            throw new AppError(status.BAD_REQUEST, 'Purchase is not active');
        }

        // 2. Claim timing check
        if (now < purchase.nextClaimAt) {
            throw new AppError(status.BAD_REQUEST, 'Daily income is not yet available for claiming');
        }

        // 3. Validity check
        if (purchase.totalClaimedDays >= purchase.validityDays) {
            throw new AppError(status.BAD_REQUEST, 'All validity days have been claimed');
        }

        // 4. Atomic duplicate prevention — insert claim record first
        //    The unique index on (purchaseId, claimDate) will reject concurrent duplicates
        try {
            await DailyClaimModel.insertMany(
                [{ purchaseId: purchase._id, userId: new Types.ObjectId(userId), claimDate: todayStr, incomeAmount: purchase.dailyIncome, claimedAt: now }],
                { session }
            );
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(status.CONFLICT, 'Daily income already claimed for today');
            }
            throw err;
        }

        // 5. Credit buyer's balance wallet
        const buyerWallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: 'balance', isActive: true },
            { $inc: { balance: purchase.dailyIncome } },
            { new: true, session }
        );
        if (!buyerWallet) {
            throw new AppError(status.NOT_FOUND, 'Buyer balance wallet not found');
        }

        // 6. Record buyer income transaction
        await TransactionServices.recordTransaction({
            userId,
            type: 'profit',
            flow: 'credit',
            amount: purchase.dailyIncome,
            walletAffected: 'balance',
            balanceAfter: buyerWallet.balance,
            note: `Daily income from: ${purchase.productName}`,
            referenceId: purchase._id as Types.ObjectId,
            session,
        });

        // 7. Credit referral commissions (level B and C) from buyer's daily income
        for (const ref of purchase.referralCommissions) {
            if (ref.commissionAmount <= 0) continue;

            const refWallet = await WalletModel.findOneAndUpdate(
                { userId: ref.userId, walletType: 'balance', isActive: true },
                { $inc: { balance: ref.commissionAmount } },
                { new: true, session }
            );
            if (!refWallet) continue; // skip silently if referrer wallet missing

            await TransactionServices.recordTransaction({
                userId: ref.userId,
                type: 'commission',
                flow: 'credit',
                amount: ref.commissionAmount,
                walletAffected: 'balance',
                balanceAfter: refWallet.balance,
                note: `Level ${ref.level} commission from ${purchase.productName} (buyer daily income)`,
                referenceId: purchase._id as Types.ObjectId,
                session,
            });
        }

        // 8. Update purchase: increment claimed days, set lastClaimAt, advance nextClaimAt
        const newClaimedDays = purchase.totalClaimedDays + 1;
        const isCompleted = newClaimedDays >= purchase.validityDays;

        await ProductPurchaseModel.findByIdAndUpdate(
            purchaseId,
            {
                $inc: { totalClaimedDays: 1 },
                lastClaimAt: now,
                nextClaimAt: startOfNextUTCDay(now),
                ...(isCompleted && { status: 'completed' }),
            },
            { session }
        );

        await session.commitTransaction();

        return {
            claimed: true,
            incomeAmount: purchase.dailyIncome,
            totalClaimedDays: newClaimedDays,
            isCompleted,
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

// ─── Queries ──────────────────────────────────────────────────────────────────

const getMyPurchases = async (userId: string) => {
    return ProductPurchaseModel.find({ userId })
        .populate('productId', 'name image')
        .sort({ createdAt: -1 });
};

const getSinglePurchase = async (userId: string, purchaseId: string) => {
    const purchase = await ProductPurchaseModel.findById(purchaseId).populate('productId', 'name image');
    if (!purchase) throw new AppError(status.NOT_FOUND, 'Purchase not found');
    if (purchase.userId.toString() !== userId) throw new AppError(status.FORBIDDEN, 'Access denied');
    return purchase;
};

const getClaimHistory = async (userId: string, purchaseId: string) => {
    // Verify ownership
    const purchase = await ProductPurchaseModel.findById(purchaseId);
    if (!purchase) throw new AppError(status.NOT_FOUND, 'Purchase not found');
    if (purchase.userId.toString() !== userId) throw new AppError(status.FORBIDDEN, 'Access denied');

    return DailyClaimModel.find({ purchaseId }).sort({ claimedAt: -1 });
};

export const ProductPurchaseServices = {
    purchaseProduct,
    claimDailyIncome,
    getMyPurchases,
    getSinglePurchase,
    getClaimHistory,
};
