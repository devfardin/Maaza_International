import express from 'express';
import auth from '../../middlewares/auth';
import { upload } from '../../utils/sendImageToCloudinary';
import { USER_ROLE } from '../users/user.constant';
import { MediaController } from './media.controller';

const router = express.Router();

const ADMIN_ROLES = [USER_ROLE.super_admin, USER_ROLE.admin] as const;

// Browse the Media Library (admin + super admin)
router.get('/', auth(...ADMIN_ROLES), MediaController.getMedia);

// Upload a new image; form field name is "file" (admin + super admin)
router.post('/upload', auth(...ADMIN_ROLES), upload.single('file'), MediaController.uploadMedia);

// Add images already used in products, news, payment methods, etc. to the library (admin + super admin)
router.post('/import-existing', auth(...ADMIN_ROLES), MediaController.importExisting);

// Permanently delete an image from Cloudinary and the library (super admin only, no soft delete)
router.delete('/:id', auth(USER_ROLE.super_admin), MediaController.deleteMedia);

export const MediaRoutes = router;
