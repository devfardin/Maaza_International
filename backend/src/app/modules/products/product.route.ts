import express from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { ProductValidations } from './product.validations';
import { ProductController } from './product.controller';

const router = express.Router()

// create router
router.post(
    '/create-product',
    validationRequest(ProductValidations.createProductValidation),
    ProductController.createProduct
);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getSingleProduct);
router.put('/:id', ProductController.updateProduct);
router.patch('/:id', ProductController.deleteProduct);


export const ProductRoutes = router;