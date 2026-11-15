import express from 'express';
import { CommunityPostController } from './communityPosts.controller';
import validationRequest from '../../middlewares/validateRequest';
import { communityPostValidation } from './communityPosts.validations';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { upload } from '../../utils/sendImageToCloudinary';

const router = express.Router();

// Create a new community post (authenticated users)
router.post(
  '/create-post',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  validationRequest(communityPostValidation.createCommunityPostValidation),
  CommunityPostController.createCommunityPost,
);

// Upload an image for a post (multipart field "file") — VIP 3+ only
router.post(
  '/upload-image',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  upload.single('file'),
  CommunityPostController.uploadPostImage,
);

// My posts, any state (members, admins)
router.get(
  '/mine',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  CommunityPostController.getMyCommunityPosts,
);

// Approval queue (super admin) — declared before '/:id'
router.get('/pending', auth(USER_ROLE.super_admin), CommunityPostController.getPendingCommunityPosts);

// Approve or reject a post (super admin)
router.patch('/:id/status', auth(USER_ROLE.super_admin), CommunityPostController.decideCommunityPost);

// Get all approved community posts (public)
router.get('/', CommunityPostController.getAllCommunityPosts);

// Get a single community post by ID (public)
router.get('/:id', CommunityPostController.getSingleCommunityPost);

// Update a community post (authenticated users)
router.patch(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  validationRequest(communityPostValidation.updateCommunityPostValidation),
  CommunityPostController.updateCommunityPost,
);

// Delete a community post (admin only)
router.delete(
  '/:id',
  auth(USER_ROLE.super_admin, USER_ROLE.admin),
  CommunityPostController.deleteCommunityPost,
);

// Like a community post (authenticated users)
router.patch(
  '/:postId/like',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  CommunityPostController.addLikeToPost,
);

export const CommunityPostRoutes = router;
