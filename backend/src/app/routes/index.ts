import { Router } from 'express'
import { UserRoutes } from '../modules/users/user.route';
import { CategoryRoutes } from '../modules/categories/category.route';
import { ProductRoutes } from '../modules/products/product.route';


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

]
moduelRoutes.forEach(route => router.use(route.path, route.route))

export default router;