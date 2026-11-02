import status from "http-status";
import AppError from "../../errors/AppError";
import { TCommunityPost } from "./communityPosts.interface";
import { CommunityPostModel } from "./communityPosts.model";

const createCommunityPost = async (payload: TCommunityPost) => {
    const result = await CommunityPostModel.create(payload);
    return result;
};

const getAllCommunityPosts = async () => {
    const result = await CommunityPostModel.find({ isDeleted: false })
        .populate("userId", "name phone")
        .populate("approvedBy", "name");
    return result;
};

const getSingleCommunityPost = async (id: string) => {
    const result = await CommunityPostModel.findById(id)
        .populate("userId", "name phone")
        .populate("approvedBy", "name");
    return result;
};

const updateCommunityPost = async (id: string, payload: Partial<TCommunityPost>) => {
    const result = await CommunityPostModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    return result;
};

const deleteCommunityPost = async (id: string) => {
    const result = await CommunityPostModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
    );
    return result;
};

// add community post like feature
const addLikeToPost = async (postId: string, userId: string) => {
    // check user id exists
    if (!userId) throw new AppError(status.BAD_REQUEST, "Please login to like this post");

    // check post id exist
    if (!postId) throw new AppError(status.BAD_REQUEST, "Invalid post ID");

    const result = await CommunityPostModel.findOneAndUpdate(
        {
            _id: postId,
            status: "approved",
            isDeleted: false,
        },
        {
            $addToSet: {
                likes: userId,
            },
        },
        {
            new: true,
        }
    );
    return result;
};

export const CommunityPostServices = {
    createCommunityPost,
    getAllCommunityPosts,
    getSingleCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    addLikeToPost,
};
