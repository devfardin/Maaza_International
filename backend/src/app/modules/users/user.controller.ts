import status from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { getClientInfo } from '../../utils/clientInfo';
import { UserServices } from './user.services';
import { AdminActivityServices } from '../adminActivity/adminActivity.services';

// Self-service profile update. Only the fields a user may change themselves;
// referralCode, membershipLevel, status, role and wallets can never be changed here.
const updateMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.updateMyProfile(req.user!.userId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

// Public registration — always creates a normal user
const createUser = catchAsync(async (req, res) => {
  const result = await UserServices.createUser(req.body, getClientInfo(req));
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

// super_admin only
const createAdmin = catchAsync(async (req, res) => {
  const result = await UserServices.createAdmin(req.body, getClientInfo(req));
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Admin created successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const result = await UserServices.getMe(req.user!.userId);
  if (!result) throw new AppError(status.NOT_FOUND, 'User not found');
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'User retrieved successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsers();
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await UserServices.getSingleUser(req.params.id);
  if (!result) throw new AppError(status.NOT_FOUND, 'User not found');
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserServices.updateUser(req.user!, req.params.id, req.body);
  await AdminActivityServices.record(
    req.user!,
    'user_updated',
    `Updated profile of ${result?.fullName ?? 'user'} (fields: ${Object.keys(req.body).join(', ')})`,
    { type: 'user', id: req.params.id }
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await UserServices.deleteUser(req.user!, req.params.id);
  await AdminActivityServices.record(
    req.user!,
    'user_deleted',
    `Deleted (soft) user ${result?.fullName ?? req.params.id}`,
    { type: 'user', id: req.params.id }
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'User deleted successfully',
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req, res) => {
  const result = await UserServices.changeUserStatus(req.user!, req.params.id, req.body.status);
  await AdminActivityServices.record(
    req.user!,
    'user_status_changed',
    `Set account status of ${result?.fullName ?? 'user'} to ${req.body.status}`,
    { type: 'user', id: req.params.id }
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'User status changed successfully',
    data: result,
  });
});

export const UserController = {
  updateMyProfile,
  createUser,
  createAdmin,
  deleteUser,
  changeUserStatus,
  getMe,
  getAllUsers,
  getSingleUser,
  updateUser,
};
