import express from 'express';
import { CategoryController } from './category.controller';
import validationRequest from '../../middlewares/validateRequest';
import { categoryValidation } from './category.validations';

const router = express.Router()

// create a category
router.post(
  '/create-category',
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.createCategory
);

// get all categories
router.get( '/',CategoryController.getAllCategories
);

// get single category
router.get('/:id', CategoryController.getSingleCategory);

// update category
router.patch('/:id',
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.updateCategory
);

// delete category
router.delete('/:id', CategoryController.deleteCategory
);

export const CategoryRoutes = router;