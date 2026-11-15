import { moneyIncrement, proRata, shareOf } from '../../utils/money';
import status from 'http-status';
import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { ProductModel } from '../products/product.model';
import { WalletModel } from '../wallets/wallet.model';
import { TransactionServices } from '../transactions/transaction.services';
import { NotificationServices } from '../notifications/notification.services';
import { RealtimeServices } from '../realtime/realtime.services';
import { ProductPurchaseModel } from './productPurchases.model';
import { DailyClaimModel } from './dailyClaim.model';
import { ReferralServices } from '../referrals/referral.services';
import { MembershipServices } from '../users/membership.services';
import { TPaymentSource, TReferralCommissionSnapshot } from './productPurchases.interface';
import { DEFAULT_CLAIM_INTERVAL_DAYS } from '../../config/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns UTC date string 'YYYY-MM-DD' for a given date */
const toDateString = (d: Date): string => d.toISOString().slice(0, 10);

const addHours = (from: Date, hours: number): Date => new Date(from.getTime() + hours * 60 * 60 * 1000);

// Claim interval in hours. Hourly products use claimIntervalHours; daily products use claimIntervalDays × 24.
const claimEveryHoursOf = (rp: { claimUnit?: string; claimIntervalHours?: number; claimIntervalDays?: number }): number =>
    rp.claimUnit === 'hour'
        ? Math.max(rp.claimIntervalHours || 1, 1)
        : Math.max(rp.claimIntervalDays || DEFAULT_CLAIM_INTERVAL_DAYS, 1) * 24;

// Interval of an existing purchase (older purchases only have claimIntervalDays)
const purchaseEveryHours = (p: { claimEveryHours?: number; claimIntervalDays?: number }): number =>
    p.claimEveryHours ?? Math.max(p.claimIntervalDays || 1, 1) * 24;

// Hours already claimed on a purchase (older purchases only have totalClaimedDays)
const purchaseClaimedHours = (p: { claimedHours?: number; totalClaimedDays?: number }): number =>
    p.claimedHours ?? (p.totalClaimedDays || 0) * 24;

// ─── Purchase ─────────────────────────────────────────────────────────────────

// Team commission (level A and B) is paid on each profit CLAIM, never at purchase.
// Each claim pays  claim income × the product's A/B rate  to that upline member.
// Daily product: one claim per 24 h, so commission is paid every 24 h.
// Hourly product: one claim per hour, so commission is paid every hour.
const teamCommissionOf = (claimIncome: number, rate: number): number => shareOf(claimIncome, rate);

// Credits a user's BALANCE wallet and logs it. Returns false if the wallet is missing/inactive.
const creditBalance = async (
    userId: Types.ObjectId | string,
    amount: number,
    note: string,
    referenceId: Types.ObjectId,
    session: mongoose.ClientSession,
    type: 'commission' | 'invitation_bonus' | 'upgrade_bonus' = 'commission'
) => {
    if (amount <= 0) return false;
    const wallet = await WalletModel.findOneAndUpdate(
        { userId, walletType: 'balance', isActive: true },
        moneyIncrement('balance', amount),
        { new: true, session }
    );
    if (!wallet) return false;
    await TransactionServices.recordTransaction({
        userId,
        type,
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
        if (!product || product.isDeleted || product.status !== 'active' || product.approvalStatus !== 'approved') {
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

        // Is this the buyer's FIRST purchase of anything? The referral bonus is one-time.
        const priorPurchases = await ProductPurchaseModel.countDocuments({
            userId,
            status: { $ne: 'cancelled' },
        }).session(session);
        const isFirstPurchase = priorPurchases === 0;

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

        // 6. Price in BDT (2 decimals)
        const purchasePrice = product.price;

        // 7. Deduct from wallet atomically
        const debitedWallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: paymentSource, balance: { $gte: purchasePrice }, isActive: true },
            moneyIncrement('balance', -purchasePrice),
            { new: true, session }
        );
        if (!debitedWallet) {
            throw new AppError(status.BAD_REQUEST, `Insufficient ${paymentSource} wallet balance`);
        }

        // 8. Referral chain:  buyer → A (buyer's inviter) → B (A's inviter) → C (B's inviter)
        //    A gets the one-off invitation bonus now;
        //    A and B get a commission of the buyer's claim income on EVERY claim (snapshot below).
        const dailyIncome = product.rewardPlan.dailyIncome;
        const claimUnit: 'hour' | 'day' = product.rewardPlan.claimUnit === 'hour' ? 'hour' : 'day';
        const claimEveryHours = claimEveryHoursOf(product.rewardPlan);
        const claimIntervalDays = Math.max(1, Math.round(claimEveryHours / 24));
        const referralCommissions: TReferralCommissionSnapshot[] = [];

        const levelAUser = user.referredBy ? await UserModel.findById(user.referredBy).session(session) : null;
        const levelBUser = levelAUser?.referredBy ? await UserModel.findById(levelAUser.referredBy).session(session) : null;
        // Team commission: the buyer's inviter (A) and the inviter's inviter (B) earn a share of each claim.
        // The direct inviter also gets the one-time invitation bonus (step 12).
        const ruleA = (product.teamCommissions ?? []).find((c) => c.level === 'A');
        const ruleB = (product.teamCommissions ?? []).find((c) => c.level === 'B');

        // Snapshot the rates now; the commission amount is worked out on every claim.
        if (levelAUser && ruleA) {
            referralCommissions.push({
                level: 'A',
                userId: levelAUser._id as Types.ObjectId,
                commissionRate: ruleA.rate,
            });
        }
        if (levelBUser && ruleB) {
            referralCommissions.push({
                level: 'B',
                userId: levelBUser._id as Types.ObjectId,
                commissionRate: ruleB.rate,
            });
        }

        // 9. First claim availability: available right after purchase.
        //    Later claims are spaced one interval apart (daily → 24 h, hourly → 1 h).
        const now = new Date();
        const nextClaimAt = now;

        // 10. Create the purchase
        const [purchase] = await ProductPurchaseModel.insertMany(
            [
                {
                    userId: new Types.ObjectId(userId),
                    productId: product._id,
                    productName: product.name,
                    purchasePrice,
                    dailyIncome,
                    claimIntervalDays,
                    claimUnit,
                    claimEveryHours,
                    claimedHours: 0,
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

        // 12. Direct inviter (level A):
        //     - invitation bonus, ONLY on the invitee's first purchase (never again for the same invitee)
        if (levelAUser && isFirstPurchase) {
            await creditBalance(
                levelAUser._id,
                product.bonuses?.invitationBonus ?? 0,
                `Invitation bonus: ${user.fullName} made their first purchase`,
                purchase._id as Types.ObjectId,
                session,
                'invitation_bonus'
            );
        }

        // 13. The invited user is now a VALID referral (deposited + bought a product)
        await ReferralServices.markReferralValid(user._id, session);

        // 14. Membership upgrades — the buyer (spend went up) and the inviter (valid referrals went up).
        //     The product's upgrade bonus is paid to whoever moved up a level.
        // Upgrade bonus: the buyer gets the product's upgrade bonus on every purchase AFTER the first one.
        // The first purchase never pays it. The inviter never receives an upgrade bonus.
        if (!isFirstPurchase) {
            await creditBalance(
                user._id,
                product.bonuses?.upgradeBonus ?? 0,
                `Upgrade bonus: ${product.name}`,
                purchase._id as Types.ObjectId,
                session,
                'upgrade_bonus'
            );
        }

        // VIP progress: re-evaluate the buyer and the inviter (VIP level only, no bonus here)
        const upgrades: { userId: Types.ObjectId; membershipLevel: number }[] = [];
        for (const id of [user._id, ...(levelAUser ? [levelAUser._id] : [])]) {
            const newLevel = await MembershipServices.evaluateUpgrade(id, session);
            if (newLevel) upgrades.push({ userId: id as Types.ObjectId, membershipLevel: newLevel });
        }

        await session.commitTransaction();
        committedPurchase = purchase;

        // Live updates (after commit): the inviter's wallet / referrals, and any VIP upgrade
        if (levelAUser) {
            RealtimeServices.notifyUser(levelAUser._id, ['Wallet', 'Transactions', 'Referrals', 'User']);
        }
        for (const up of upgrades) {
            RealtimeServices.notifyUser(up.userId, ['User', 'Wallet', 'Transactions', 'Referrals', 'DailyCheckin']);
            RealtimeServices.notifyVipUpgrade(up.userId, {
                membershipLevel: up.membershipLevel,
                vipLevel: up.membershipLevel,
            });
        }

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
        message: `${buyer?.fullName ?? 'A user'} bought ${committedPurchase.productName} for ৳${Number(committedPurchase.purchasePrice).toFixed(2)} from ${paymentSource} wallet`,
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

        // 2. Claim timing check: the first claim is available straight after purchase;
        //    after that, each claim waits for the interval (daily 24 h, hourly 1 h).
        if (purchase.lastClaimAt && now < purchase.nextClaimAt) {
            throw new AppError(status.BAD_REQUEST, 'Income is not yet available for claiming');
        }

        // 3. Validity check (progress is tracked in hours: validity days × 24)
        const everyHours = purchaseEveryHours(purchase);
        const claimedHours = purchaseClaimedHours(purchase);
        const validityHours = purchase.validityDays * 24;
        if (claimedHours >= validityHours) {
            throw new AppError(status.BAD_REQUEST, 'All validity has already been claimed');
        }

        // One claim covers `everyHours` (the last claim may cover less). Income is pro-rated from the daily income.
        const coveredHours = Math.min(everyHours, validityHours - claimedHours);
        const income = proRata(purchase.dailyIncome, coveredHours);
        const isHourly = purchase.claimUnit === 'hour';
        // one claim per hour for hourly products, one per calendar day for daily products
        const claimKey = isHourly ? now.toISOString().slice(0, 13) : todayStr;

        // 4. Atomic duplicate prevention — insert claim record first
        //    The unique index on (purchaseId, claimDate) will reject concurrent duplicates
        try {
            await DailyClaimModel.insertMany(
                [{ purchaseId: purchase._id, userId: new Types.ObjectId(userId), claimDate: claimKey, incomeAmount: income, claimedAt: now }],
                { session }
            );
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(status.CONFLICT, isHourly ? 'Income already claimed this hour' : 'Income already claimed for today');
            }
            throw err;
        }

        // 5. Credit buyer's balance wallet
        const buyerWallet = await WalletModel.findOneAndUpdate(
            { userId, walletType: 'balance', isActive: true },
            moneyIncrement('balance', income),
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
            amount: income,
            walletAffected: 'balance',
            balanceAfter: buyerWallet.balance,
            note: `Profit (${isHourly ? `${coveredHours} hour${coveredHours > 1 ? 's' : ''}` : `${coveredHours / 24} day${coveredHours > 24 ? 's' : ''}`}) from: ${purchase.productName}`,
            referenceId: purchase._id as Types.ObjectId,
            session,
        });

        // 7. Credit referral commissions (level A and B) on this claim, to their balance wallets
        for (const ref of purchase.referralCommissions) {
            const amount = teamCommissionOf(income, ref.commissionRate);
            if (amount <= 0) continue;

            const refWallet = await WalletModel.findOneAndUpdate(
                { userId: ref.userId, walletType: 'balance', isActive: true },
                moneyIncrement('balance', amount),
                { new: true, session }
            );
            if (!refWallet) continue; // skip silently if referrer wallet missing

            await TransactionServices.recordTransaction({
                userId: ref.userId,
                type: 'commission',
                flow: 'credit',
                amount,
                walletAffected: 'balance',
                balanceAfter: refWallet.balance,
                note: `Level ${ref.level} team commission from ${purchase.productName} (buyer profit claim)`,
                referenceId: purchase._id as Types.ObjectId,
                session,
            });
        }

        // 8. Update purchase: advance claimed hours, set lastClaimAt, schedule the next claim
        const newClaimedHours = claimedHours + coveredHours;
        const isCompleted = newClaimedHours >= validityHours;
        // next claim is one full interval after this claim (hourly: 1 h, daily: 24 h)
        const nextClaimAt = isCompleted ? now : addHours(now, everyHours);

        // received amount is a money field: rounded inside MongoDB
        await ProductPurchaseModel.updateOne({ _id: purchaseId }, moneyIncrement('receivedAmount', income), { session });

        await ProductPurchaseModel.findByIdAndUpdate(
            purchaseId,
            {
                claimedHours: newClaimedHours,
                totalClaimedDays: newClaimedHours / 24,
                lastClaimAt: now,
                nextClaimAt,
                ...(isCompleted && { status: 'completed' }),
            },
            { session }
        );

        await session.commitTransaction();

        return {
            claimed: true,
            incomeAmount: income,
            coveredHours,
            coveredDays: coveredHours / 24,
            totalClaimedDays: newClaimedHours / 24,
            isCompleted,
            nextClaimAt: isCompleted ? null : nextClaimAt,
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

// ─── Queries ──────────────────────────────────────────────────────────────────

// Income summary for the "My Products" page:
//  - todayIncome: daily income claimed today (UTC day) across all purchases
//  - totalEarned: everything already received from the purchases
const getIncomeSummary = async (userId: string) => {
    const uid = new mongoose.Types.ObjectId(userId);
    const today = toDateString(new Date());
    const [todayRows, totalRows] = await Promise.all([
        DailyClaimModel.aggregate([
            { $match: { userId: uid, claimDate: today } },
            { $group: { _id: null, total: { $sum: '$incomeAmount' } } },
        ]),
        ProductPurchaseModel.aggregate([
            { $match: { userId: uid } },
            { $group: { _id: null, total: { $sum: '$receivedAmount' } } },
        ]),
    ]);
    return {
        todayIncome: todayRows[0]?.total ?? 0,
        totalEarned: totalRows[0]?.total ?? 0,
    };
};

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
    getIncomeSummary,
    getSinglePurchase,
    getClaimHistory,
};
