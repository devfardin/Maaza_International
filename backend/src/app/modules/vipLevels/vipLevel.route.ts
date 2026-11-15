import express from 'express';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { VipLevelControllers } from './vipLevel.controller';
import { VipLevelValidations } from './vipLevel.validation';

const router = express.Router();

// Ladder (any logged-in user — shows the VIP requirements and daily bonuses)
router.get('/', auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user), VipLevelControllers.getVipLevels);

// Replace the ladder (super admin only — admins can view it, not change it)
router.put(
    '/',
    auth(USER_ROLE.super_admin),
    validationRequest(VipLevelValidations.updateVipLevelsValidation),
    VipLevelControllers.updateVipLevels,
);

export const VipLevelRoutes = router;
