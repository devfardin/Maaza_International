import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { UserRoutes } from '../modules/users/user.route';
import { CategoryRoutes } from '../modules/categories/category.route';
import { ProductRoutes } from '../modules/products/product.route';
import { TaskRoutes } from '../modules/tasks/tasks.route';
import { WalletRoutes } from '../modules/wallets/wallet.route';
import { TransactionRoutes } from '../modules/transactions/transaction.route';
import { CommunityPostRoutes } from '../modules/communityPosts/communityPosts.route';
import { DepositRequestRoutes } from '../modules/depositRequests/depositRequests.route';
import { PaymentAccountRoutes } from '../modules/paymentAccounts/paymentAccounts.route';
import { PaymentMethodRoutes } from '../modules/paymentMethods/paymentMethods.route';
import { ProductPurchaseRoutes } from '../modules/productPurchages/productPurchases.route';
import { ReferralRoutes } from '../modules/referrals/referral.route';
import { ActivityLogRoutes } from '../modules/activityLogs/activityLog.route';
import { WithdrawalRoutes } from '../modules/withdrawals/withdrawal.route';
import { NotificationRoutes } from '../modules/notifications/notification.route';
import { AdminActivityRoutes } from '../modules/adminActivity/adminActivity.route';
import { VipLevelRoutes } from '../modules/vipLevels/vipLevel.route';
import { DailyCheckinRoutes } from '../modules/dailyCheckins/dailyCheckin.route';
import { RealtimeRoutes } from '../modules/realtime/realtime.route';
import { AdminDashboardRoutes } from '../modules/adminDashboard/adminDashboard.route';
import { NewsRoutes } from '../modules/news/news.route';
import { SalaryRoutes } from '../modules/salary/salary.route';
import { LocationRoutes } from '../modules/locations/location.route';
import { MediaRoutes } from '../modules/media/media.route';
import { PopupRoutes } from '../modules/popups/popup.route';
import { RedeemCodeRoutes } from '../modules/redeemCodes/redeemCode.route';
import { DeletedItemsRoutes } from '../modules/deletedItems/deletedItems.route';

const router = Router();

/**
 * All application module routes.
 * Base path: /api/v1
 */
const moduleRoutes = [
  { path: '/auth', route: AuthRoutes },                         // Authentication (login, refresh, password)
  { path: '/users', route: UserRoutes },                        // User management
  { path: '/categories', route: CategoryRoutes },               // Product categories
  { path: '/products', route: ProductRoutes },                  // Products
  { path: '/product-purchases', route: ProductPurchaseRoutes }, // Product purchases & daily income claims
  { path: '/tasks', route: TaskRoutes },                        // Promotional tasks
  { path: '/wallets', route: WalletRoutes },                    // User wallets
  { path: '/transactions', route: TransactionRoutes },          // Transaction history
  { path: '/deposit-requests', route: DepositRequestRoutes },   // Deposit/recharge requests
  { path: '/payment-accounts', route: PaymentAccountRoutes },   // User payout accounts (bKash/Nagad)
  { path: '/payment-methods', route: PaymentMethodRoutes },     // Admin-managed payment methods
  { path: '/community-posts', route: CommunityPostRoutes },     // Community posts
  { path: '/referrals', route: ReferralRoutes },                // Referral relationships & stats
  { path: '/activity-logs', route: ActivityLogRoutes },         // Admin: login/register IP, device, browser, OS
  { path: '/withdrawals', route: WithdrawalRoutes },            // User withdrawal requests & admin payouts
  { path: '/notifications', route: NotificationRoutes },        // Admin bell notifications
  { path: '/admin-activity', route: AdminActivityRoutes },      // Super admin: what each admin did
  { path: '/vip-levels', route: VipLevelRoutes },               // VIP ladder: referrals, spend, daily bonus
  { path: '/daily-checkin', route: DailyCheckinRoutes },        // Daily check-in bonus
  { path: '/realtime', route: RealtimeRoutes },                 // Live refresh (Server-Sent Events)
  { path: '/admin-dashboard', route: AdminDashboardRoutes },    // Admin dashboard headline stats
  { path: '/news', route: NewsRoutes },                         // News & updates posts (HTML + CSS)
  { path: '/salary', route: SalaryRoutes },                     // Weekly VIP salary: Monday claim window
  { path: '/locations', route: LocationRoutes },                // Member districts (profile) and admin location map
  { path: '/media', route: MediaRoutes },                       // Media Library: upload, browse, permanent delete (super admin)
  { path: '/popups', route: PopupRoutes },                      // Super admin: popups shown on member dashboard pages
  { path: '/redeem-codes', route: RedeemCodeRoutes },           // Redeem bonus codes: admins create, members claim to balance wallet
  { path: '/deleted-items', route: DeletedItemsRoutes },         // Super admin: soft-deleted records, permanent delete
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
