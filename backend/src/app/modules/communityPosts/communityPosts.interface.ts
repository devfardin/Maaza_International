import { Types } from "mongoose";

export type TMediaType = "image" | "video";

export type TPostStatus = "pending" | "approved" | "rejected";

export type TMedia = {
    type: TMediaType;
    url: string;
};

export type TCommunityPost = {
    userId: Types.ObjectId;
    title: string;
    description: string;
    media: TMedia[];
    status: TPostStatus;
    likes?: Types.ObjectId[];
    approvedBy?: Types.ObjectId;
    isDeleted: boolean;
};
