import express from 'express';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import { rateLimit } from '../../middlewares/rateLimit';
import { USER_ROLE } from '../users/user.constant';
import { RedeemCodeControllers } from './redeemCode.controller';
import { RedeemCodeValidations } from './redeemCode.validations';

const router = express.Router();

// Brute-force guard: a member can try 30 codes every 15 minutes
const claimLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many attempts. Try again in 15 minutes.' });

// Member: claim a code (adds the prize to the balance wallet)
router.post(
    '/claim',
    auth(USER_ROLE.user),
    claimLimiter,
    validationRequest(RedeemCodeValidations.claimRedeemCodeValidation),
    RedeemCodeControllers.claimRedeemCode,
);

// Member: codes this member has claimed
router.get('/my-claims', auth(USER_ROLE.user), RedeemCodeControllers.getMyClaims);

// Super admin: total budget, claimed and left
router.get('/summary', auth(USER_ROLE.super_admin), RedeemCodeControllers.getRedeemSummary);

// Admin and super admin: codes (an admin sees only their own)
router.get('/', auth(USER_ROLE.super_admin, USER_ROLE.admin), RedeemCodeControllers.listRedeemCodes);
router.post(
    '/',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    validationRequest(RedeemCodeValidations.createRedeemCodeValidation),
    RedeemCodeControllers.createRedeemCode,
);
router.patch(
    '/:id/status',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    validationRequest(RedeemCodeValidations.setRedeemCodeStatusValidation),
    RedeemCodeControllers.setRedeemCodeStatus,
);

// Admin and super admin: who claimed a code (the super admin also gets full member details)
router.get('/:id/claims', auth(USER_ROLE.super_admin, USER_ROLE.admin), RedeemCodeControllers.getRedeemCodeClaims);

export const RedeemCodeRoutes = router;
