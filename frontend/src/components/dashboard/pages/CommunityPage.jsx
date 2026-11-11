'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useLikePostMutation,
} from '@/redux/features/apiSlice';

export default function CommunityPage({ showToast }) {
  const user     = useSelector((s) => s.auth.user);
  const [postText, setPostText] = useState('');

  const { data: postsData, isLoading } = useGetCommunityPostsQuery();
  const [createPost, { isLoading: posting }] = useCreateCommunityPostMutation();
  const [likePost] = useLikePostMutation();

  const posts = postsData?.data || [];

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  async function handleSubmit() {
    if (!postText.trim()) return showToast('Write something before posting.');
    try {
      await createPost({ content: postText }).unwrap();
      setPostText('');
      showToast('Post submitted for admin approval.');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to submit post.');
    }
  }

  async function handleLike(postId) {
    try {
      await likePost(postId).unwrap();
    } catch {
      showToast('Could not like post.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Community</h1>
          <p className="text-sm text-slate-500 mt-1">Share helpful updates with members.</p>
        </div>
        <button
          onClick={() => document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth' })}
          className="rounded-xl bg-harvest-700 text-white px-4 py-3 text-sm font-bold"
        >
          ＋ Create a post
        </button>
      </div>

      <div className="grid xl:grid-cols-[.85fr_1.15fr] gap-5">
        {/* Post composer */}
        <div id="composer" className="bg-white border rounded-2xl p-5 h-fit">
          <h2 className="font-extrabold text-lg">Create a community post</h2>
          <p className="text-sm text-slate-500 mt-1">Posts are reviewed by admins before publishing.</p>

          <div className="flex items-center gap-3 mt-5">
            <div className="w-10 h-10 rounded-full bg-harvest-100 text-harvest-700 grid place-items-center font-bold">{initials}</div>
            <div>
              <b className="text-sm">{user?.fullName || 'Member'}</b>
              <p className="text-xs text-slate-500">Posting as a member</p>
            </div>
          </div>

          <textarea
            rows={4}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What would you like to share?"
            className="w-full mt-4 border rounded-xl p-3 text-sm"
          />

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 text-xs text-amber-900 leading-5">
            Be respectful, post content you own or have permission to share, and avoid misleading financial claims.
          </div>

          <button
            onClick={handleSubmit}
            disabled={posting}
            className="mt-4 w-full rounded-xl bg-harvest-700 text-white py-3.5 text-sm font-extrabold disabled:opacity-60"
          >
            {posting ? 'Submitting…' : 'Submit for admin approval →'}
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          <div className="bg-white border rounded-2xl p-5">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Community feed</h2>
              <span className="text-xs text-emerald-700 font-bold">Latest</span>
            </div>

            {isLoading && <p className="text-sm text-slate-400 py-4 text-center">Loading posts…</p>}

            {!isLoading && posts.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No posts yet. Be the first to share!</p>
            )}

            {posts.map((post) => {
              const authorInitials = post.userId?.fullName
                ? post.userId.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'M';
              return (
                <article key={post._id} className="mt-4 pt-4 border-t">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700 shrink-0">
                      {authorInitials}
                    </div>
                    <div className="flex-1">
                      <b className="text-sm">{post.userId?.fullName || 'Member'}</b>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(post.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm leading-6 text-slate-600 mt-3">{post.content}</p>
                      {post.image && (
                        <img src={post.image} alt="Post" className="mt-3 max-h-56 rounded-xl w-full object-cover" />
                      )}
                      <div className="flex gap-5 text-xs text-slate-500 mt-3">
                        <button onClick={() => handleLike(post._id)}>
                          ♡ {post.likes?.length || 0} Like
                        </button>
                      </div>
                    </div>
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
