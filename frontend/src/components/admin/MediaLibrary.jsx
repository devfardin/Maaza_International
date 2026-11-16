'use client';
// Admin / super admin: Media Library — every image, and where each one is used.
//   • Cards show "Not used" (amber) or "Used in N"; filter by In use / Not used
//   • Click an image → details: link (Copy), the places that use it
//   • Import existing images: adds images already linked from products, news, etc.
//   • Super admin only: permanently delete an unused image (no undo)
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import MediaUploader from '@/components/shared/MediaUploader';
import { fetchMedia, deleteMedia, copyText, importExistingMedia, usageLabel } from '@/lib/media';
import { notify, getErrorMessage } from '@/lib/toast';

const PAGE_SIZE = 30;
const USAGE_FILTERS = [
  { key: 'all', label: 'All images' },
  { key: 'used', label: 'In use' },
  { key: 'unused', label: 'Not used' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-BD', { dateStyle: 'medium' }) : '—');
const formatSize = (bytes) => (bytes ? `${(bytes / 1024).toFixed(0)} KB` : '—');

function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl border">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UsageBadge({ count }) {
  return count > 0 ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Used in {count}</span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Not used</span>
  );
}

export default function MediaLibrary() {
  const isSuperAdmin = useSelector((s) => s.auth.user?.role) === 'super_admin';

  const [search, setSearch] = useState('');
  const [usage, setUsage] = useState('all');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [detail, setDetail] = useState(null);     // selected media record (with usage)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (page, term, usageFilter, append) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMedia({ page, limit: PAGE_SIZE, search: term, usage: usageFilter });
      setItems((prev) => (append ? [...prev, ...res.data] : res.data));
      setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the Media Library.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // First page whenever search or filter changes; search is debounced
  useEffect(() => {
    const timer = setTimeout(() => load(1, search.trim(), usage, false), 300);
    return () => clearTimeout(timer);
  }, [search, usage, load]);

  const reload = () => load(1, search.trim(), usage, false);

  const closeDetail = () => {
    setDetail(null);
    setConfirmDelete(false);
  };

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importExistingMedia();
      if (result.found === 0) notify.info('Every image in use is already in the library.');
      else notify.success(`Imported ${result.imported} of ${result.found} images.${result.failed ? ` ${result.failed} could not be read from Cloudinary.` : ''}`);
      reload();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Import failed. Please try again.'));
    } finally {
      setImporting(false);
    }
  }

  async function handleCopy(url) {
    const ok = await copyText(url);
    if (ok) notify.success('Link copied to clipboard.');
    else notify.error('Could not copy. Select the link and copy it manually.');
  }

  async function handleDelete() {
    if (!detail) return;
    setDeleting(true);
    try {
      await deleteMedia(detail._id);
      setItems((prev) => prev.filter((m) => m._id !== detail._id));
      setMeta((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
      notify.success('Image deleted permanently.');
      closeDetail();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not delete the image.'));
    } finally {
      setDeleting(false);
    }
  }

  const hasMore = meta && meta.page < meta.totalPage;
  const inUse = detail?.usageCount > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Media Library</h1>
          <p className="text-sm text-slate-500">
            {meta ? `${meta.total} image${meta.total === 1 ? '' : 's'}` : 'Every uploaded image'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import existing images'}
          </button>
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            {showUpload ? 'Close upload' : '+ Upload image'}
          </button>
        </div>
      </header>

      {showUpload && (
        <section className="rounded-2xl border bg-white p-5">
          <MediaUploader onUploaded={() => { setShowUpload(false); reload(); }} />
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by file name"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:max-w-sm"
        />
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {USAGE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setUsage(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${usage === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-500">No images found.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => setDetail(item)}
            className="group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <div className="relative">
              <img src={item.url} alt={item.originalName || ''} loading="lazy" className="aspect-square w-full bg-slate-50 object-cover" />
              <div className="absolute left-2 top-2"><UsageBadge count={item.usageCount ?? 0} /></div>
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-bold text-slate-700">{item.originalName || item.publicId}</p>
              <p className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => load(meta.page + 1, search.trim(), usage, true)}
            disabled={loading}
            className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {/* ── Details: link, usage, delete ── */}
      {detail && (
        <Dialog title="Image details" onClose={closeDetail}>
          <div className="space-y-5">
            <img src={detail.url} alt={detail.originalName || ''} className="mx-auto max-h-80 rounded-xl border bg-slate-50 object-contain" />

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-500">File name</dt><dd className="truncate font-bold">{detail.originalName || '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Added</dt><dd className="font-bold">{formatDate(detail.createdAt)} · {detail.source === 'imported' ? 'imported' : 'uploaded'}</dd></div>
              <div><dt className="text-xs text-slate-500">Dimensions</dt><dd className="font-bold">{detail.width && detail.height ? `${detail.width} × ${detail.height}` : '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Size</dt><dd className="font-bold">{formatSize(detail.bytes)}</dd></div>
            </dl>

            <div>
              <label htmlFor="media-link" className="mb-1 block text-xs font-bold text-slate-600">Image link</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="media-link"
                  readOnly
                  value={detail.url}
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(detail.url)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white sm:shrink-0"
                >
                  Copy link
                </button>
              </div>
            </div>

            {/* Where it is used */}
            <div>
              <p className="mb-2 text-xs font-bold text-slate-600">
                {inUse ? `Used in ${detail.usageCount} place${detail.usageCount === 1 ? '' : 's'}` : 'Not used anywhere'}
              </p>
              {inUse ? (
                <ul className="divide-y rounded-xl border">
                  {detail.usage.map((u) => (
                    <li key={`${u.model}-${u.id}-${u.field}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">
                        <b>{usageLabel(u.model)}</b> · {u.title || u.id}
                      </span>
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{u.field}</span>
                    </li>
                  ))}
                  {detail.usageCount > detail.usage.length && (
                    <li className="px-3 py-2 text-xs text-slate-500">…and {detail.usageCount - detail.usage.length} more</li>
                  )}
                </ul>
              ) : (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  This image is not linked from any product, post or form. It is safe to delete.
                </p>
              )}
            </div>

            {isSuperAdmin && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                {inUse ? (
                  <p className="text-sm text-red-800">
                    Delete is blocked while the image is in use. Remove it from the places above first.
                  </p>
                ) : !confirmDelete ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-red-800">Delete this image permanently. This cannot be undone.</p>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700"
                    >
                      Delete permanently
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-red-800">The image will be removed from Cloudinary. This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">
                        Cancel
                      </button>
                      <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                        {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
