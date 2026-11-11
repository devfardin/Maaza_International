import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from './user.constant';
import validationRequest from '../../middlewares/validateRequest';
import { UserValidations } from './user.validations';

const router = express.Router();

// Register a new user (public) — role is always "user"
router.post(
  '/create-user',
  validationRequest(UserValidations.createUserValidation),
  UserController.createUser,
);

// Edit own profile (name, email, phone, avatar only). Declared before '/:id' routes.
router.patch(
  '/me',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  validationRequest(UserValidations.updateMyProfileValidation),
  UserController.updateMyProfile,
);

// Create an admin account (super_admin only)
router.post(
  '/create-admin',
  auth(USER_ROLE.super_admin),
  validationRequest(UserValidations.createAdminValidation),
  UserController.createAdmin,
);

// Current authenticated user's profile
router.get(
  '/me',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  UserController.getMe,
);

// All users (admin only)
router.get('/', auth(USER_ROLE.super_admin, USER_ROLE.admin), UserController.getAllUsers);

// Change user account status (admin only)
router.patch(
  '/change-status/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(UserValidations.changeUserStatusValidation),
  UserController.changeUserStatus,
);

// Single user (admin only)
router.get('/:id', auth(USER_ROLE.super_admin, USER_ROLE.admin), UserController.getSingleUser);

// Update a user (admin only; role changes are super_admin only)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(UserValidations.updateUserValidation),
  UserController.updateUser,
);

// Soft-delete a user (admin only)
router.delete('/:id', auth(USER_ROLE.super_admin, USER_ROLE.admin), UserController.deleteUser);

export const UserRoutes = router;
