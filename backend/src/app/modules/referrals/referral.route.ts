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

// GET /referrals/my-team — members with relation (A/B/C), products bought and earnings from them
router.get(
    '/my-team',
    auth(USER_ROLE.user, USER_ROLE.admin, USER_ROLE.super_admin),
    ReferralController.getMyTeam,
);

export const ReferralRoutes = router;
