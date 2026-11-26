import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { LocationServices } from './location.services';

const getDistricts = catchAsync(async (req, res) => {
    const result = LocationServices.getDistricts();
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Districts retrieved successfully', data: result });
});

// Member: the browser position sent at login
const saveMyLocation = catchAsync(async (req, res) => {
    const { lat, lng } = req.body;
    const result = await LocationServices.saveMemberLocation(req.user!.userId, lat, lng);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Location saved', data: result });
});

const getSummary = catchAsync(async (req, res) => {
    const result = await LocationServices.getSummary();
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Member locations retrieved successfully', data: result });
});

export const LocationControllers = { getDistricts, saveMyLocation, getSummary };
