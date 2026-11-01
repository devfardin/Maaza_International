import { Tuser } from "./user.interface";
import { UserModel } from "./user.model";

const createUser = async (payload: Tuser) => {
    const result = await UserModel.create(payload);
    return result;
};

export const UserServices = {
    createUser,
}