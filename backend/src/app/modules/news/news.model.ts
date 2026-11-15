import { model, Schema } from 'mongoose';
import { TNewsPost } from './news.interface';

const newsSchema = new Schema<TNewsPost>(
    {
        title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 160 },
        format: { type: String, enum: ['text', 'html'] }, // no default: old posts are detected by their content
        summary: { type: String, trim: true, maxlength: 400, default: '' },
        longDescription: { type: String, default: '' },
        tag: { type: String, trim: true, maxlength: 30, default: 'UPDATE' },
        coverImage: { type: String, default: '' },
        htmlContent: { type: String, default: '' },
        cssContent: { type: String, default: '' },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

newsSchema.index({ status: 1, isDeleted: 1, publishedAt: -1 });

export const NewsModel = model<TNewsPost>('NewsPost', newsSchema);
