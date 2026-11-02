import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TCommunityPost } from "./communityPosts.interface";
import { CommunityPostServices } from "./communityPosts.services";

const createCommunityPost = catchAsync(async (req, res) => {
    const payload: TCommunityPost = req.body;
    const result = await CommunityPostServices.createCommunityPost(payload);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post created successfully",
        data: result,
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
    const result = await CommunityPostServices.updateCommunityPost(id, payload);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Community post updated successfully",
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

    // Get logged-in user ID
    const userId = '6ae6dde31a73db092fe2e50f'; //need to chagne it and make it dynamic userid

    const result = await CommunityPostServices.addLikeToPost(postId, userId);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Post liked successfully",
        data: result,
    });
})

export const CommunityPostController = {
    createCommunityPost,
    getAllCommunityPosts,
    getSingleCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    addLikeToPost,
};
