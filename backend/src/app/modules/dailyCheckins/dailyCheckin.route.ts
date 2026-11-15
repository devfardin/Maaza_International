import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { DailyCheckinControllers } from './dailyCheckin.controller';

const router = express.Router();

router.get('/status', auth(USER_ROLE.user), DailyCheckinControllers.getStatus);
router.post('/', auth(USER_ROLE.user), DailyCheckinControllers.checkIn);

export const DailyCheckinRoutes = router;
