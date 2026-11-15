import { Types } from 'mongoose';

export type TNewsStatus = 'draft' | 'published';

// News & Updates post. The body is HTML + CSS written by an admin and rendered
// by the frontend inside an isolated, script-free frame so it works on every device.
// Two post formats:
//  text → title, notice image, short + long description (long one written in the text editor)
//  html → only the admin's own HTML + CSS design is shown on the post page
export type TNewsFormat = 'text' | 'html';

export type TNewsPost = {
    title: string;
    format?: TNewsFormat;     // missing on posts created before formats existed
    summary: string;          // short description (list cards)
    longDescription: string;  // text format: long description (rich text HTML)
    tag: string;              // notice type: ANNOUNCEMENT, SECURITY, EDUCATION, UPDATE
    coverImage: string;       // Cloudinary URL ('' when none)
    htmlContent: string;      // html format: body markup (scripts and frames are removed on save)
    cssContent: string;       // html format: body styles
    status: TNewsStatus;
    publishedAt: Date | null;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId | null;
    isDeleted: boolean;
};
