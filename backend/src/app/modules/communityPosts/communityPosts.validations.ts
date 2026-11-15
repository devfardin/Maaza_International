import z from "zod";

const mediaSchema = z.object({
    type: z.enum(["image", "video"]),
    url: z.string().url("Media URL must be a valid URL"),
});

const createCommunityPostValidation = z.object({
    body: z.object({
        userId: z.string().optional(), // ignored: the author is always the logged-in user
        title: z.string().min(2, "Title must be at least 2 characters"),
        description: z.string().min(5, "Description must be at least 5 characters"),
        media: z.array(mediaSchema).max(1, "One image per post").default([]),
        status: z.enum(["pending", "approved", "rejected"]).optional(), // ignored on create: always pending
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
