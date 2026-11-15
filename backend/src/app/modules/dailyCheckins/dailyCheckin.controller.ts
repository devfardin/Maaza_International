import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DailyCheckinServices } from './dailyCheckin.services';

const getStatus = catchAsync(async (req, res) => {
    const result = await DailyCheckinServices.getStatus(req.user!.userId);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Daily check-in status retrieved', data: result });
});

const checkIn = catchAsync(async (req, res) => {
    const result = await DailyCheckinServices.checkIn(req.user!.userId);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Daily check-in successful', data: result });
});

export const DailyCheckinControllers = { getStatus, checkIn };
