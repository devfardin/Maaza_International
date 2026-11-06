import { Model, Types } from "mongoose";
import { is } from "zod/locales";

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
}

export type TuserDocument = Tuser & { _id: Types.ObjectId };

export interface User extends Model<Tuser> {
    isUserExistsById(id: string): Promise<TuserDocument | null>;
    isUserExistsByEmail(email: string): Promise<TuserDocument | null>;
    isUserExistsByPhone(phone: string): Promise<TuserDocument | null>;
}