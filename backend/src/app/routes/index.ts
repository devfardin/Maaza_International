import { Router } from 'express'
import { UserRoutes } from '../modules/users/user.route';


const router = Router()

const moduelRoutes = [
    {
        path: '/users',
        route: UserRoutes,
    },

]
moduelRoutes.forEach(route => router.use(route.path, route.route))

export default router;