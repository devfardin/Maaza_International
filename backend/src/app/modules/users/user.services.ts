import { log } from "console";
import { Tuser } from "./user.interface";
import { UserModel } from "./user.model";
import { generateUniqueReferralCode } from "./user.utils";

const createUser = async (payload: Tuser) => {
    const referralCode = await generateUniqueReferralCode(payload.phone);
    const result = await UserModel.create({...payload, referralCode});
    return result;
};

export const UserServices = {
    createUser,
}