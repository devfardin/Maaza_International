import status from "http-status";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { TCommunityPost } from "./communityPosts.interface";
import { CommunityPostModel } from "./communityPosts.model";
import { UserModel } from "../users/user.model";
import { COMMUNITY_POST_MIN_VIP } from "../../config/constants";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

// Members can post once they reach VIP 3 (membershipLevel is the VIP level). Admins can always post.
// The author always comes from the logged-in user, and new posts wait for approval.
// Uploads a post image to Cloudinary and returns its public URL
const uploadPostImage = async (filePath: string) => {
    const { secure_url } = await sendImageToCloudinary(`post_${Date.now()}`, filePath);
    return secure_url as string;
};

// Throws unless this account may create posts (admins always can)
const assertCanPost = async (userId: string, role: string) => {
    if (role !== "user") return;
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");
    const vipLevel = user.membershipLevel;
    if (vipLevel < COMMUNITY_POST_MIN_VIP) {
        throw new AppError(status.FORBIDDEN, `Reach VIP ${COMMUNITY_POST_MIN_VIP} to create community posts.`);
    }
};

// Admins and super admins publish straight away. A member's post waits for a super admin.
const createCommunityPost = async (userId: string, role: string, payload: Partial<TCommunityPost>) => {
    await assertCanPost(userId, role);
    const isStaff = role !== "user";

    const result = await CommunityPostModel.create({
        ...payload,
        userId,
        status: isStaff ? "approved" : "pending",
        approvedBy: isStaff ? userId : null,
        likes: [],
        isDeleted: false,
    });
    return result;
};

// Members see approved posts in the feed; their own posts in any state are on /mine
const populateAuthor = (q: any) => q.populate("userId", "fullName avatar membershipLevel role").populate("approvedBy", "fullName");

const getAllCommunityPosts = async () => {
    return populateAuthor(CommunityPostModel.find({ isDeleted: false, status: "approved" })).sort({ createdAt: -1 });
};

// a member's own posts, including pending ones
const getMyCommunityPosts = async (userId: string) => {
    return populateAuthor(CommunityPostModel.find({ isDeleted: false, userId })).sort({ createdAt: -1 });
};

// super admin queue
const getPendingCommunityPosts = async () => {
    return populateAuthor(CommunityPostModel.find({ isDeleted: false, status: "pending" })).sort({ createdAt: 1 });
};

// super admin: approve or reject a post
const decideCommunityPost = async (id: string, decision: "approved" | "rejected", actor: { userId: string; role: string }) => {
    if (actor.role !== "super_admin") throw new AppError(status.FORBIDDEN, "Only a super admin can approve posts");
    const result = await CommunityPostModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { status: decision, approvedBy: decision === "approved" ? actor.userId : null },
        { new: true }
    );
    if (!result) throw new AppError(status.NOT_FOUND, "Post not found");
    return result;
};


const getSingleCommunityPost = async (id: string) => {
    const result = await CommunityPostModel.findById(id)
        .populate("userId", "fullName avatar membershipLevel")
        .populate("approvedBy", "fullName");
    return result;
};

// Only the author (or a super admin) can edit. Members cannot change status, approver or likes,
// and an edited member post goes back to pending.
const updateCommunityPost = async (id: string, payload: Partial<TCommunityPost>, actor: { userId: string; role: string }) => {
    const post = await CommunityPostModel.findOne({ _id: id, isDeleted: false });
    if (!post) throw new AppError(status.NOT_FOUND, "Post not found");
    const isSuper = actor.role === "super_admin";
    if (!isSuper && String(post.userId) !== actor.userId) {
        throw new AppError(status.FORBIDDEN, "You can only edit your own posts");
    }

    const update: Partial<TCommunityPost> = { ...payload };
    delete update.likes;
    delete update.approvedBy;
    if (!isSuper) {
        delete update.status;
        update.status = "pending"; // an edited member post is reviewed again
    }

    return CommunityPostModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

const deleteCommunityPost = async (id: string) => {
    const result = await CommunityPostModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
    );
    return result;
};

// Like / unlike toggle: liking a post you already liked removes the like.
// Works on any post that is not deleted (pending posts too, since members see them in the feed).
const addLikeToPost = async (postId: string, userId: string) => {
    if (!userId) throw new AppError(status.UNAUTHORIZED, "Please login to like this post");
    if (!Types.ObjectId.isValid(postId)) throw new AppError(status.BAD_REQUEST, "Invalid post ID");

    const post = await CommunityPostModel.findOne({ _id: postId, isDeleted: false }).select("likes");
    if (!post) throw new AppError(status.NOT_FOUND, "Post not found");

    const alreadyLiked = (post.likes ?? []).some((id) => String(id) === userId);
    const result = await CommunityPostModel.findByIdAndUpdate(
        postId,
        alreadyLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
        { new: true }
    );
    return { ...result?.toObject(), liked: !alreadyLiked };
};

export const CommunityPostServices = {
    getMyCommunityPosts,
    getPendingCommunityPosts,
    decideCommunityPost,
    assertCanPost,
    uploadPostImage,
    createCommunityPost,
    getAllCommunityPosts,
    getSingleCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    addLikeToPost,
};
