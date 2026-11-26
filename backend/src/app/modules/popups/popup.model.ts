import { model, Schema, Types } from 'mongoose';
import { POPUP_PAGES } from './popup.constant';

export type TPopup = {
    title: string;            // internal name, shown in the super admin list
    headerImage: string;      // Cloudinary / Media Library URL ('' when none)
    description: string;      // rich text HTML from the editor (scripts removed on save)
    bodyImage: string;        // image shown under the description ('' when none)
    buttonText: string;       // footer button label ('' hides the button)
    buttonLink: string;       // https://… or an internal /path
    targetPages: string[];    // dashboard pages that show this popup
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId | null;
    isDeleted: boolean;
};

const popupSchema = new Schema<TPopup>(
    {
        title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
        headerImage: { type: String, default: '' },
        description: { type: String, default: '' },
        bodyImage: { type: String, default: '' },
        buttonText: { type: String, trim: true, maxlength: 40, default: '' },
        buttonLink: { type: String, trim: true, maxlength: 500, default: '' },
        targetPages: { type: [{ type: String, enum: POPUP_PAGES }], default: [] },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

popupSchema.index({ isDeleted: 1, isActive: 1, targetPages: 1 });

export const PopupModel = model<TPopup>('Popup', popupSchema);
