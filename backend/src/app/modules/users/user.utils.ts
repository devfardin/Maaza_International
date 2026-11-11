import { randomInt } from "crypto";
import status from "http-status";
import AppError from "../../errors/AppError";
import { UserModel } from "./user.model";

// 4 phone digits + 3 random digits, retried on collision
export const generateUniqueReferralCode = async (phone: string): Promise<string> => {
    const phoneSuffix = phone.toString().slice(-4);

    for (let attempt = 0; attempt < 10; attempt++) {
        const referralCode = `${phoneSuffix}${randomInt(100, 1000)}`;
        const existingUser = await UserModel.exists({ referralCode });
        if (!existingUser) return referralCode;
    }

    throw new AppError(status.INTERNAL_SERVER_ERROR, "Unable to generate a unique referral code. Please try again.");
};
