import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { ReferralController } from './referral.controller';

const router = express.Router();

// GET /referrals/my-referrals — authenticated user sees their own referral stats
router.get(
    '/my-referrals',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.super_admin),
    ReferralController.getMyReferrals,
);

export const ReferralRoutes = router;
