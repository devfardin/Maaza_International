'use client';
// Admin / super admin: News & Updates — list, create, edit, publish and delete posts.
import { useState } from 'react';
import {
  useGetAdminNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} from '@/redux/features/apiSlice';
import NewsForm from '@/components/admin/NewsForm';
import { notify, getErrorMessage } from '@/lib/toast';
import { postFormat } from '@/lib/news';

const STATUS = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-BD', { dateStyle: 'medium' }) : '—');

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-4xl sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl border">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function NewsAdmin() {
  const [sheet, setSheet] = useState(null); // null | { mode: 'create' } | { mode: 'edit', post }

  const { data, isLoading, isError } = useGetAdminNewsQuery();
  const [createNews, { isLoading: creating }] = useCreateNewsMutation();
  const [updateNews, { isLoading: updating }] = useUpdateNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();

  const posts = data?.data ?? [];
  const busy = creating || updating;

  async function handleSubmit({ data: body, file }) {
    try {
      if (sheet.mode === 'create') await createNews({ data: body, file }).unwrap();
      else await updateNews({ id: sheet.post._id, data: body, file }).unwrap();
      notify.success(sheet.mode === 'create' ? 'News post created.' : 'News post saved.');
      setSheet(null);
    } catch (err) {
      const first = err?.data?.errorSources?.[0];
      notify.error(first?.path ? `${first.path}: ${first.message}` : getErrorMessage(err, 'Could not save the post.'));
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}"? Members will no longer see it.`)) return;
    try {
      await deleteNews(post._id).unwrap();
      notify.success('News post deleted.');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not delete the post.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-blue-700">NEWS &amp; UPDATES</p>
          <h1 className="mt-1 text-2xl font-extrabold">Posts for members</h1>
          <p className="text-sm text-slate-500">Write announcements with your own HTML and CSS design. Drafts stay hidden.</p>
        </div>
        <button
          onClick={() => setSheet({ mode: 'create' })}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
        >
          + New post
        </button>
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-2xl border bg-white" />}
      {isError && <p className="text-sm text-rose-600">Could not load posts.</p>}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">
          No posts yet. Click “New post” to write the first one.
        </div>
      )}

      {posts.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Notice type</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-t">
                  <td className="px-4 py-3 font-bold text-slate-800">{post.title}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{post.tag}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{postFormat(post) === 'html' ? 'HTML + CSS' : 'Text editor'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS[post.status] || STATUS.draft}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(post.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSheet({ mode: 'edit', post })} className="rounded-lg border px-3 py-1.5 text-xs font-bold">Edit</button>
                      <button onClick={() => handleDelete(post)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sheet && (
        <Sheet title={sheet.mode === 'create' ? 'New news post' : 'Edit news post'} onClose={() => setSheet(null)}>
          <NewsForm
            key={sheet.post?._id ?? 'new'}
            mode={sheet.mode}
            post={sheet.post}
            onSubmit={handleSubmit}
            onCancel={() => setSheet(null)}
            submitting={busy}
          />
        </Sheet>
      )}
    </div>
  );
}
