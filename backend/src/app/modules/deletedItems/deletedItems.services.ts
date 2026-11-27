import status from 'http-status';
import { Model, Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { ProductModel } from '../products/product.model';
import { CategoryModel } from '../categories/category.model';
import { UserModel } from '../users/user.model';
import { NewsModel } from '../news/news.model';
import { PopupModel } from '../popups/popup.model';
import { PopupViewModel } from '../popups/popupView.model';
import { PageVisitModel } from '../popups/pageVisit.model';
import { CommunityPostModel } from '../communityPosts/communityPosts.model';
import { TaskModel } from '../tasks/tasks.model';
import { ProductPurchaseModel } from '../productPurchages/productPurchases.model';
import { TransactionModel } from '../transactions/transaction.model';
import { DepositRequestModel } from '../depositRequests/depositRequests.model';
import { WithdrawalModel } from '../withdrawals/withdrawal.model';
import { DailyCheckinModel } from '../dailyCheckins/dailyCheckin.model';
import { RedeemClaimModel } from '../redeemCodes/redeemCode.model';
import { ReferralModel } from '../referrals/referral.model';
import { WalletModel } from '../wallets/wallet.model';
import { PaymentAccountsModel } from '../paymentAccounts/paymentAccounts.model';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';

type TActor = { userId: string; fullName?: string; role: string };

// Every kind of soft-deleted record this page manages.
// `title` picks the name shown in the list; `select` keeps the list light (no big HTML bodies).
type TDoc = { _id: Types.ObjectId; updatedAt?: Date; phone?: string; [field: string]: unknown };
type TKindConfig = { label: string; model: Model<unknown>; select: string; titleField: string };

const KINDS: Record<string, TKindConfig> = {
    products: { label: 'Product', model: ProductModel as unknown as Model<unknown>, select: 'name updatedAt', titleField: 'name' },
    categories: { label: 'Category', model: CategoryModel as unknown as Model<unknown>, select: 'name updatedAt', titleField: 'name' },
    users: { label: 'Member', model: UserModel as unknown as Model<unknown>, select: 'fullName phone updatedAt', titleField: 'fullName' },
    news: { label: 'News post', model: NewsModel as unknown as Model<unknown>, select: 'title updatedAt', titleField: 'title' },
    popups: { label: 'Popup', model: PopupModel as unknown as Model<unknown>, select: 'title updatedAt', titleField: 'title' },
    community: { label: 'Community post', model: CommunityPostModel as unknown as Model<unknown>, select: 'title updatedAt', titleField: 'title' },
    tasks: { label: 'Task', model: TaskModel as unknown as Model<unknown>, select: 'title updatedAt', titleField: 'title' },
};

const titleOf = (cfg: TKindConfig, d: TDoc): string => String(d[cfg.titleField] ?? '') || '—';

export type TDeletedKind = 'products' | 'categories' | 'users' | 'news' | 'popups' | 'community' | 'tasks';

const assertKind = (kind: string): TDeletedKind => {
    if (!(kind in KINDS)) throw new AppError(status.BAD_REQUEST, 'Unknown item type');
    return kind as TDeletedKind;
};

// Why a record cannot be permanently deleted yet (null = it can)
const blockedReason = async (kind: TDeletedKind, id: Types.ObjectId): Promise<string | null> => {
    if (kind === 'products') {
        if (await ProductPurchaseModel.exists({ productId: id })) return 'Members have purchased this product';
    }
    if (kind === 'categories') {
        if (await ProductModel.exists({ category: id })) return 'Products still use this category';
    }
    if (kind === 'users') {
        const [wallet, hasHistory] = await Promise.all([
            WalletModel.find({ userId: id }).select('balance').lean(),
            Promise.all([
                ProductPurchaseModel.exists({ userId: id }),
                TransactionModel.exists({ userId: id }),
                DepositRequestModel.exists({ userId: id }),
                WithdrawalModel.exists({ userId: id }),
                DailyCheckinModel.exists({ userId: id }),
                RedeemClaimModel.exists({ userId: id }),
                ReferralModel.exists({ $or: [{ referrerId: id }, { referredId: id }] }),
            ]),
        ]);
        if (wallet.some((w) => w.balance > 0)) return 'The wallet still has money';
        if (hasHistory.some(Boolean)) return 'Has purchases, transactions or referrals';
    }
    return null;
};

// Everything soft-deleted, newest first, with whether it can be removed for good
const listDeleted = async (kind?: string) => {
    const kinds: TDeletedKind[] = kind && kind !== 'all' ? [assertKind(kind)] : (Object.keys(KINDS) as TDeletedKind[]);

    const groups = await Promise.all(
        kinds.map(async (k) => {
            const cfg = KINDS[k];
            const docs = (await cfg.model.find({ isDeleted: true }).select(cfg.select).sort({ updatedAt: -1 }).limit(300).lean()) as unknown as TDoc[];
            return Promise.all(
                docs.map(async (d) => ({
                    kind: k,
                    typeLabel: cfg.label,
                    id: String(d._id),
                    title: titleOf(cfg, d),
                    subtitle: k === 'users' ? String(d.phone ?? '') : '',
                    deletedAt: d.updatedAt ?? new Date(0),
                    blockedReason: await blockedReason(k, d._id),
                }))
            );
        })
    );

    const items = groups.flat().sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    const counts = Object.fromEntries(
        await Promise.all(
            (Object.keys(KINDS) as TDeletedKind[]).map(async (k) => [k, await KINDS[k].model.countDocuments({ isDeleted: true })])
        )
    );
    return { items, counts };
};

// Remove one soft-deleted record from the database for good (super admin only)
const permanentlyDelete = async (rawKind: string, id: string, actor: TActor) => {
    const kind = assertKind(rawKind);
    if (!Types.ObjectId.isValid(id)) throw new AppError(status.BAD_REQUEST, 'Invalid id');
    const _id = new Types.ObjectId(id);

    const cfg = KINDS[kind];
    const doc = (await cfg.model.findOne({ _id, isDeleted: true }).select(cfg.select).lean()) as unknown as TDoc | null;
    if (!doc) throw new AppError(status.NOT_FOUND, 'Deleted item not found');

    const reason = await blockedReason(kind, _id);
    if (reason) throw new AppError(status.BAD_REQUEST, `Cannot delete permanently: ${reason}`);

    const title = titleOf(cfg, doc);
    switch (kind) {
        case 'users':
            await Promise.all([
                WalletModel.deleteMany({ userId: _id }),
                PaymentAccountsModel.deleteMany({ userId: _id }),
                PageVisitModel.deleteMany({ user: _id }),
                PopupViewModel.deleteMany({ user: _id }),
            ]);
            break;
        case 'popups':
            await PopupViewModel.deleteMany({ popup: _id });
            break;
    }
    await cfg.model.deleteOne({ _id });

    await AdminActivityServices.record(actor, 'permanent_delete', `Deleted permanently: ${cfg.label} "${title}"`, {
        type: `deleted_${kind}`,
        id: _id,
    });
    return { kind, id, title };
};

export const DeletedItemsServices = { listDeleted, permanentlyDelete };
