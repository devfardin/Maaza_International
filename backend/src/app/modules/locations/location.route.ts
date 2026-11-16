import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { LocationControllers } from './location.controller';

const router = express.Router();

// District list for the profile picker (any logged-in user)
router.get('/districts', auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user), LocationControllers.getDistricts);

// Members per district / division for the map (admins and super admins)
router.get('/summary', auth(USER_ROLE.super_admin, USER_ROLE.admin), LocationControllers.getSummary);

export const LocationRoutes = router;
