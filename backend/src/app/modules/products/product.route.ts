import express, { NextFunction, Request, Response } from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { ProductValidations } from './product.validations';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { upload } from '../../utils/sendImageToCloudinary';
import status from 'http-status';
import AppError from '../../errors/AppError';

const router = express.Router();

// Create a new product with image upload (admin only)
router.post(
  '/create-product',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = JSON.parse(req.body.data);
      next();
    } catch {
      next(new AppError(status.BAD_REQUEST, 'Product data must be valid JSON in the "data" field'));
    }
  },
  validationRequest(ProductValidations.createProductValidation),
  ProductController.createProduct,
);

// Get all products (public)
router.get('/', ProductController.getAllProducts);

// Get every product incl. inactive / out of stock (admin only) — must be before '/:id'
router.get(
  '/admin/all',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  ProductController.getAllProductsForAdmin,
);

// Get a single product by ID (public)
router.get('/:id', ProductController.getSingleProduct);

// Update a product (admin only)
router.put(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  validationRequest(ProductValidations.updateProductValidation),
  ProductController.updateProduct,
);

// Soft-delete a product (admin only)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  ProductController.deleteProduct,
);

export const ProductRoutes = router;
