import { model, Schema } from "mongoose";
import { Tuser, User, } from "./user.interface";
import { ObjectId } from "mongodb";
import config from "../../config";
import bcrypt from 'bcrypt';

const userSchema = new Schema<Tuser, User>(
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
// make Encrypt password
userSchema.pre('save', async function (next) {
    const user = this;
    user.passwordHash = await bcrypt.hash(
        user.passwordHash,
        Number(config.bcrypt_salt_rounds)
    );
});

//response sent empty pass
userSchema.post("save", function (doc: any, next: any) {
    doc.passwordHash = '';
    next();
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
    return await UserModel.findOne({ email });
}

userSchema.statics.isUserExistsByPhone = async function (phone: string) {
    return await UserModel.findOne({ phone });
}

userSchema.statics.isUserExistsById = async function (id: ObjectId) {
    return await UserModel.findById(id);
}

export const UserModel = model<Tuser, User>("User", userSchema);