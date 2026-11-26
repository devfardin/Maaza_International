'use client';
// Super admin: create popups and choose which member dashboard pages show them.
// A popup = header image + description (rich text) + body image + footer button.
import { useState } from 'react';
import {
  useGetAdminPopupsQuery,
  useCreatePopupMutation,
  useUpdatePopupMutation,
  useDeletePopupMutation,
} from '@/redux/features/apiSlice';
import MediaField from '@/components/shared/MediaField';
import RichTextEditor from '@/components/shared/RichTextEditor';
import PageLoader from '@/components/shared/PageLoader';
import { POPUP_PAGE_OPTIONS, pageLabel } from '@/lib/popupPages';
import { notify, getErrorMessage } from '@/lib/toast';

const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
const label = 'mb-1 block text-xs font-bold text-slate-600';
const EMPTY = {
  title: '', headerImage: '', description: '', bodyImage: '',
  buttonText: '', buttonLink: '', targetPages: [], isActive: true,
};

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl border grid place-items-center">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PopupForm({ initial, onSave, onCancel, saving }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const set = (key) => (e) => setF((p) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function togglePage(key) {
    setF((p) => ({
      ...p,
      targetPages: p.targetPages.includes(key) ? p.targetPages.filter((k) => k !== key) : [...p.targetPages, key],
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (f.targetPages.length === 0) return notify.error('Choose at least one page to show this popup on.');
    const link = f.buttonLink.trim();
    if (link && !/^(https?:\/\/|\/(?!\/))/i.test(link)) return notify.error('Button link must start with https:// or /');
    if (f.buttonLink && !f.buttonText.trim()) return notify.error('Add a button text for the button link.');
    onSave({ ...f, buttonLink: link, buttonText: f.buttonText.trim(), title: f.title.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Popup name (internal)</label>
        <input required minLength={3} maxLength={120} value={f.title} onChange={set('title')} className={field} placeholder="e.g. Eid offer" />
      </div>

      <div>
        <span className={label}>Show this popup on these pages</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {POPUP_PAGE_OPTIONS.map((p) => (
            <label key={p.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${f.targetPages.includes(p.key) ? 'border-blue-500 bg-blue-50 font-bold text-blue-700' : 'bg-white text-slate-700'}`}>
              <input type="checkbox" checked={f.targetPages.includes(p.key)} onChange={() => togglePage(p.key)} className="accent-blue-600" />
              {p.label}
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-xs font-bold">
          <button type="button" onClick={() => setF((p) => ({ ...p, targetPages: POPUP_PAGE_OPTIONS.map((x) => x.key) }))} className="text-blue-600">Select all</button>
          <button type="button" onClick={() => setF((p) => ({ ...p, targetPages: [] }))} className="text-slate-500">Clear</button>
        </div>
      </div>

      <MediaField label="Header image (top of the popup)" hint="Pick from the Media Library, or upload a new image" value={f.headerImage} onChange={(url) => setF((p) => ({ ...p, headerImage: url }))} />

      <div>
        <span className={label}>Description</span>
        <RichTextEditor value={f.description} onChange={(html) => setF((p) => ({ ...p, description: html }))} placeholder="Write the popup message…" />
        <p className="mt-1 text-[11px] text-slate-400">Long text scrolls inside the popup; the header and the button stay fixed.</p>
      </div>

      <MediaField label="Body image (below the description)" hint="Pick from the Media Library, or upload a new image" value={f.bodyImage} onChange={(url) => setF((p) => ({ ...p, bodyImage: url }))} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Button text</label>
          <input maxLength={40} value={f.buttonText} onChange={set('buttonText')} className={field} placeholder="e.g. Learn more" />
        </div>
        <div>
          <label className={label}>Button link</label>
          <input maxLength={500} value={f.buttonLink} onChange={set('buttonLink')} className={field} placeholder="https://… or /dashboard/tasks" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <input type="checkbox" checked={f.isActive} onChange={set('isActive')} className="accent-blue-600 h-4 w-4" />
        Active (show to members)
      </label>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border py-3 text-sm font-bold">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Save popup'}
        </button>
      </div>
    </form>
  );
}

export default function PopupsAdmin() {
  const { data, isLoading } = useGetAdminPopupsQuery();
  const [createPopup, { isLoading: creating }] = useCreatePopupMutation();
  const [updatePopup, { isLoading: updating }] = useUpdatePopupMutation();
  const [deletePopup] = useDeletePopupMutation();
  const [sheet, setSheet] = useState(null); // null | { mode: 'create' } | { mode: 'edit', popup }

  const popups = data?.data ?? [];

  async function handleSave(payload) {
    try {
      if (sheet?.mode === 'edit') {
        await updatePopup({ id: sheet.popup._id, ...payload }).unwrap();
        notify.success('Popup updated.');
      } else {
        await createPopup(payload).unwrap();
        notify.success('Popup created.');
      }
      setSheet(null);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save the popup.'));
    }
  }

  async function handleToggle(popup) {
    try {
      await updatePopup({ id: popup._id, isActive: !popup.isActive }).unwrap();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not change the popup.'));
    }
  }

  async function handleDelete(popup) {
    if (!window.confirm(`Delete the popup "${popup.title}"?`)) return;
    try {
      await deletePopup(popup._id).unwrap();
      notify.success('Popup deleted.');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not delete the popup.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Popups</h1>
          <p className="text-sm text-slate-500 mt-1">Choose the member pages where a popup appears. Members see it when they open one of those pages.</p>
        </div>
        <button type="button" onClick={() => setSheet({ mode: 'create' })} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">
          + New popup
        </button>
      </div>

      {isLoading && <PageLoader label="Loading popups…" />}

      {!isLoading && popups.length === 0 && (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">No popups yet. Create the first one.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {popups.map((p) => (
          <div key={p._id} className="bg-white border rounded-2xl overflow-hidden flex flex-col">
            {p.headerImage ? (
              <img src={p.headerImage} alt="" className="h-36 w-full object-cover bg-slate-100" />
            ) : (
              <div className="h-36 grid place-items-center bg-slate-100 text-xs text-slate-400">No header image</div>
            )}
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-extrabold break-words">{p.title}</h2>
                <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.isActive ? 'Active' : 'Off'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.targetPages.map((key) => (
                  <span key={key} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-bold">{pageLabel(key)}</span>
                ))}
              </div>
              {p.buttonText && <p className="text-xs text-slate-500">Button: <b>{p.buttonText}</b> → <span className="break-all">{p.buttonLink || '—'}</span></p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => setSheet({ mode: 'edit', popup: p })} className="rounded-xl border px-3 py-2 text-xs font-bold">Edit</button>
                <button type="button" onClick={() => handleToggle(p)} className="rounded-xl border px-3 py-2 text-xs font-bold">{p.isActive ? 'Turn off' : 'Turn on'}</button>
                <button type="button" onClick={() => handleDelete(p)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sheet && (
        <Sheet title={sheet.mode === 'edit' ? 'Edit popup' : 'New popup'} onClose={() => setSheet(null)}>
          <PopupForm
            key={sheet.mode === 'edit' ? sheet.popup._id : 'new'}
            initial={sheet.mode === 'edit' ? sheet.popup : undefined}
            onSave={handleSave}
            onCancel={() => setSheet(null)}
            saving={creating || updating}
          />
        </Sheet>
      )}
    </div>
  );
}
