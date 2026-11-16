'use client';
// Reusable Media Picker — a dialog with two tabs:
//   • Upload new   — upload an image; it is selected straight away
//   • Media Library — browse previously uploaded images and pick one (no re-upload)
//
//   <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(media) => setUrl(media.url)} />
//
// `onSelect` receives the media record: { _id, url, publicId, width, height, originalName, ... }
import { useCallback, useEffect, useState } from 'react';
import { fetchMedia } from '@/lib/media';
import { getErrorMessage } from '@/lib/toast';
import MediaUploader from '@/components/shared/MediaUploader';

const PAGE_SIZE = 24;

export default function MediaPicker({ open, onClose, onSelect, title = 'Choose an image' }) {
  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (page, term, append) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMedia({ page, limit: PAGE_SIZE, search: term });
      setItems((prev) => (append ? [...prev, ...res.data] : res.data));
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the Media Library.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the first page when the library tab is shown; search is debounced
  useEffect(() => {
    if (!open || tab !== 'library') return;
    const timer = setTimeout(() => load(1, search.trim(), false), 300);
    return () => clearTimeout(timer);
  }, [open, tab, search, load]);

  // Clears the selection so the next opening starts fresh
  const close = () => {
    setSelected(null);
    onClose?.();
  };

  if (!open) return null;

  const hasMore = meta && meta.page < meta.totalPage;

  const confirm = () => {
    if (!selected) return;
    onSelect?.(selected);
    close();
  };

  const tabClass = (key) =>
    `flex-1 rounded-xl px-4 py-2 text-sm font-bold transition ${
      tab === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:max-w-3xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl border">✕</button>
        </div>

        <div className="px-5 pt-4">
          <div role="tablist" className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            <button type="button" role="tab" aria-selected={tab === 'upload'} className={tabClass('upload')} onClick={() => setTab('upload')}>
              Upload new
            </button>
            <button type="button" role="tab" aria-selected={tab === 'library'} className={tabClass('library')} onClick={() => setTab('library')}>
              Media Library
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'upload' ? (
            <MediaUploader onUploaded={(media) => { onSelect?.(media); close(); }} />
          ) : (
            <div className="space-y-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              {!loading && !error && items.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-500">No images yet. Upload one in the first tab.</p>
              )}

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((item) => {
                  const active = selected?._id === item._id;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setSelected(item)}
                      onDoubleClick={() => { setSelected(item); onSelect?.(item); close(); }}
                      aria-pressed={active}
                      title={item.originalName || item.publicId}
                      className={`overflow-hidden rounded-xl border-2 bg-slate-50 text-left transition ${
                        active ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={item.url} alt={item.originalName || ''} loading="lazy" className="aspect-square w-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => load(meta.page + 1, search.trim(), true)}
                    disabled={loading}
                    className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50"
                  >
                    {loading ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
              {loading && items.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Loading…</p>}
            </div>
          )}
        </div>

        {tab === 'library' && (
          <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
            <p className="truncate text-xs text-slate-500">
              {selected ? selected.originalName || 'Selected image' : 'Pick an image (double-click to choose it quickly)'}
            </p>
            <button
              type="button"
              onClick={confirm}
              disabled={!selected}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
