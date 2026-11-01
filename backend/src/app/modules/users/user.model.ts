import { model, Schema } from "mongoose";
import { Tuser } from "./user.interface";

const userSchema = new Schema<Tuser>(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            minlength: [2, "Full name must be at least 2 characters"],
            maxlength: [50, "Full name must not exceed 50 characters"],
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },

        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: [true, "Password is required"],
        },

        referralCode: {
            type: String,
            required: [true, "Referral code is required"],
            minlength: [4, "Referral code must be at least 4 characters"],
            unique: true,
            trim: true,
        },

        referredBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        role: {
            type: String,
            enum: {
                values: ["user", "admin", "super_admin"],
                message: "Role must be one of: user, admin, super_admin",
            },
            default: "user",
        },

        status: {
            type: String,
            enum: ["active", "suspended", "blocked"],
            default: "active"
        },

        membershipLevel: {
            type: Number,
            default: 1,
            min: 1,
            max: 8
        },
        avatar: {
            type: String,
            default: "",
            match: [
                /^https?:\/\/.+/,
                "Avatar must be a valid URL",
            ],
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

//response sent empty pass
userSchema.post("save", function (doc: any, next: any) {
    doc.passwordHash = '';
    next();
});

export const UserModel = model<Tuser>("User", userSchema);