import { Types } from "mongoose";
import { is } from "zod/locales";

export type Tuser = {
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