import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TCommunityPost } from "./communityPosts.interface";
import { CommunityPostServices } from "./communityPosts.services";
import AppError from "../../errors/AppError";

const createCommunityPost = catchAsync(async (req, res) => {
    const payload: Partial<TCommunityPost> = req.body;
    const result = await CommunityPostServices.createCommunityPost(req.user!.userId, req.user!.role, payload);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post created successfully",
        data: result,
    });
});

// POST /community-posts/upload-image — image for a post (same VIP rule as creating a post)
const uploadPostImage = catchAsync(async (req, res) => {
    await CommunityPostServices.assertCanPost(req.user!.userId, req.user!.role);
    if (!req.file) throw new AppError(status.BAD_REQUEST, "Please choose an image to upload");
    const url = await CommunityPostServices.uploadPostImage(req.file.path);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Image uploaded",
        data: { url },
    });
});

const getAllCommunityPosts = catchAsync(async (req, res) => {
    const result = await CommunityPostServices.getAllCommunityPosts();
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community posts retrieved successfully",
        data: result,
    });
});

const getSingleCommunityPost = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await CommunityPostServices.getSingleCommunityPost(id);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post retrieved successfully",
        data: result,
    });
});

const updateCommunityPost = catchAsync(async (req, res) => {
    const { id } = req.params;
    const payload: Partial<TCommunityPost> = req.body;
    const result = await CommunityPostServices.updateCommunityPost(id, payload, req.user!);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post updated successfully",
        data: result,
    });
});

// GET /community-posts/mine — my posts in any state
const getMyCommunityPosts = catchAsync(async (req, res) => {
    const result = await CommunityPostServices.getMyCommunityPosts(req.user!.userId);
    sendResponse(res, { statusCode: status.OK, success: true, message: "Your posts retrieved", data: result });
});

// GET /community-posts/pending — super admin approval queue
const getPendingCommunityPosts = catchAsync(async (_req, res) => {
    const result = await CommunityPostServices.getPendingCommunityPosts();
    sendResponse(res, { statusCode: status.OK, success: true, message: "Pending posts retrieved", data: result });
});

// PATCH /community-posts/:id/status — super admin approves or rejects
const decideCommunityPost = catchAsync(async (req, res) => {
    const decision = req.body.status === "rejected" ? "rejected" : "approved";
    const result = await CommunityPostServices.decideCommunityPost(req.params.id, decision, req.user!);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: decision === "approved" ? "Post approved and published" : "Post rejected",
        data: result,
    });
});

const deleteCommunityPost = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await CommunityPostServices.deleteCommunityPost(id);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post deleted successfully",
        data: result,
    });
});
// add community post like feature
const addLikeToPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const result = await CommunityPostServices.addLikeToPost(postId, req.user!.userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: result.liked ? "Post liked" : "Like removed",
        data: result,
    });
});

export const CommunityPostController = {
    getMyCommunityPosts,
    getPendingCommunityPosts,
    decideCommunityPost,
    createCommunityPost,
    uploadPostImage,
    getAllCommunityPosts,
    getSingleCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    addLikeToPost,
};
