import express from 'express';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { PopupControllers } from './popup.controller';
import { PopupValidations } from './popup.validations';

const router = express.Router();

const ALL_ROLES = [USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user] as const;

// Members: popups for one dashboard page (?page=home) — declared before '/:id'
router.get('/active', auth(...ALL_ROLES), PopupControllers.getActivePopups);

// Members: record that a popup was shown to them
router.post(
    '/:id/seen',
    auth(...ALL_ROLES),
    validationRequest(PopupValidations.markSeenValidation),
    PopupControllers.markPopupSeen,
);

// Super admin: every popup
router.get('/admin/all', auth(USER_ROLE.super_admin), PopupControllers.getAllPopups);

// Super admin: create / edit / delete
router.post(
    '/create-popup',
    auth(USER_ROLE.super_admin),
    validationRequest(PopupValidations.createPopupValidation),
    PopupControllers.createPopup,
);
router.put(
    '/:id',
    auth(USER_ROLE.super_admin),
    validationRequest(PopupValidations.updatePopupValidation),
    PopupControllers.updatePopup,
);
router.delete('/:id', auth(USER_ROLE.super_admin), PopupControllers.deletePopup);

export const PopupRoutes = router;
