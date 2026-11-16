import status from 'http-status';
import AppError from '../errors/AppError';
import config from '../config';
import { sendImageToCloudinary } from './sendImageToCloudinary';

// An image picked from the Media Library arrives as its URL. Only images hosted in our own
// Cloudinary account are accepted, so arbitrary external links can't be attached.
export const isOwnImageUrl = (url: unknown): url is string =>
    typeof url === 'string' &&
    !!config.cloudinary_cloud_name &&
    url.startsWith(`https://res.cloudinary.com/${config.cloudinary_cloud_name}/image/upload/`);

// Returns the final image URL: a newly uploaded file, or an existing library image.
// Returns undefined when neither is given.
export const resolveImage = async (
    file: { path: string } | undefined,
    name: string,
    url?: string
): Promise<string | undefined> => {
    if (file) {
        const { secure_url } = await sendImageToCloudinary(name, file.path);
        return secure_url;
    }
    if (!url) return undefined;
    if (!isOwnImageUrl(url)) {
        throw new AppError(status.BAD_REQUEST, 'Choose an image from the Media Library or upload one');
    }
    return url;
};
