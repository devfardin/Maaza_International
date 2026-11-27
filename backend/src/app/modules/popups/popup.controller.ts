import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';
import { PopupServices } from './popup.services';

// Members: active popups for the page they are on (?page=home)
const getActivePopups = catchAsync(async (req, res) => {
    const page = String(req.query.page ?? '');
    const result = await PopupServices.getActivePopupsForPage(page, req.user!.userId);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Popups fetched successfully', data: result });
});

// Members: the popup was shown — counts toward its frequency / max views
const markPopupSeen = catchAsync(async (req, res) => {
    await PopupServices.markPopupSeen(req.params.id, req.user!.userId, req.body.page);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Popup view recorded', data: null });
});

const getAllPopups = catchAsync(async (req, res) => {
    const result = await PopupServices.getAllPopups();
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Popups fetched successfully', data: result });
});

const createPopup = catchAsync(async (req, res) => {
    const result = await PopupServices.createPopup(req.body, req.user!);
    await AdminActivityServices.record(req.user!, 'popup_created', `Created popup: ${result.title}`, { type: 'popup', id: result._id });
    sendResponse(res, { statusCode: status.CREATED, success: true, message: 'Popup created successfully', data: result });
});

const updatePopup = catchAsync(async (req, res) => {
    const result = await PopupServices.updatePopup(req.params.id, req.body, req.user!);
    await AdminActivityServices.record(req.user!, 'popup_updated', `Updated popup: ${result.title}`, { type: 'popup', id: req.params.id });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Popup updated successfully', data: result });
});

const deletePopup = catchAsync(async (req, res) => {
    const result = await PopupServices.deletePopup(req.params.id, req.user!);
    await AdminActivityServices.record(req.user!, 'popup_deleted', `Deleted popup: ${result.title}`, { type: 'popup', id: req.params.id });
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Popup deleted successfully', data: null });
});

export const PopupControllers = { getActivePopups, markPopupSeen, getAllPopups, createPopup, updatePopup, deletePopup };
