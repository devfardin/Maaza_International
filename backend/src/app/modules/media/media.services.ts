import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import status from 'http-status';
import AppError from '../../errors/AppError';
// This import also configures the Cloudinary SDK (cloud name / key / secret).
import { sendImageToCloudinary } from '../../utils/sendImageToCloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { MediaModel } from './media.model';

type TActor = { userId: string; role: string };
type TListQuery = { page?: string; limit?: string; search?: string; usage?: string };

// Where an image is used: which record, and which field of it
export type TUsage = { model: string; id: string; title: string; field: string };

const CLOUDINARY_URL = /https?:\/\/res\.cloudinary\.com\/[^\s"'<>()]+/g;
// Logs never show page images, so they are skipped to keep the usage scan fast
const SKIP_MODELS = new Set(['Media', 'ActivityLog', 'AdminActivity']);
const USAGE_PREVIEW = 20;

// http and https versions of the same Cloudinary asset count as one image
const normalizeUrl = (url: string) => url.replace(/^http:\/\//, 'https://');

// Visits every string in a document that mentions Cloudinary (also inside arrays and nested objects)
const walk = (value: unknown, path: string, visit: (text: string, field: string) => void) => {
    if (typeof value === 'string') {
        if (value.includes('res.cloudinary.com')) visit(value, path);
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
        return;
    }
    if (value && typeof value === 'object' && !(value instanceof Types.ObjectId) && !(value instanceof Date)) {
        for (const [key, child] of Object.entries(value)) {
            if (key === '_id' || key === '__v') continue;
            walk(child, path ? `${path}.${key}` : key, visit);
        }
    }
};

const pickTitle = (doc: Record<string, unknown>): string => {
    for (const key of ['title', 'name', 'fullName']) {
        if (typeof doc[key] === 'string' && doc[key]) return doc[key] as string;
    }
    return '';
};

// Scans every collection once and maps each Cloudinary image URL to the places that use it.
// A new model is picked up automatically, so no list of image fields has to be kept in sync.
export const collectUsage = async (): Promise<Map<string, TUsage[]>> => {
    const usage = new Map<string, TUsage[]>();

    for (const name of mongoose.modelNames()) {
        if (SKIP_MODELS.has(name)) continue;

        const cursor = mongoose.model(name).find({}).lean().cursor();
        for await (const doc of cursor) {
            const record = doc as Record<string, unknown>;
            const id = String(record._id);
            const title = pickTitle(record);

            walk(doc, '', (text, field) => {
                for (const match of text.match(CLOUDINARY_URL) ?? []) {
                    const key = normalizeUrl(match.replace(/[.,;]+$/, ''));
                    const list = usage.get(key) ?? [];
                    if (!list.some((u) => u.model === name && u.id === id && u.field === field)) {
                        list.push({ model: name, id, title, field });
                    }
                    usage.set(key, list);
                }
            });
        }
    }

    return usage;
};

// Upload a new image to Cloudinary and remember it in the Media Library.
const uploadMedia = async (file: Express.Multer.File | undefined, actor: TActor) => {
    if (!file) throw new AppError(status.BAD_REQUEST, 'Please choose an image to upload');

    // random suffix so an upload can never overwrite an existing Cloudinary asset
    const name = `media_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const uploaded = await sendImageToCloudinary(name, file.path);

    try {
        return await MediaModel.create({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            width: uploaded.width,
            height: uploaded.height,
            bytes: uploaded.bytes,
            format: uploaded.format,
            originalName: file.originalname,
            uploadedBy: actor.userId,
            source: 'upload',
        });
    } catch (error) {
        // don't leave an orphan image in Cloudinary when the database write fails
        await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: 'image' }).catch(() => undefined);
        throw error;
    }
};

// Newest first. Each item carries its usage; `usage=used|unused` filters by whether it is linked anywhere.
const getMedia = async (query: TListQuery) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));

    const usageMap = await collectUsage();
    const usedUrls = [...usageMap.keys()];

    const filter: Record<string, unknown> = {};
    const term = query.search?.trim();
    if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.originalName = { $regex: escaped, $options: 'i' };
    }
    if (query.usage === 'used') filter.url = { $in: usedUrls };
    if (query.usage === 'unused') filter.url = { $nin: usedUrls };

    const [records, total] = await Promise.all([
        MediaModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        MediaModel.countDocuments(filter),
    ]);

    const items = records.map((item) => {
        const used = usageMap.get(normalizeUrl(item.url)) ?? [];
        return { ...item, usageCount: used.length, usage: used.slice(0, USAGE_PREVIEW) };
    });

    return {
        items,
        meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    };
};

// Finds images already linked from records (products, news, payment methods...) that are
// not in the library yet, and adds them. Their details come from Cloudinary.
const importExistingMedia = async (actor: TActor) => {
    const usageMap = await collectUsage();
    const known = new Set((await MediaModel.distinct('url')).map((url) => normalizeUrl(url)));
    const missing = [...usageMap.keys()].filter((url) => !known.has(url));

    let imported = 0;
    const failed: string[] = [];

    for (const url of missing) {
        try {
            const publicId = publicIdFromUrl(url);
            if (!publicId) throw new Error('Unrecognised Cloudinary URL');

            const info = await cloudinary.api.resource(publicId, { resource_type: 'image' });
            await MediaModel.updateOne(
                { publicId: info.public_id },
                {
                    $setOnInsert: {
                        url: normalizeUrl(info.secure_url),
                        width: info.width ?? 0,
                        height: info.height ?? 0,
                        bytes: info.bytes ?? 0,
                        format: info.format ?? '',
                        originalName: info.original_filename ?? '',
                        uploadedBy: actor.userId,
                        source: 'imported',
                    },
                },
                { upsert: true }
            );
            imported++;
        } catch {
            failed.push(url);
        }
    }

    return { found: missing.length, imported, failed: failed.length, failedUrls: failed.slice(0, USAGE_PREVIEW) };
};

// https://res.cloudinary.com/<cloud>/image/upload/[transforms/]v123/folder/name.jpg -> folder/name
const publicIdFromUrl = (url: string): string | null => {
    const marker = url.indexOf('/upload/');
    if (marker === -1) return null;

    const path = url.slice(marker + '/upload/'.length).split(/[?#]/)[0];
    const parts = path.split('/');
    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
    const idParts = versionIndex === -1 ? parts : parts.slice(versionIndex + 1);
    if (!idParts.length) return null;

    try {
        return decodeURIComponent(idParts.join('/')).replace(/\.[a-z0-9]+$/i, '');
    } catch {
        return null;
    }
};

// Permanent delete: refused while the image is still used somewhere, so no live page breaks.
// The image is removed from Cloudinary first; if that fails the record is kept so the admin can retry.
const deleteMedia = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(status.NOT_FOUND, 'Image not found');

    const media = await MediaModel.findById(id);
    if (!media) throw new AppError(status.NOT_FOUND, 'Image not found');

    const used = (await collectUsage()).get(normalizeUrl(media.url)) ?? [];
    if (used.length) {
        const places = used.slice(0, 3).map((u) => `${u.model} "${u.title || u.id}"`).join(', ');
        throw new AppError(
            status.CONFLICT,
            `This image is used in ${used.length} place(s) (${places}${used.length > 3 ? ', …' : ''}). Remove it from those first.`
        );
    }

    const result = await cloudinary.uploader.destroy(media.publicId, { resource_type: 'image', invalidate: true });
    // 'not found' means it is already gone from Cloudinary, so the record can still be removed
    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new AppError(status.BAD_GATEWAY, 'Could not delete the image from Cloudinary. Please try again.');
    }

    await MediaModel.deleteOne({ _id: media._id });
    return media;
};

export const MediaServices = { uploadMedia, getMedia, deleteMedia, importExistingMedia };
