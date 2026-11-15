'use client';
// Create / edit a News & Updates post. Two formats, chosen first:
//   • Text editor post — title, notice image, notice type, published date, short + long description
//   • HTML + CSS design — title, notice type, published date, and your own HTML and CSS
//     (only the design is shown on the post page)
import { useEffect, useMemo, useState } from 'react';
import NewsContent from '@/components/shared/NewsContent';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { NOTICE_TYPES, postFormat, toDateInput } from '@/lib/news';

const WIDTHS = [
  { key: 'phone', label: 'Phone', px: 375 },
  { key: 'tablet', label: 'Tablet', px: 768 },
  { key: 'desktop', label: 'Desktop', px: null },
];

const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
const label = 'mb-1 block text-xs font-bold text-slate-600';

const FORMATS = [
  { key: 'text', title: 'Text editor post', desc: 'Notice image, short and long description written in the editor' },
  { key: 'html', title: 'HTML + CSS design', desc: 'Your own HTML and CSS. Only the design is shown on the post page' },
];

const STARTER_HTML = `<section class="hero">
  <p class="eyebrow">Maaza International</p>
  <h1>Your headline here</h1>
  <p>Write the story. Add images, lists and links.</p>
  <div class="card">
    <h2>Key points</h2>
    <ul>
      <li>First point</li>
      <li>Second point</li>
    </ul>
  </div>
</section>`;

const STARTER_CSS = `.hero { padding: 24px 20px; border-radius: 20px;
  background: linear-gradient(135deg, #365314, #65a30d); color: #fff; }
.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; opacity: .8; margin: 0; }
.hero h1 { font-size: 28px; margin: 8px 0; }
.card { margin-top: 16px; padding: 18px; border-radius: 16px; background: #f7fee7; color: #1e293b; }
.card h2 { font-size: 18px; margin: 0 0 8px; }
@media (min-width: 768px) { .hero { padding: 40px; } .hero h1 { font-size: 40px; } }`;

export default function NewsForm({ mode = 'create', post, onSubmit, onCancel, submitting, error }) {
  const [format, setFormat] = useState(post ? postFormat(post) : 'text');
  const [f, setF] = useState({
    title: post?.title ?? '',
    tag: post?.tag ?? 'UPDATE',
    status: post?.status ?? 'draft',
    publishedDate: toDateInput(post?.publishedAt),
    summary: post?.summary ?? '',
    longDescription: post?.longDescription ?? '',
    htmlContent: post?.htmlContent ?? '',
    cssContent: post?.cssContent ?? '',
  });
  const [file, setFile] = useState(null);
  const [previewKey, setPreviewKey] = useState('phone');
  const [localError, setLocalError] = useState('');

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  // preview of a newly chosen cover image
  const coverPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => coverPreview && URL.revokeObjectURL(coverPreview), [coverPreview]);

  const width = WIDTHS.find((w) => w.key === previewKey)?.px ?? null;

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (f.title.trim().length < 3) return setLocalError('Title must be at least 3 characters.');
    if (format === 'text' && !f.summary.trim()) return setLocalError('Please write a short description.');
    if (format === 'html' && !f.htmlContent.trim()) return setLocalError('Please write the HTML for the design.');

    onSubmit({
      data: {
        title: f.title.trim(),
        format,
        tag: f.tag,
        status: f.status,
        // published date at noon local time, so the day never shifts
        publishedAt: f.publishedDate ? new Date(`${f.publishedDate}T12:00:00`).toISOString() : undefined,
        summary: f.summary.trim(),
        // only the fields of the chosen format are sent
        longDescription: format === 'text' ? f.longDescription : '',
        htmlContent: format === 'html' ? f.htmlContent : '',
        cssContent: format === 'html' ? f.cssContent : '',
      },
      file,
    });
  }

  const currentCover = coverPreview || post?.coverImage;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1 · Format */}
      <section>
        <p className={label}>Post format</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFormat(opt.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                format === opt.key ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-extrabold text-slate-900">{opt.title}</p>
              <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 2 · Common details */}
      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>Title</span>
          <input required minLength={3} maxLength={160} value={f.title} onChange={set('title')} className={field} placeholder="Post title" />
        </label>
        <label className="block">
          <span className={label}>Notice type</span>
          <select value={f.tag} onChange={set('tag')} className={field}>
            {NOTICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={label}>Published date</span>
          <input type="date" value={f.publishedDate} onChange={set('publishedDate')} className={field} />
        </label>
        <label className="block">
          <span className={label}>Status</span>
          <select value={f.status} onChange={set('status')} className={field}>
            <option value="draft">Draft (hidden from members)</option>
            <option value="published">Published (visible to members)</option>
          </select>
        </label>
        <div className="block">
          <span className={label}>Notice image {mode === 'edit' && post?.coverImage ? '(empty = keep current)' : ''}</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            {currentCover && (
              <img src={currentCover} alt="" className="h-20 w-28 shrink-0 rounded-xl border bg-slate-50 object-contain" />
            )}
          </div>
        </div>
        <label className="block sm:col-span-2">
          <span className={label}>Short description (shown on the card)</span>
          <textarea rows={2} maxLength={400} value={f.summary} onChange={set('summary')} className={field} />
        </label>
      </section>

      {/* 3a · Text editor format */}
      {format === 'text' && (
        <section className="space-y-2">
          <p className={label}>Long description</p>
          <RichTextEditor value={f.longDescription} onChange={(html) => setF((p) => ({ ...p, longDescription: html }))} placeholder="Write the full notice…" />
        </section>
      )}

      {/* 3b · HTML + CSS format */}
      {format === 'html' && (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-slate-600">DESIGN · HTML + CSS</p>
              <button
                type="button"
                onClick={() => setF((p) => ({ ...p, htmlContent: STARTER_HTML, cssContent: STARTER_CSS }))}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Insert starter design
              </button>
            </div>
            <label className="block">
              <span className={label}>HTML</span>
              <textarea rows={10} value={f.htmlContent} onChange={set('htmlContent')} spellCheck={false} className={`${field} font-mono text-xs leading-5`} placeholder="<section><h1>Title</h1><p>Body text…</p></section>" />
            </label>
            <label className="block">
              <span className={label}>CSS</span>
              <textarea rows={8} value={f.cssContent} onChange={set('cssContent')} spellCheck={false} className={`${field} font-mono text-xs leading-5`} placeholder=".card { padding: 16px; border-radius: 16px; }" />
            </label>
            <p className="text-[11px] text-slate-400">Scripts are removed on save. The design is isolated from the rest of the site.</p>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-slate-600">LIVE PREVIEW</p>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {WIDTHS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setPreviewKey(w.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${previewKey === w.key ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto overflow-hidden rounded-2xl border bg-slate-50 p-3" style={{ maxWidth: width ?? '100%' }}>
              <div className="overflow-hidden rounded-xl bg-white p-3 sm:p-5">
                {f.htmlContent || f.cssContent
                  ? <NewsContent html={f.htmlContent} css={f.cssContent} minHeight={120} />
                  : <p className="py-10 text-center text-sm text-slate-400">Write HTML or insert the starter design to see the preview.</p>}
              </div>
            </div>
          </section>
        </>
      )}

      {(localError || error) && <p className="text-sm font-semibold text-rose-600">{localError || error}</p>}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="rounded-xl border px-5 py-3 text-sm font-bold">Cancel</button>
        <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create post' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
