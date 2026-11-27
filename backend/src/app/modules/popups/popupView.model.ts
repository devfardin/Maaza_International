import { model, Schema, Types } from 'mongoose';

// One row per (popup, member): how many times the member has been shown the popup.
// Lets "once" / "daily" / "max views" rules hold across browser sessions and devices.
export type TPopupView = {
    popup: Types.ObjectId;
    user: Types.ObjectId;
    count: number;      // times shown
    lastShownAt: Date;
    lastDay: string;    // YYYY-MM-DD in Bangladesh time, for the "once a day" rule
    dayCount: number;   // times shown on lastDay, for "max views per day"
    lastShownPage: string;  // page the popup was last shown on
    lastShownVisit: number; // how many times the member had visited that page at the last show
};

const popupViewSchema = new Schema<TPopupView>({
    popup: { type: Schema.Types.ObjectId, ref: 'Popup', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, default: 0 },
    lastShownAt: { type: Date, default: null },
    lastDay: { type: String, default: '' },
    dayCount: { type: Number, default: 0 },
    lastShownPage: { type: String, default: '' },
    lastShownVisit: { type: Number, default: 0 },
});

popupViewSchema.index({ popup: 1, user: 1 }, { unique: true });

export const PopupViewModel = model<TPopupView>('PopupView', popupViewSchema);
