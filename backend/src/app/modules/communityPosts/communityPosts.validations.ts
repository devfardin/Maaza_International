import z from "zod";

const mediaSchema = z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url("Media URL must be a valid URL"),
});

const createCommunityPostValidation = z.object({
    body: z.object({
        userId: z.string(),
        title: z.string().min(2, "Title must be at least 2 characters"),
        description: z.string().min(5, "Description must be at least 5 characters"),
        media: z.array(mediaSchema).min(1, "At least one media item is required"),
        status: z.enum(["pending", "approved", "rejected"]).default("pending"),
        likes: z.array(z.string()).default([]),
        approvedBy: z.string().optional(),
        isDeleted: z.boolean().default(false),
    }),
});

const updateCommunityPostValidation = z.object({
    body: z.object({
        title: z.string().min(2).optional(),
        description: z.string().min(5).optional(),
        media: z.array(mediaSchema).optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        likes: z.array(z.string()).optional(),
        approvedBy: z.string().optional(),
    }),
});

export const communityPostValidation = {
    createCommunityPostValidation,
    updateCommunityPostValidation,
};
