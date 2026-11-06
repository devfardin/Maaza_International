import status from 'http-status';
import AppError from '../errors/AppError';
import { UserModel } from '../modules/users/user.model';
import { TuserDocument } from '../modules/users/user.interface';

export const validateActiveUser = async (phone: string): Promise<TuserDocument> => {
    const user = await UserModel.isUserExistsByPhone(phone);
    if (!user) throw new AppError(status.NOT_FOUND, 'User does not exist');
    if (user.isDeleted) throw new AppError(status.FORBIDDEN, 'User is deleted');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, `User is ${user.status}`);
    return user;
};

export const validateActiveUserById = async (id: string): Promise<TuserDocument> => {
    const user = await UserModel.isUserExistsById(id as any);
    if (!user) throw new AppError(status.NOT_FOUND, 'User does not exist');
    if (user.isDeleted) throw new AppError(status.FORBIDDEN, 'User is deleted');
    if (user.status !== 'active') throw new AppError(status.FORBIDDEN, `User is ${user.status}`);
    return user;
};
