import express from 'express';
import { CategoryController } from './category.controller';
import validationRequest from '../../middlewares/validateRequest';
import { categoryValidation } from './category.validations';

const router = express.Router()


router.post(
  '/create-category',
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.createCategory
);

router.get(
  '/',
  CategoryController.getAllCategories
);

router.get('/:id', CategoryController.getSingleCategory);

router.patch(
  '/:id',
  validationRequest(categoryValidation.createCategoryValidation),
  CategoryController.updateCategory
);
router.delete(
  '/:id',
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;