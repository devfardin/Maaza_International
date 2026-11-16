import { model, Schema, Types } from 'mongoose';

// One row per image uploaded through the Media Library.
export type TMedia = {
    url: string;
    publicId: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    originalName: string;
    uploadedBy: Types.ObjectId;
    source: 'upload' | 'imported';
};

const mediaSchema = new Schema<TMedia>(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true, unique: true },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        bytes: { type: Number, default: 0 },
        format: { type: String, default: '' },
        originalName: { type: String, default: '', trim: true, maxlength: 200 },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        // 'imported' = found already used in the database and added by "Import existing images"
        source: { type: String, enum: ['upload', 'imported'], default: 'upload' },
    },
    { timestamps: true }
);

mediaSchema.index({ createdAt: -1 });

export const MediaModel = model<TMedia>('Media', mediaSchema);
