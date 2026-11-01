import status from "http-status";
import { Tuser } from "./user.interface";
import { UserServices } from "./user.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const createUser = catchAsync(
  async (req, res) => {
    const payload: Tuser = req.body;
    const result = await UserServices.createUser(payload);
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User created successfully',
    data: result,
  });
    
  })

export const UserController = {
  createUser,
}