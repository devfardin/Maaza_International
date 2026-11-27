'use client';
// src/components/dashboard/pages/CommunityPage.jsx
// Community feed: every member's posts. Creating a post needs VIP 3 or higher;
// below that the composer is locked and explains how to reach VIP 3.
import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetCommunityPostsQuery,
  useGetMyCommunityPostsQuery,
  useGetPendingCommunityPostsQuery,
  useDecideCommunityPostMutation,
  useCreateCommunityPostMutation,
  useUploadPostImageMutation,
  useLikePostMutation,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { vipLevelOf, vipLabel, COMMUNITY_POST_MIN_VIP } from '@/lib/vip';
import PageTitle from '../PageTitle';

const initialsOf = (name) =>
  name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'M';

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

export default function CommunityPage() {
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;
  const vipLevel = vipLevelOf(user?.membershipLevel);
  // Members need VIP 3+; admins and super admins can always post
  const canPost = user?.role !== 'user' || vipLevel >= COMMUNITY_POST_MIN_VIP;

  const { data: postsData, isLoading } = useGetCommunityPostsQuery();
  // my own posts, including pending ones; the approved feed comes from postsData
  const { data: mineData } = useGetMyCommunityPostsQuery(undefined, { skip: !userId });
  // super admin approval queue
  const isSuper = user?.role === 'super_admin';
  const { data: pendingData } = useGetPendingCommunityPostsQuery(undefined, { skip: !isSuper });
  const [decidePost, { isLoading: deciding }] = useDecideCommunityPostMutation();
  const [createPost, { isLoading: posting }] = useCreateCommunityPostMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadPostImageMutation();
  const [likePost] = useLikePostMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // feed = approved posts + my own pending posts (newest first)
  const approvedPosts = postsData?.data || [];
  const approvedIds = new Set(approvedPosts.map((p) => p._id));
  const myPending = (mineData?.data || []).filter((p) => !approvedIds.has(p._id));
  const posts = [...myPending, ...approvedPosts];
  const queue = pendingData?.data || [];

  async function decide(id, status) {
    try {
      await decidePost({ id, status }).unwrap();
      notify.success(status === 'approved' ? 'Post approved and published.' : 'Post rejected.');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update this post.'));
    }
  }
  const busy = posting || uploading;

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify.error('Please choose an image file.');
    if (file.size > 5 * 1024 * 1024) return notify.error('Image must be 5 MB or smaller.');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (title.trim().length < 2) return notify.error('Title must be at least 2 characters.');
    if (description.trim().length < 5) return notify.error('Description must be at least 5 characters.');
    try {
      let media = [];
      if (imageFile) {
        const up = await uploadImage(imageFile).unwrap();
        media = [{ type: 'image', url: up.data.url }];
      }
      await createPost({ title: title.trim(), description: description.trim(), media }).unwrap();
      setTitle('');
      setDescription('');
      clearImage();
      notify.success(user?.role === 'user' ? 'Post submitted. It will appear after super admin approval.' : 'Post published.');
      setSheetOpen(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Failed to submit post.'));
    }
  }

  // Toggle: the first tap likes, the next tap removes the like
  async function handleLike(postId) {
    try {
      await likePost(postId).unwrap();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update your like.'));
    }
  }

  const composer = (
    <div className="bg-white border rounded-2xl p-5">
      {canPost ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-harvest-100 text-harvest-700 grid place-items-center font-bold">
              {user?.avatar ? <img src={user?.avatar} className='rounded-full' /> : initialsOf(user?.fullName)}
            </div>
            <div>
              <b className="text-sm">{user?.fullName || 'Member'}</b>
              <p className="text-xs text-harvest-700 font-bold">{vipLabel(vipLevel)} · can post</p>
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Post title"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-harvest-500"
          />
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            placeholder="What would you like to share?"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-harvest-500"
          />

          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Selected" className="max-h-56 w-full rounded-xl object-cover" />
              <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold">
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-bold text-slate-500 hover:border-harvest-300 hover:text-harvest-700">
              ＋ Add an image (optional)
              <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
            </label>
          )}

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Be respectful, share content you own, and avoid misleading financial claims. Posts are reviewed by admins.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-harvest-700 py-3.5 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {uploading ? 'Uploading image…' : posting ? 'Submitting…' : 'Submit for approval →'}
          </button>
        </form>
      ) : (
        <div className="text-center py-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">🔒</div>
          <h2 className="mt-4 font-extrabold text-lg">Posting unlocks at VIP {COMMUNITY_POST_MIN_VIP}</h2>
          <p className="mt-2 text-sm text-slate-500">
            You are <b>{vipLabel(vipLevel)}</b>. Reach <b>VIP {COMMUNITY_POST_MIN_VIP}</b> to create community posts.
            You can read and like everyone&apos;s posts in the meantime.
          </p>
          <div className="mt-4 rounded-xl bg-harvest-50 p-3 text-xs text-harvest-800">
            Grow your team with qualified referrals to level up.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageTitle titleKey="Community posts" />

      {/* Super admin: posts from members waiting for approval */}
      {isSuper && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">Waiting for approval</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{queue.length}</span>
          </div>
          {queue.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No posts waiting. Member posts appear here for approval.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {queue.map((p) => (
                <li key={p._id} className="rounded-xl border bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">{p.userId?.fullName || 'Member'} · {new Date(p.createdAt).toLocaleString()}</p>
                  <p className="mt-1 font-extrabold">{p.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{p.description}</p>
                  {p.media?.[0]?.url && <img src={p.media[0].url} alt="" className="mt-2 h-full w-full rounded-lg object-cover" />}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled={deciding} onClick={() => decide(p._id, 'approved')}
                      className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">Approve &amp; publish</button>
                    <button type="button" disabled={deciding} onClick={() => decide(p._id, 'rejected')}
                      className="rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60">Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-5 items-start">
        {/* Desktop: composer as a column. Phones use the notice + sheet below. */}
        <div className="hidden xl:block">{composer}</div>
        <div className="xl:hidden rounded-2xl border border-harvest-100 bg-gradient-to-br from-harvest-50 via-white to-lime-50 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-harvest-900">{canPost ? 'You can write a post now' : `Posting unlocks at VIP ${COMMUNITY_POST_MIN_VIP}`}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {canPost ? 'Share an update with the community.' : `You are ${vipLabel(vipLevel)}. Keep growing your team to unlock posting.`}
            </p>
          </div>
          {canPost && (
            <button type="button" onClick={() => setSheetOpen(true)} className="shrink-0 rounded-xl bg-harvest-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-soft">
              Write
            </button>
          )}
        </div>

        {sheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 backdrop-blur-sm xl:hidden" onClick={() => setSheetOpen(false)}>
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
              {composer}
            </div>
          </div>
        )}

        {/* Feed — every member's posts */}
        <div className="bg-white border-b last:border-b-0 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">All posts</h2>
            <span className="text-xs font-bold text-slate-400">{posts.length} total</span>
          </div>

          {isLoading && <p className="py-6 text-center text-sm text-slate-400">Loading posts…</p>}
          {!isLoading && posts.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No posts yet.</p>
          )}

          <div className="mt-4 space-y-2">
            {posts.map((post) => {
              const author = post.userId;
              const mine = String(author?._id || author) === String(userId);
              const liked = (post.likes || []).some((id) => String(id) === String(userId));
              return (
                <article key={post._id} className="border-b last:border-b-0 p-3">
                  <div className="flex gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">{
                      author?.avatar ? <img src={author?.avatar} className='rounded-full' /> : initialsOf(author?.fullName)
                    }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-sm">{author?.fullName}</b>
                        {author?.role === 'user' || !author?.role ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                            Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-harvest-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
                            </svg>
                            Admin
                          </span>
                        )}
                        {author?.membershipLevel > 1 && (
                          <span className="rounded-md bg-harvest-50 px-1.5 py-0.5 text-[10px] font-bold text-harvest-700">
                            {vipLabel(vipLevelOf(author.membershipLevel))}
                          </span>
                        )}
                        {mine && post.status !== 'approved' && (
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLE[post.status] || ''}`}>
                            {post.status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {post.title && <h3 className="mt-3 font-extrabold">{post.title}</h3>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{post.description}</p>
                  {post.media?.[0]?.url && (
                    <img src={post.media[0].url} alt={post.title || 'Post image'} className="mt-3 h-full w-full rounded-md object-cover" />
                  )}

                  <div className="mt-3 flex justify-between items-center gap-4 text-sm">
                    <span className="text-slate-600 text-sm">{new Date(post.createdAt).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    <button
                      type="button"
                      onClick={() => handleLike(post._id)}
                      className={`font-bold ${liked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                    >
                      {liked ? '♥' : '♡'} {post.likes?.length || 0} Like{post.likes?.length === 1 ? '' : 's'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
