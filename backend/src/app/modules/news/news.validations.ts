import { z } from 'zod';

const newsBody = z.object({
    title: z.string({ message: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters').max(160, 'Title is too long'),
    format: z.enum(['text', 'html'], { message: 'Format must be text or html' }).default('text'),
    summary: z.string().trim().max(400, 'Short description is too long').default(''),
    longDescription: z.string().max(200_000, 'Long description is too large').default(''),
    // published date chosen by the admin (ISO date); empty = today when published
    publishedAt: z.string().optional(),
    tag: z.string().trim().min(2, 'Tag is too short').max(30, 'Tag is too long').default('UPDATE'),
    htmlContent: z.string().max(200_000, 'HTML content is too large').default(''),
    cssContent: z.string().max(50_000, 'CSS content is too large').default(''),
    status: z.enum(['draft', 'published'], { message: 'Status must be draft or published' }).default('draft'),
});

const createNewsValidation = z.object({ body: newsBody });

// partial update: every field optional
const updateNewsValidation = z.object({ body: newsBody.partial() });

export const NewsValidations = { createNewsValidation, updateNewsValidation };
