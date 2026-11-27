import status from 'http-status';
import AppError from '../../errors/AppError';
import { UserModel } from '../users/user.model';
import { PopupModel, TPopup, TPopupAudience } from './popup.model';
import { PopupViewModel } from './popupView.model';
import { PageVisitModel } from './pageVisit.model';

type TActor = { userId: string; fullName?: string; role: string };

// Popups are rendered with DOMPurify on the client too; this strips the obvious
// dangerous elements on save so the stored HTML is clean.
const cleanHtml = (html: string): string =>
    html
        .replace(/<(script|iframe|object|embed|frame|frameset|base|meta|link|style)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, '')
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');

const DAY_MS = 24 * 60 * 60 * 1000;

// Does this member fall inside the popup's audience? A missing audience (popups saved before
// this rule existed) means everyone.
const matchesAudience = (
    audience: Partial<TPopupAudience> | undefined,
    member: { membershipLevel?: number; district?: string; createdAt?: Date },
): boolean => {
    if (!audience) return true;

    const level = member.membershipLevel ?? 1;
    if (audience.minLevel !== undefined && level < audience.minLevel) return false;
    if (audience.maxLevel !== undefined && level > audience.maxLevel) return false;

    if (audience.districts?.length && !audience.districts.includes(member.district ?? '')) return false;

    // joinedTo is a whole day, so the member joined on that day still matches
    const joined = member.createdAt ? new Date(member.createdAt).getTime() : 0;
    if (audience.joinedFrom && joined < new Date(audience.joinedFrom).getTime()) return false;
    if (audience.joinedTo && joined >= new Date(audience.joinedTo).getTime() + DAY_MS) return false;

    return true;
};

// Bangladesh calendar day (YYYY-MM-DD), so "once a day" resets at local midnight
const bdDayKey = (date: Date): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

type TViewRecord = { count: number; lastDay: string; dayCount?: number } | undefined;

const DAY_KEY_MS = 24 * 60 * 60 * 1000;

// Whole days between two YYYY-MM-DD keys (today − lastDay)
const daysBetween = (fromKey: string, toKey: string): number =>
    Math.round((Date.parse(toKey) - Date.parse(fromKey)) / DAY_KEY_MS);

// Frequency + max-views rules, using how many times this member has already seen the popup
const matchesFrequency = (
    popup: { frequency?: string; intervalDays?: number; maxViews?: number; maxViewsPerDay?: number },
    view: TViewRecord,
    today: string,
): boolean => {
    const count = view?.count ?? 0;
    if (popup.maxViews && count >= popup.maxViews) return false;
    if (popup.maxViewsPerDay && view?.lastDay === today && (view.dayCount ?? 0) >= popup.maxViewsPerDay) return false;
    if (popup.frequency === 'once' && count > 0) return false;
    if (popup.frequency === 'daily' && view?.lastDay === today) return false;
    if (popup.frequency === 'every_n_days' && view?.lastDay) {
        if (daysBetween(view.lastDay, today) < (popup.intervalDays ?? 1)) return false;
    }
    // every_login (and popups saved before frequencies existed): the browser session decides
    return true;
};

// "Show again after N more visits": counted on the page where the popup was last shown
const matchesVisitGap = (
    popup: { visitsBetweenShows?: number },
    view: { lastShownPage?: string; lastShownVisit?: number } | undefined,
    visitsByPage: Map<string, number>,
): boolean => {
    if (!popup.visitsBetweenShows || !view?.lastShownPage) return true;
    const visitsNow = visitsByPage.get(view.lastShownPage) ?? 0;
    return visitsNow - (view.lastShownVisit ?? 0) >= popup.visitsBetweenShows;
};

// Members: popups that are active, target this dashboard page, match this member's audience,
// and are still due under their frequency / max-views rules
const getActivePopupsForPage = async (page: string, userId: string) => {
    // This request is the member opening the page: count the visit first, so this visit counts
    const visit = await PageVisitModel.findOneAndUpdate(
        { user: userId, page },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
    ).lean();
    const pageVisits = visit?.count ?? 1;

    const [popups, member] = await Promise.all([
        PopupModel.find({ isDeleted: false, isActive: true, targetPages: page }).sort({ createdAt: -1 }).lean(),
        UserModel.findById(userId).select('membershipLevel district createdAt').lean(),
    ]);
    if (!member || popups.length === 0) return [];

    const [views, allVisits] = await Promise.all([
        PopupViewModel.find({ user: userId, popup: { $in: popups.map((p) => p._id) } }).lean(),
        PageVisitModel.find({ user: userId }).lean(),
    ]);
    const viewByPopup = new Map(views.map((v) => [String(v.popup), v]));
    const visitsByPage = new Map(allVisits.map((v) => [v.page, v.count]));
    const today = bdDayKey(new Date());

    return popups
        .filter((popup) => matchesAudience(popup.audience, member))
        .filter((popup) => !popup.minPageVisits || pageVisits >= popup.minPageVisits)
        .filter((popup) => matchesFrequency(popup, viewByPopup.get(String(popup._id)), today))
        .filter((popup) => matchesVisitGap(popup, viewByPopup.get(String(popup._id)), visitsByPage))
        .map(({ createdBy, updatedBy, isDeleted, isActive, targetPages, audience, intervalDays, maxViews, maxViewsPerDay, minPageVisits, visitsBetweenShows, ...visible }) => visible);
};

// Member: the popup was actually displayed to them on `page` — records one more view
const markPopupSeen = async (popupId: string, userId: string, page: string) => {
    const exists = await PopupModel.exists({ _id: popupId, isDeleted: false });
    if (!exists) throw new AppError(status.NOT_FOUND, 'Popup not found');

    const now = new Date();
    const today = bdDayKey(now);
    const [previous, pageVisit] = await Promise.all([
        PopupViewModel.findOne({ popup: popupId, user: userId }).lean(),
        PageVisitModel.findOne({ user: userId, page }).lean(),
    ]);
    const dayCount = previous?.lastDay === today ? (previous.dayCount ?? 0) + 1 : 1;

    await PopupViewModel.findOneAndUpdate(
        { popup: popupId, user: userId },
        {
            $inc: { count: 1 },
            $set: { lastShownAt: now, lastDay: today, dayCount, lastShownPage: page, lastShownVisit: pageVisit?.count ?? 0 },
        },
        { upsert: true }
    );
};

// Only the settings that apply to the chosen frequency are kept, so the rules stay consistent
const applyFrequencyRules = <T extends Partial<TPopup>>(payload: T): T => {
    if (!payload.frequency) return payload;
    const out = { ...payload };
    if (out.frequency !== 'daily') {
        out.maxViewsPerDay = 0;
        out.visitsBetweenShows = 0;
    } else {
        out.maxViewsPerDay = Math.max(1, out.maxViewsPerDay ?? 1);
    }
    if (out.frequency !== 'every_n_days') out.intervalDays = 1;
    if (out.frequency === 'once') out.maxViews = 0;
    return out;
};

// Super admin: every popup
const getAllPopups = async () => {
    return PopupModel.find({ isDeleted: false }).sort({ createdAt: -1 });
};

const createPopup = async (payload: Partial<TPopup>, actor: TActor) => {
    return PopupModel.create({
        ...applyFrequencyRules(payload),
        description: cleanHtml(payload.description ?? ''),
        createdBy: actor.userId,
        updatedBy: actor.userId,
    });
};

const updatePopup = async (id: string, payload: Partial<TPopup>, actor: TActor) => {
    const update: Record<string, unknown> = { ...applyFrequencyRules(payload), updatedBy: actor.userId };
    if (payload.description !== undefined) update.description = cleanHtml(payload.description);

    const result = await PopupModel.findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true, runValidators: true });
    if (!result) throw new AppError(status.NOT_FOUND, 'Popup not found');
    return result;
};

// Soft delete: the popup stops showing, the record is kept
const deletePopup = async (id: string, actor: TActor) => {
    const result = await PopupModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, isActive: false, updatedBy: actor.userId },
        { new: true }
    );
    if (!result) throw new AppError(status.NOT_FOUND, 'Popup not found');
    return result;
};

export const PopupServices = {
    getActivePopupsForPage,
    markPopupSeen,
    getAllPopups,
    createPopup,
    updatePopup,
    deletePopup,
};
