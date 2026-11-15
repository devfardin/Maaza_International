import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';
import { NewsServices } from './news.services';

// Members: list of published posts
const getPublishedNews = catchAsync(async (req, res) => {
    const result = await NewsServices.getPublishedNews();
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News fetched successfully', data: result });
});

// Admins: every post incl. drafts
const getAllNewsForAdmin = catchAsync(async (req, res) => {
    const result = await NewsServices.getAllNewsForAdmin();
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News fetched successfully', data: result });
});

// One post (members see published posts only)
const getSingleNews = catchAsync(async (req, res) => {
    const result = await NewsServices.getSingleNews(req.params.id, req.user!);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News fetched successfully', data: result });
});

const createNews = catchAsync(async (req, res) => {
    const result = await NewsServices.createNews(req.file, req.body, req.user!);
    await AdminActivityServices.record(req.user!, 'news_created', `Created news: ${result.title}`, { type: 'news', id: result._id });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News created successfully', data: result });
});

const updateNews = catchAsync(async (req, res) => {
    const result = await NewsServices.updateNews(req.params.id, req.file, req.body, req.user!);
    await AdminActivityServices.record(req.user!, 'news_updated', `Updated news: ${result?.title ?? req.params.id}`, { type: 'news', id: req.params.id });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News updated successfully', data: result });
});

const deleteNews = catchAsync(async (req, res) => {
    const result = await NewsServices.deleteNews(req.params.id, req.user!);
    await AdminActivityServices.record(req.user!, 'news_deleted', `Deleted news: ${result.title}`, { type: 'news', id: req.params.id });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'News deleted successfully', data: null });
});

export const NewsController = {
    getPublishedNews,
    getAllNewsForAdmin,
    getSingleNews,
    createNews,
    updateNews,
    deleteNews,
};
