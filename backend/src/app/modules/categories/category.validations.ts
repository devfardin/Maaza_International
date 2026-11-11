import z from "zod";

const createCategoryValidation = z.object({
    body: z.object({
        name: z.string().min(2, "Category name must be at least 2 characters"),
        description: z.string().optional(),
        image: z.string().url("Image must be a valid URL").optional(),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int("Sort order must be a whole number").default(0),
        status: z.enum(["active", "inactive"]).default("active"),
    }),
});
export const categoryValidation = {
    createCategoryValidation,
}