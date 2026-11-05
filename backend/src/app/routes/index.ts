import { Router } from 'express'
import { UserRoutes } from '../modules/users/user.route';
import { CategoryRoutes } from '../modules/categories/category.route';
import { ProductRoutes } from '../modules/products/product.route';
import { PaymentAccountRoutes } from '../modules/paymentAccounts/paymentAccounts.route';
import { TaskRoutes } from '../modules/tasks/tasks.route';
import { CommunityPostRoutes } from '../modules/communityPosts/communityPosts.route';
import { PaymentMethodRoutes } from '../modules/paymentMethods/paymentMethods.route';
import { DepositRequestRoutes } from '../modules/depositRequests/depositRequests.route';
import { WalletRoutes } from '../modules/wallets/wallet.route';
import { TransactionRoutes } from '../modules/transactions/transaction.route';
import { ProductPurchaseRoutes } from '../modules/productPurchages/productPurchases.route';
import { AuthRoutes } from '../modules/Auth/auth.route';


const router = Router()

const moduelRoutes = [
    {   
        path: '/users',
        route: UserRoutes,
    },
    {
        path: '/categories',
        route: CategoryRoutes,
    },
    {
        path: '/products',
        route: ProductRoutes,
    },
    {
        path: '/paymentaccounts',
        route: PaymentAccountRoutes,
    },
    {
        path: '/tasks',
        route: TaskRoutes,
    },
    {
        path: '/community-posts',
        route: CommunityPostRoutes,
    },
    {
        path: '/payment-methods',
        route: PaymentMethodRoutes,
    },
    {
        path: '/deposit-requests',
        route: DepositRequestRoutes,
    },
    {
        path: '/wallets',
        route: WalletRoutes,
    },
    {
        path: '/transactions',
        route: TransactionRoutes,
    },
    {
        path: '/product-purchases',
        route: ProductPurchaseRoutes,
    },
    {
        path: '/auth',
        route: AuthRoutes,
    },

]
moduelRoutes.forEach(route => router.use(route.path, route.route))

export default router;