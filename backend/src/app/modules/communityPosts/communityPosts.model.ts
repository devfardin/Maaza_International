import { model, Schema } from "mongoose";
import { TCommunityPost, TMedia } from "./communityPosts.interface";

const mediaSchema = new Schema<TMedia>({
    type: {
        type: String,
        enum: ["image", "video"],
        required: [true, "Media type is required"],
    },
    url: {
        type: String,
        required: [true, "Media URL is required"],
        trim: true,
    },
}, { _id: false });

const communityPostSchema = new Schema<TCommunityPost>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
    },
    media: {
        type: [mediaSchema],
        required: [true, "At least one media item is required"],
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    likes: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const CommunityPostModel = model<TCommunityPost>("CommunityPost", communityPostSchema);
