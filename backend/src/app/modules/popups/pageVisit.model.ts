import { model, Schema, Types } from 'mongoose';

// How many times a member has opened a dashboard page. Used by the "from the Nth visit" condition.
export type TPageVisit = {
    user: Types.ObjectId;
    page: string;
    count: number;
};

const pageVisitSchema = new Schema<TPageVisit>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    page: { type: String, required: true },
    count: { type: Number, default: 0 },
});

pageVisitSchema.index({ user: 1, page: 1 }, { unique: true });

export const PageVisitModel = model<TPageVisit>('PageVisit', pageVisitSchema);
