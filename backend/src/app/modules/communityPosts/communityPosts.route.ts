import express from 'express';
import { CommunityPostController } from './communityPosts.controller';
import validationRequest from '../../middlewares/validateRequest';
import { communityPostValidation } from './communityPosts.validations';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';

const router = express.Router();

// Create a new community post (authenticated users)
router.post(
  '/create-post',
  auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
  validationRequest(communityPostValidation.createCommunityPostValidation),
  CommunityPostController.createCommunityPost,
);

// Get all community posts (public)
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
