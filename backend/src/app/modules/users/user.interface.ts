import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";

export interface Tuser  {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    referralCode: string;
    referredBy?: Types.ObjectId;
    role: "user" | "admin" | 'super_admin';
    status: "active" | "suspended" | "blocked";
    membershipLevel: number;
    avatar?: string;
    isDeleted: boolean;
    welcomeBonusClaimed?: boolean;
    passwordChangedAt?: Date;
}

export type TuserDocument = Tuser & { _id: Types.ObjectId };

export interface User extends Model<Tuser> {
    isUserExistsById(id: Types.ObjectId | string): Promise<TuserDocument | null>;
    isUserExistsByEmail(email: string): Promise<TuserDocument | null>;
    isUserExistsByPhone(phone: string): Promise<TuserDocument | null>;
}

export type TUserRole = keyof typeof USER_ROLE;