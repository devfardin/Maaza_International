import express, { NextFunction, Request, Response } from 'express';
import validationRequest from '../../middlewares/validateRequest';
import { ProductValidations } from './product.validations';
import { ProductController } from './product.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { upload } from '../../utils/sendImageToCloudinary';

const router = express.Router()

// create router
router.post(
    '/create-product',
    auth(USER_ROLE.super_admin, USER_ROLE.admin),
    upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data);
        next();
    },
    validationRequest(ProductValidations.createProductValidation),
    ProductController.createProduct
);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getSingleProduct);
router.put('/:id', ProductController.updateProduct);
router.patch('/:id', ProductController.deleteProduct);


export const ProductRoutes = router;