import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { ProductModel } from '../products/product.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { NotificationServices } from '../notifications/notification.services';
import { ProductPurchaseModel } from './productPurchases.model';
import { DailyClaimModel } from './dailyClaim.model';
import { ReferralServices } from '../referrals/referral.services';
import { MembershipServices } from '../users/membership.services';
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

// Per-claim commission for one team level, according to the product's own setting.
//  daily-income   → rate × dailyIncome
//  total-reward   → rate × (total revenue spread over the validity period)
//  purchase-price → rate × (price spread over the validity period)
const commissionPerClaim = (
    c: { rate: number; basis: string },
    p: { price: number; rewardPlan: { dailyIncome: number; totalEstimatedRevenue: number; validityDays: number } }
): number => {
    const days = Math.max(p.rewardPlan.validityDays, 1);
    const base =
        c.basis === 'total-reward' ? p.rewardPlan.totalEstimatedRevenue / days
        : c.basis === 'purchase-price' ? p.price / days
        : p.rewardPlan.dailyIncome;
    return Math.floor(base * c.rate);
};

// Credits a user's BALANCE wallet and logs it. Returns false if the wallet is missing/inactive.
const creditBalance = async (
    userId: Types.ObjectId | string,
    amount: number,
    note: string,
    referenceId: Types.ObjectId,
    session: mongoose.ClientSession
) => {
    if (amount <= 0) return false;
    const wallet = await WalletModel.findOneAndUpdate(
        { userId, walletType: 'balance', isActive: true },
        { $inc: { balance: amount } },
        { new: true, session }
    );
    if (!wallet) return false;
    await TransactionServices.recordTransaction({
        userId,
        type: 'commission',
        flow: 'credit',
        amount,
        walletAffected: 'balance',
        balanceAfter: wallet.balance,
        note,
        referenceId,
        session,
    });
    return true;
};

const purchaseProduct = async (userId: string, productId: string, paymentSource: TPaymentSource) => {
    const session = await mongoose.startSession();
    let committedPurchase: any = null;

    try {
        session.startTransaction();

        // 1. Verify user
        const user = await UserModel.findById(userId).session(session);
        if (!user || user.isDeleted || user.status !== 'active' || user.role !== 'user') {
            throw new AppError(status.FORBIDDEN, 'User account is not eligible for purchases');
        }

        // 2. Verify product
        const product = await ProductModel.findById(productId).session(session);
        if (!product || product.isDeleted || product.status !== 'active') {
            throw new AppError(status.NOT_FOUND, 'Product not available');
        }

        // 3. Membership eligibility (an empty list means "everyone")
        const allowed = product.purchaseRules.allowedMembershipLevels ?? [];
        if (allowed.length && !allowed.includes(user.membershipLevel as never)) {
            throw new AppError(status.FORBIDDEN, 'Your membership level is not eligible for this product');
        }

        // 4. Per-user purchase limit (cancelled purchases don't count)
        const alreadyBought = await ProductPurchaseModel.countDocuments({
            userId,
            productId,
            status: { $ne: 'cancelled' },
        }).session(session);
        if (alreadyBought >= product.purchaseRules.purchaseLimit) {
            throw new AppError(
                status.CONFLICT,
                `Purchase limit reached: you can buy this product ${product.purchaseRules.purchaseLimit} time(s)`
            );
        }

        // 5. Reserve one unit of stock atomically (no overselling under concurrency)
        const reserved = await ProductModel.findOneAndUpdate(
            { _id: productId, quantity: { $gt: 0 }, status: 'active', isDeleted: false },
            { $inc: { quantity: -1, purchaseCount: 1 } },
            { new: true, session }
        );
        if (!reserved) {
            throw new AppError(status.CONFLICT, 'This product is out of stock');
        }
        if (reserved.quantity === 0) {
            await ProductModel.updateOne({ _id: productId }, { status: 'outofstock' }, { session });
        }

        // 6. Price in poisha (integer)
        const purchasePrice = product.price;

        // 7. Deduct from wallet atomically
        const debitedWallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: paymentSource, balance: { $gte: purchasePrice }, isActive: true },
            { $inc: { balance: -purchasePrice } },
            { new: true, session }
        );
        if (!debitedWallet) {
            throw new AppError(status.BAD_REQUEST, `Insufficient ${paymentSource} wallet balance`);
        }

        // 8. Referral chain:  buyer → A (buyer's inviter) → B (A's inviter) → C (B's inviter)
        //    A gets the one-off invitation bonus now;
        //    B and C get a commission of the buyer's daily income on EVERY claim (snapshot below).
        const dailyIncome = product.rewardPlan.dailyIncome;
        const referralCommissions: TReferralCommissionSnapshot[] = [];

        const levelAUser = user.referredBy ? await UserModel.findById(user.referredBy).session(session) : null;
        const levelBUser = levelAUser?.referredBy ? await UserModel.findById(levelAUser.referredBy).session(session) : null;
        const levelCUser = levelBUser?.referredBy ? await UserModel.findById(levelBUser.referredBy).session(session) : null;

        const teamRules = (product.teamCommissions ?? []).filter((c) => c.level === 'B' || c.level === 'C');
        const ruleB = teamRules.find((c) => c.level === 'B');
        const ruleC = teamRules.find((c) => c.level === 'C');

        if (levelBUser && ruleB) {
            referralCommissions.push({
                level: 'B',
                userId: levelBUser._id as Types.ObjectId,
                commissionRate: ruleB.rate,
                commissionAmount: commissionPerClaim(ruleB, product),
            });
        }
        if (levelCUser && ruleC) {
            referralCommissions.push({
                level: 'C',
                userId: levelCUser._id as Types.ObjectId,
                commissionRate: ruleC.rate,
                commissionAmount: commissionPerClaim(ruleC, product),
            });
        }

        // 9. First claim availability
        const now = new Date();
        const startAfter = product.rewardPlan.startAfterPurchaseDays ?? 0;
        const nextClaimAt = startAfter > 0
            ? new Date(now.getTime() + startAfter * 24 * 60 * 60 * 1000)
            : startOfNextUTCDay(now);

        // 10. Create the purchase
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

        // 11. Purchase transaction
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

        // 12. Invitation bonus → buyer's direct inviter (level A)
        if (levelAUser) {
            await creditBalance(
                levelAUser._id,
                product.bonuses?.invitationBonus ?? 0,
                `Invitation bonus: ${user.fullName} purchased ${product.name}`,
                purchase._id as Types.ObjectId,
                session
            );
        }

        // 13. The invited user is now a VALID referral (deposited + bought a product)
        await ReferralServices.markReferralValid(user._id, session);

        // 14. Membership upgrades — the buyer (spend went up) and the inviter (valid referrals went up).
        //     The product's upgrade bonus is paid to whoever moved up a level.
        const toCheck = [user._id, ...(levelAUser ? [levelAUser._id] : [])];
        for (const id of toCheck) {
            const newLevel = await MembershipServices.evaluateUpgrade(id, session);
            if (newLevel) {
                await creditBalance(
                    id,
                    product.bonuses?.upgradeBonus ?? 0,
                    `Upgrade bonus: membership level ${newLevel} reached`,
                    purchase._id as Types.ObjectId,
                    session
                );
            }
        }

        await session.commitTransaction();
        committedPurchase = purchase;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }

    // Admin notification AFTER the commit — it can never fail or undo the purchase
    const buyer = await UserModel.findById(userId);
    NotificationServices.notifyAdmins({
        type: 'product_purchase',
        title: 'Product purchased',
        message: `${buyer?.fullName ?? 'A user'} bought ${committedPurchase.productName} for ৳${(committedPurchase.purchasePrice / 100).toFixed(2)} from ${paymentSource} wallet`,
        actorId: new Types.ObjectId(userId),
        actorName: buyer?.fullName ?? '',
        actorPhone: buyer?.phone ?? '',
        amount: committedPurchase.purchasePrice,
        referenceId: committedPurchase._id as Types.ObjectId,
    });

    return committedPurchase;
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
