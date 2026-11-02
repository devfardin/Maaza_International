import express from "express";
import { CommunityPostController } from "./communityPosts.controller";
import validationRequest from "../../middlewares/validateRequest";
import { communityPostValidation } from "./communityPosts.validations";

const router = express.Router();

// create a community post
router.post(
    "/create-post",
    validationRequest(communityPostValidation.createCommunityPostValidation),
    CommunityPostController.createCommunityPost
);

// get all community posts
router.get("/", CommunityPostController.getAllCommunityPosts);

// get single community post
router.get("/:id", CommunityPostController.getSingleCommunityPost);

// update community post
router.patch(
    "/:id",
    validationRequest(communityPostValidation.updateCommunityPostValidation),
    CommunityPostController.updateCommunityPost
);

// delete community post
router.delete("/:id", CommunityPostController.deleteCommunityPost);

// add like to community post
router.patch(
    "/:postId/like",
    CommunityPostController.addLikeToPost
);

export const CommunityPostRoutes = router;
