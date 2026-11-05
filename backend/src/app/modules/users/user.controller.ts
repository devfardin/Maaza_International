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

// user deleted
const deleteUser = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    const result = await UserServices.deleteUser(id);
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'User deleted successfully',
      data: result,
    })
  }
)

// chage user status by admin
const changeUserStatus = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    
    const result = await UserServices.changeUserStatus(id, payload.status);
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'User status changed successfully',
      data: result,
    })
  }
)

export const UserController = {
  createUser,
  deleteUser,
  changeUserStatus
}