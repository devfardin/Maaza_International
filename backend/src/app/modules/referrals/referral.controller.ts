import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MembershipServices } from '../users/membership.services';
import { ReferralServices } from './referral.services';

const getMyReferrals = catchAsync(async (req, res) => {
    const { userId } = req.user!;
    const [stats, membership] = await Promise.all([
        ReferralServices.getMyReferrals(userId),
        MembershipServices.getProgress(userId),
    ]);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Referrals retrieved successfully',
        data: { ...stats, membership },
    });
});

export const ReferralController = { getMyReferrals };
