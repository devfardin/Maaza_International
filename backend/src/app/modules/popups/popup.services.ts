import status from 'http-status';
import AppError from '../../errors/AppError';
import { PopupModel, TPopup } from './popup.model';

type TActor = { userId: string; fullName?: string; role: string };

// Popups are rendered with DOMPurify on the client too; this strips the obvious
// dangerous elements on save so the stored HTML is clean.
const cleanHtml = (html: string): string =>
    html
        .replace(/<(script|iframe|object|embed|frame|frameset|base|meta|link|style)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, '')
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');

// Members: popups that are active and target this dashboard page
const getActivePopupsForPage = async (page: string) => {
    return PopupModel.find({ isDeleted: false, isActive: true, targetPages: page })
        .select('-createdBy -updatedBy -isDeleted -isActive -targetPages')
        .sort({ createdAt: -1 });
};

// Super admin: every popup
const getAllPopups = async () => {
    return PopupModel.find({ isDeleted: false }).sort({ createdAt: -1 });
};

const createPopup = async (payload: Partial<TPopup>, actor: TActor) => {
    return PopupModel.create({
        ...payload,
        description: cleanHtml(payload.description ?? ''),
        createdBy: actor.userId,
        updatedBy: actor.userId,
    });
};

const updatePopup = async (id: string, payload: Partial<TPopup>, actor: TActor) => {
    const update: Record<string, unknown> = { ...payload, updatedBy: actor.userId };
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
    getAllPopups,
    createPopup,
    updatePopup,
    deletePopup,
};
