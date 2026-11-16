import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SalaryServices } from './salary.services';

const getStatus = catchAsync(async (req, res) => {
    const result = await SalaryServices.getStatus(req.user!.userId);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Salary status retrieved successfully', data: result });
});

const claimSalary = catchAsync(async (req, res) => {
    const result = await SalaryServices.claimSalary(req.user!.userId);
    sendResponse(res, { success: true, statusCode: status.OK, message: 'Salary claimed successfully', data: result });
});

export const SalaryControllers = { getStatus, claimSalary };
