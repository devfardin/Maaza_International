import { z } from 'zod';
import { POPUP_PAGES } from './popup.constant';

// Images are URLs picked from the Media Library ('' = none)
const imageUrl = z.string().trim().max(2000).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Image must be a valid URL');

// External https link or an internal path (no javascript: or protocol-relative links)
const buttonLink = z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v), 'Button link must start with https:// or /');

// No .default() here: this schema is also used for partial updates (e.g. the on/off toggle),
// and defaults would overwrite every field that was not sent. Model defaults apply on create.
const popupBody = z.object({
    title: z.string({ message: 'Title is required' }).trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
    headerImage: imageUrl,
    description: z.string().max(200_000, 'Description is too large'),
    bodyImage: imageUrl,
    buttonText: z.string().trim().max(40, 'Button text is too long'),
    buttonLink,
    targetPages: z.array(z.enum(POPUP_PAGES, { message: 'Choose a valid page' })),
    isActive: z.boolean(),
});

const createPopupValidation = z.object({
    body: popupBody.partial({ headerImage: true, description: true, bodyImage: true, buttonText: true, buttonLink: true, isActive: true }).extend({
        targetPages: z.array(z.enum(POPUP_PAGES, { message: 'Choose a valid page' })).min(1, 'Choose at least one page to show this popup on'),
    }),
});
const updatePopupValidation = z.object({ body: popupBody.partial() });

export const PopupValidations = { createPopupValidation, updatePopupValidation };
