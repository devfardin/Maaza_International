import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { SalaryControllers } from './salary.controller';

const router = express.Router();

// Every member can open the salary page; only eligible members get a claim
router.get('/status', auth(USER_ROLE.user), SalaryControllers.getStatus);
router.post('/claim', auth(USER_ROLE.user), SalaryControllers.claimSalary);

export const SalaryRoutes = router;
