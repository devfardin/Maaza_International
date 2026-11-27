import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DeletedItemsServices } from './deletedItems.services';

const listDeleted = catchAsync(async (req, res) => {
    const result = await DeletedItemsServices.listDeleted(req.query.kind as string | undefined);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Deleted items retrieved', data: result });
});

const permanentlyDelete = catchAsync(async (req, res) => {
    const result = await DeletedItemsServices.permanentlyDelete(req.params.kind, req.params.id, req.user!);
    sendResponse(res, { statusCode: status.OK, success: true, message: 'Deleted permanently', data: result });
});

export const DeletedItemsControllers = { listDeleted, permanentlyDelete };
