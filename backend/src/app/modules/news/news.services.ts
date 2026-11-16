import status from 'http-status';
import AppError from '../../errors/AppError';
import { resolveImage } from '../../utils/resolveImage';
import { NewsModel } from './news.model';
import { TNewsPost } from './news.interface';

type TActor = { userId: string; role: string };

// Admin HTML is rendered in a script-free frame, but we still strip the obvious
// dangerous elements on save so the stored content is clean.
const cleanHtml = (html: string): string =>
    html
        .replace(/<(script|iframe|object|embed|frame|frameset|base|meta|link)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, '')
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');

// CSS goes into a <style> tag inside the frame: never let it close the tag.
const cleanCss = (css: string): string => css.replace(/<\/?style[^>]*>/gi, '');

// list cards only need the summary fields, not the bodies
const publicFields = '-htmlContent -cssContent -longDescription -createdBy -updatedBy';

// The admin's chosen published date, or undefined when none was given
const parsePublishedAt = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new AppError(status.BAD_REQUEST, 'Published date is not valid');
    return date;
};

const createNews = async (file: Express.Multer.File | undefined, payload: Partial<TNewsPost> & { publishedAt?: string }, actor: TActor) => {
    const coverImage = (await resolveImage(file, `news_${Date.now()}`, payload.coverImage)) ?? '';
    const isPublished = payload.status === 'published';
    const chosenDate = parsePublishedAt(payload.publishedAt);

    const result = await NewsModel.create({
        ...payload,
        htmlContent: cleanHtml(payload.htmlContent ?? ''),
        cssContent: cleanCss(payload.cssContent ?? ''),
        longDescription: cleanHtml(payload.longDescription ?? ''),
        coverImage,
        createdBy: actor.userId,
        updatedBy: actor.userId,
        publishedAt: chosenDate ?? (isPublished ? new Date() : null),
    });
    return result;
};

// Members: published posts only (list without the heavy body)
const getPublishedNews = async () => {
    return NewsModel.find({ isDeleted: false, status: 'published' })
        .select(publicFields)
        .sort({ publishedAt: -1 });
};

// Admins: every post, drafts included
const getAllNewsForAdmin = async () => {
    return NewsModel.find({ isDeleted: false }).sort({ createdAt: -1 });
};

const getSingleNews = async (id: string, actor: TActor) => {
    const post = await NewsModel.findOne({ _id: id, isDeleted: false });
    if (!post) throw new AppError(status.NOT_FOUND, 'News post not found');

    const isAdmin = actor.role === 'admin' || actor.role === 'super_admin';
    if (post.status !== 'published' && !isAdmin) {
        throw new AppError(status.NOT_FOUND, 'News post not found');
    }
    return post;
};

const updateNews = async (id: string, file: Express.Multer.File | undefined, payload: Partial<TNewsPost> & { publishedAt?: string }, actor: TActor) => {
    const current = await NewsModel.findOne({ _id: id, isDeleted: false });
    if (!current) throw new AppError(status.NOT_FOUND, 'News post not found');

    // the cover image is resolved below, never taken straight from the body
    const { publishedAt, coverImage: _coverUrl, ...rest } = payload;
    const update: Record<string, unknown> = { ...rest, updatedBy: actor.userId };
    if (payload.htmlContent !== undefined) update.htmlContent = cleanHtml(payload.htmlContent);
    if (payload.cssContent !== undefined) update.cssContent = cleanCss(payload.cssContent);
    if (payload.longDescription !== undefined) update.longDescription = cleanHtml(payload.longDescription);
    const coverImage = await resolveImage(file, `news_${Date.now()}`, _coverUrl);
    if (coverImage) update.coverImage = coverImage;
    // the admin removed the image in the form
    else if (_coverUrl === '') update.coverImage = '';

    const chosenDate = parsePublishedAt(publishedAt);
    if (chosenDate) update.publishedAt = chosenDate;
    // first time it is published without a chosen date, stamp today
    else if (payload.status === 'published' && !current.publishedAt) update.publishedAt = new Date();

    return NewsModel.findByIdAndUpdate(id, update, { new: true });
};

// Soft delete: the post disappears everywhere, the record is kept
const deleteNews = async (id: string, actor: TActor) => {
    const result = await NewsModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, updatedBy: actor.userId },
        { new: true }
    );
    if (!result) throw new AppError(status.NOT_FOUND, 'News post not found');
    return result;
};

export const NewsServices = {
    createNews,
    getPublishedNews,
    getAllNewsForAdmin,
    getSingleNews,
    updateNews,
    deleteNews,
};
