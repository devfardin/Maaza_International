import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VipLevelServices } from './vipLevel.services';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';

const getVipLevels = catchAsync(async (req, res) => {
    const result = await VipLevelServices.getVipLevels();
    sendResponse(res, { success: true, statusCode: status.OK, message: 'VIP levels retrieved successfully', data: result });
});

const updateVipLevels = catchAsync(async (req, res) => {
    const result = await VipLevelServices.updateVipLevels(req.body.levels);
    await AdminActivityServices.record(req.user!, 'vip_levels_updated', 'Updated VIP levels and daily check-in bonuses', { type: 'vip_levels' });
    sendResponse(res, { success: true, statusCode: status.OK, message: 'VIP levels updated successfully', data: result });
});

export const VipLevelControllers = { getVipLevels, updateVipLevels };
