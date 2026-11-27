import { model, Schema, Types } from 'mongoose';
import { POPUP_FREQUENCIES, POPUP_PAGES, TPopupFrequency } from './popup.constant';

// Which members see the popup. Every field is optional in effect: the defaults mean "everyone".
export type TPopupAudience = {
    minLevel: number;         // membership level 1..9 (1 = member, 2..9 = VIP 1..8)
    maxLevel: number;
    districts: string[];      // [] = any district
    joinedFrom: Date | null;  // member joined on/after this day (null = no lower limit)
    joinedTo: Date | null;    // member joined on/before this day (null = no upper limit)
};

export type TPopup = {
    title: string;            // internal name, shown in the super admin list
    headerImage: string;      // Cloudinary / Media Library URL ('' when none)
    description: string;      // rich text HTML from the editor (scripts removed on save)
    bodyImage: string;        // image shown under the description ('' when none)
    buttonText: string;       // footer button label ('' hides the button)
    buttonLink: string;       // https://… or an internal /path
    targetPages: string[];    // dashboard pages that show this popup
    audience: TPopupAudience;
    frequency: TPopupFrequency; // once | daily | every_n_days | every_login (see popup.constant.ts)
    intervalDays: number;     // used by every_n_days: show again after this many days
    maxViews: number;         // total times one member may see it; 0 = no limit
    maxViewsPerDay: number;   // times one member may see it per Bangladesh day; 0 = no limit
    minPageVisits: number;    // show only from the member's Nth visit to the target page; 0 = any visit
    visitsBetweenShows: number; // daily only: wait this many more visits to the page after a show; 0 = no wait
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
        frequency: { type: String, enum: POPUP_FREQUENCIES, default: 'every_login' },
        intervalDays: { type: Number, default: 1, min: 1, max: 365 },
        maxViews: { type: Number, default: 0, min: 0, max: 1000 },
        maxViewsPerDay: { type: Number, default: 0, min: 0, max: 100 },
        minPageVisits: { type: Number, default: 0, min: 0, max: 1000 },
        visitsBetweenShows: { type: Number, default: 0, min: 0, max: 1000 },
        audience: {
            type: new Schema<TPopupAudience>(
                {
                    minLevel: { type: Number, default: 1, min: 1, max: 9 },
                    maxLevel: { type: Number, default: 9, min: 1, max: 9 },
                    districts: { type: [String], default: [] },
                    joinedFrom: { type: Date, default: null },
                    joinedTo: { type: Date, default: null },
                },
                { _id: false }
            ),
            default: () => ({}),
        },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

popupSchema.index({ isDeleted: 1, isActive: 1, targetPages: 1 });

export const PopupModel = model<TPopup>('Popup', popupSchema);
