import { model, Schema } from "mongoose";
import { TTask } from "./tasks.interface";

const taskSchema = new Schema<TTask>({
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, required: [true, "Description is required"], trim: true },
    image: { type: String, required: [true, "Image is required"], trim: true },
    rewardAmount: { type: Number, required: [true, "Reward amount is required"] },
    rewardType: { type: String, enum: ["cash", "points"], required: [true, "Reward type is required"] },
    instructions: { type: String, required: [true, "Instructions are required"], trim: true },
    specialNote: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    startsAt: { type: Date, required: [true, "Start date is required"] },
    endsAt: { type: Date, required: [true, "End date is required"] },
}, { timestamps: true });

export const TaskModel = model<TTask>("Task", taskSchema);
