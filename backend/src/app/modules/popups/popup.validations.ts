import { z } from 'zod';
import { DISTRICT_NAMES } from '../../config/districts';
import { POPUP_FREQUENCIES, POPUP_PAGES } from './popup.constant';

// Images are URLs picked from the Media Library ('' = none)
const imageUrl = z.string().trim().max(2000).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Image must be a valid URL');

// External https link or an internal path (no javascript: or protocol-relative links)
const buttonLink = z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v), 'Button link must start with https:// or /');

// Who sees the popup. Dates come as 'YYYY-MM-DD' ('' = no limit).
const audienceDate = z
    .string()
    .trim()
    .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Choose a valid date')
    .transform((v) => (v === '' ? null : new Date(v)));

const audience = z
    .object({
        minLevel: z.number().int().min(1, 'Level must be 1 to 9').max(9, 'Level must be 1 to 9'),
        maxLevel: z.number().int().min(1, 'Level must be 1 to 9').max(9, 'Level must be 1 to 9'),
        districts: z.array(z.enum(DISTRICT_NAMES, { message: 'Choose a valid district' })).max(64),
        joinedFrom: audienceDate,
        joinedTo: audienceDate,
    })
    .refine((a) => a.minLevel <= a.maxLevel, { message: 'The lowest level cannot be higher than the highest level', path: ['minLevel'] })
    .refine((a) => !a.joinedFrom || !a.joinedTo || a.joinedFrom <= a.joinedTo, {
        message: 'The "joined from" date must be before the "joined to" date',
        path: ['joinedFrom'],
    });

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
    audience,
    frequency: z.enum(POPUP_FREQUENCIES, { message: 'Choose how often to show this popup' }),
    intervalDays: z.number().int('Days must be a whole number').min(1, 'Every N days: N must be at least 1').max(365, 'Every N days: N cannot exceed 365'),
    maxViews: z.number().int('Max views must be a whole number').min(0, 'Max views cannot be negative').max(1000, 'Max views is too large'),
    maxViewsPerDay: z.number().int('Per-day limit must be a whole number').min(0, 'Per-day limit cannot be negative').max(100, 'Per-day limit is too large'),
    minPageVisits: z.number().int('Visit number must be a whole number').min(0, 'Visit number cannot be negative').max(1000, 'Visit number is too large'),
    visitsBetweenShows: z.number().int('Visits must be a whole number').min(0, 'Visits cannot be negative').max(1000, 'Visits is too large'),
    isActive: z.boolean(),
});

const createPopupValidation = z.object({
    body: popupBody.partial({ headerImage: true, description: true, bodyImage: true, buttonText: true, buttonLink: true, audience: true, frequency: true, intervalDays: true, maxViews: true, maxViewsPerDay: true, minPageVisits: true, visitsBetweenShows: true, isActive: true }).extend({
        targetPages: z.array(z.enum(POPUP_PAGES, { message: 'Choose a valid page' })).min(1, 'Choose at least one page to show this popup on'),
    }),
});
const updatePopupValidation = z.object({ body: popupBody.partial() });

// Member: the page the popup was displayed on (counts toward "after N visits" and the daily limit)
const markSeenValidation = z.object({ body: z.object({ page: z.enum(POPUP_PAGES, { message: 'Choose a valid page' }) }) });

export const PopupValidations = { createPopupValidation, updatePopupValidation, markSeenValidation };
