import { randomInt } from "crypto";
import { UserModel } from "./user.model";
import AppError from "../../errors/AppError";
import status from "http-status";

export const generateUniqueReferralCode = async (phone: string): Promise<string> => {
    const phoneSuffix = phone.toString().slice(-4);
    const randomSuffix = randomInt(10, 99).toString();
    const referralCode = `${phoneSuffix}${randomSuffix}`;

    const existingUser = await UserModel.findOne({ referralCode });

    if (existingUser) {
        throw new AppError(
            status.BAD_REQUEST,
            "Unable to generate a unique referral code. Please try again.");
    }

    return referralCode;
};
