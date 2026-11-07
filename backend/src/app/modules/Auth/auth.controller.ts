import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

const loginUser = catchAsync(
    async (req, res) => {
        const result = await AuthServices.loginUser(req.body);
        const { refreshToken, accessToken } = result;
        
        res.cookie('refreshToken', refreshToken, {
            secure: config.NODE_ENV === 'production',
            httpOnly: true,
        })

        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: 'User logged in successfully',
            data: {
                accessToken,
                
            },
        })
    }
)

const chagnePassword = catchAsync(
    async (req, res) => {
        const { ...passwordData } = req.body;
        
        const result = await AuthServices.changePassword(req.user!, passwordData)
        sendResponse(res, {
            success: true,
            statusCode: 200,
            message: 'User password changed successfully',
            data: result,
        })
    }
)

export const AuthControllers = {
    loginUser,
    chagnePassword
};