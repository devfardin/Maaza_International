import express from 'express';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../users/user.constant';
import { LocationControllers } from './location.controller';
import { LocationValidations } from './location.validations';

const router = express.Router();

// District list (any logged-in user)
router.get('/districts', auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user), LocationControllers.getDistricts);

// Member: automatic location at login (browser position → nearest district)
router.post(
  '/me',
  auth(USER_ROLE.user),
  validationRequest(LocationValidations.saveMyLocationValidation),
  LocationControllers.saveMyLocation,
);

// Members per district / division for the map (admins and super admins)
router.get('/summary', auth(USER_ROLE.super_admin, USER_ROLE.admin), LocationControllers.getSummary);

export const LocationRoutes = router;
