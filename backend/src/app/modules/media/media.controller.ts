import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';
import { MediaServices } from './media.services';

const getMedia = catchAsync(async (req, res) => {
    const { items, meta } = await MediaServices.getMedia({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        search: req.query.search as string | undefined,
        usage: req.query.usage as string | undefined,
    });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Media fetched successfully', meta, data: items });
});

const uploadMedia = catchAsync(async (req, res) => {
    const result = await MediaServices.uploadMedia(req.file, req.user!);
    await AdminActivityServices.record(req.user!, 'media_uploaded', `Uploaded image: ${result.originalName || result.publicId}`, { type: 'media', id: result._id });
    sendResponse(res, { statusCode: status.CREATED, success: true, message: 'Image uploaded successfully', data: result });
});

const deleteMedia = catchAsync(async (req, res) => {
    const result = await MediaServices.deleteMedia(req.params.id as string);
    await AdminActivityServices.record(req.user!, 'media_deleted', `Permanently deleted image: ${result.originalName || result.publicId}`, { type: 'media', id: req.params.id as string });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Image deleted permanently', data: null });
});

const importExisting = catchAsync(async (req, res) => {
    const result = await MediaServices.importExistingMedia(req.user!);
    await AdminActivityServices.record(req.user!, 'media_imported', `Imported ${result.imported} existing image(s) into the Media Library`, { type: 'media' });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Existing images imported', data: result });
});

export const MediaController = { getMedia, uploadMedia, deleteMedia, importExisting };
