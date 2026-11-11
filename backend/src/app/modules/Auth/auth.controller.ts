import status from "http-status";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import { getClientInfo } from "../../utils/clientInfo";
import { extractToken } from "../../middlewares/auth";
import AppError from "../../errors/AppError";

const loginUser = catchAsync(
    async (req, res) => {
        const result = await AuthServices.loginUser(req.body, getClientInfo(req));
        const { refreshToken, accessToken } = result;

        res.cookie('refreshToken', refreshToken, {
            secure: config.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 90 * 24 * 60 * 60 * 1000,
        })

        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: 'User logged in successfully',
            data: {
                accessToken,
                refreshToken,
                role: result.role,
            },
        })
    }
)

// refreash token
const refreshToken = catchAsync(
    async (req, res) => {
        const { refreshToken } = req.cookies;
        const result = await AuthServices.refreshToken(refreshToken);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: 'Access token is retrived successfully!',
            data: result,
        });
    });

const chagnePassword = catchAsync(
    async (req, res) => {
        const { ...passwordData } = req.body;

        const result = await AuthServices.changePassword(req.user!, passwordData)
        sendResponse(res, {
            success: true,
            statusCode: status.OK,
            message: 'User password changed successfully',
            data: result,
        })
    }
)

// forget password
const forgetPassword = catchAsync(async (req, res) => {
    const { phone } = req.body;
    await AuthServices.forgetPassword(phone);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'If an account exists for this phone number, a reset link has been sent to its email',
    })
})

// reset password
const resetPassword = catchAsync(async (req, res) => {
    const token = extractToken(req.headers.authorization);
    if (!token) throw new AppError(status.UNAUTHORIZED, 'Reset token is required');

    const result = await AuthServices.resetPassword( token, req.body);
    sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Password reset successful',
        data: result,
    })
})



export const AuthControllers = {
    loginUser,
    chagnePassword,
    refreshToken,
    forgetPassword,
    resetPassword
};