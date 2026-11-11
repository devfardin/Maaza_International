import express from 'express';
import { CategoryController } from './category.controller';
import validationRequest from '../../middlewares/validateRequest';
import { categoryValidation } from './category.validations';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a new category (admin only)
router.post(
  '/create-category',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.createCategory,
);

// Get all categories (public)
router.get('/', CategoryController.getAllCategories);

// Get a single category by ID (public)
router.get('/:id', CategoryController.getSingleCategory);

// Update a category (admin only)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.updateCategory,
);

// Delete a category (admin only)
router.delete(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  CategoryController.deleteCategory,
);

export const CategoryRoutes = router;
