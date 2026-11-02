import { Router } from 'express'
import { UserRoutes } from '../modules/users/user.route';
import { CategoryRoutes } from '../modules/categories/category.route';
import { ProductRoutes } from '../modules/products/product.route';
import { PaymentAccountRoutes } from '../modules/paymentAccounts/paymentAccounts.route';
import { TaskRoutes } from '../modules/tasks/tasks.route';
import { CommunityPostRoutes } from '../modules/communityPosts/communityPosts.route';


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
    },{
        path: '/tasks',
        route: TaskRoutes,
    },{
        path: '/community-posts',
        route: CommunityPostRoutes,
    },

]
moduelRoutes.forEach(route => router.use(route.path, route.route))

export default router;