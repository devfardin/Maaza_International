import express, { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import auth from '../../middlewares/auth';
import validationRequest from '../../middlewares/validateRequest';
import AppError from '../../errors/AppError';
import { upload } from '../../utils/sendImageToCloudinary';
import { USER_ROLE } from '../users/user.constant';
import { NewsController } from './news.controller';
import { NewsValidations } from './news.validations';

const router = express.Router();

const ALL_ROLES = [USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user] as const;
const ADMIN_ROLES = [USER_ROLE.super_admin, USER_ROLE.admin] as const;

// Admin write requests send an optional cover image ("file") plus the post as JSON in "data".
// Plain JSON bodies (no image) pass straight through.
const parseDataField = (req: Request, _res: Response, next: NextFunction) => {
    try {
        if (typeof req.body?.data === 'string') req.body = JSON.parse(req.body.data);
        next();
    } catch {
        next(new AppError(status.BAD_REQUEST, 'News data must be valid JSON in the "data" field'));
    }
};

// Members: published posts (list)
router.get('/', auth(...ALL_ROLES), NewsController.getPublishedNews);

// Admins: every post incl. drafts — declared before '/:id'
router.get('/admin/all', auth(...ADMIN_ROLES), NewsController.getAllNewsForAdmin);

// One post
router.get('/:id', auth(...ALL_ROLES), NewsController.getSingleNews);

// Create a post (admin + super admin)
router.post(
    '/create-news',
    auth(...ADMIN_ROLES),
    upload.single('file'),
    parseDataField,
    validationRequest(NewsValidations.createNewsValidation),
    NewsController.createNews,
);

// Update a post (admin + super admin)
router.put(
    '/:id',
    auth(...ADMIN_ROLES),
    upload.single('file'),
    parseDataField,
    validationRequest(NewsValidations.updateNewsValidation),
    NewsController.updateNews,
);

// Soft delete (admin + super admin)
router.delete('/:id', auth(...ADMIN_ROLES), NewsController.deleteNews);

export const NewsRoutes = router;
