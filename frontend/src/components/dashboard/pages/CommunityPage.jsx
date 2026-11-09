'use client';
import { useState, useRef } from 'react';

// Community page — users can create posts (pending admin approval) and view the feed

export default function CommunityPage({ showToast }) {
  const [postText, setPostText]     = useState('');
  const [photoName, setPhotoName]   = useState('');
  const [videoName, setVideoName]   = useState('');
  const [pendingPosts, setPendingPosts] = useState([]);
  const photoRef = useRef();
  const videoRef = useRef();

  function handleSubmit() {
    if (!postText.trim() && !photoName && !videoName)
      return showToast('Add text, a photo or a video first.');

    // Add new pending post to the top of the list
    setPendingPosts(prev => [{
      id: Date.now(),
      text: postText || 'Media attachment submitted for review.',
      photo: photoRef.current?.files?.[0] ? URL.createObjectURL(photoRef.current.files[0]) : null,
      video: videoName,
    }, ...prev]);

    // Reset form
    setPostText('');
    setPhotoName('');
    setVideoName('');
    if (photoRef.current) photoRef.current.value = '';
    if (videoRef.current) videoRef.current.value = '';
    showToast('Post added to pending review.');
  }

  return (
    <div>
      {/* Page heading */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Community</h1>
          <p className="text-sm text-slate-500 mt-1">Share helpful updates, photos and videos with members.</p>
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

          {/* Author row */}
          <div className="flex items-center gap-3 mt-5">
            <div className="w-10 h-10 rounded-full bg-harvest-100 text-harvest-700 grid place-items-center font-bold">FA</div>
            <div>
              <b className="text-sm">Fardin Ahmed</b>
              <p className="text-xs text-slate-500">Posting as a member</p>
            </div>
          </div>

          <textarea
            rows={4}
            value={postText}
            onChange={e => setPostText(e.target.value)}
            placeholder="What would you like to share?"
            className="w-full mt-4 border rounded-xl p-3 text-sm"
          />

          {/* File attach buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <label className="cursor-pointer border rounded-xl px-3 py-3 text-sm font-bold">
              ▧ Add photo
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => setPhotoName(e.target.files?.[0]?.name || '')} />
            </label>
            <label className="cursor-pointer border rounded-xl px-3 py-3 text-sm font-bold">
              ▶ Add video
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoName(e.target.files?.[0]?.name || '')} />
            </label>
          </div>
          {photoName && <p className="text-xs text-slate-500 mt-2">{photoName}</p>}
          {videoName && <p className="text-xs text-slate-500">{videoName}</p>}

          {/* Community guidelines reminder */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 text-xs text-amber-900 leading-5">
            Be respectful, post content you own or have permission to share, and avoid misleading financial claims.
          </div>

          <button onClick={handleSubmit} className="mt-4 w-full rounded-xl bg-harvest-700 text-white py-3.5 text-sm font-extrabold">
            Submit for admin approval →
          </button>
        </div>

        {/* Feed */}
        <div>
          <div className="bg-white border rounded-2xl p-5">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Community feed</h2>
              <span className="text-xs text-emerald-700 font-bold">Latest</span>
            </div>

            {/* Static sample post */}
            <article className="mt-4 pt-4 border-t">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 grid place-items-center font-bold text-sky-700">HM</div>
                <div className="flex-1">
                  <b className="text-sm">Maaza International Member</b>
                  <p className="text-xs text-slate-500 mt-1">Community member · 2 hours ago</p>
                  <p className="text-sm leading-6 text-slate-600 mt-3">Happy to be part of the community! Looking forward to learning more about the platform and its updates.</p>
                  <div className="h-36 rounded-xl bg-gradient-to-br from-harvest-50 to-lime-100 mt-3 grid place-items-center text-5xl">🌱</div>
                  <div className="flex gap-5 text-xs text-slate-500 mt-3">
                    <button onClick={() => showToast('Thanks for your reaction!')}>♡ Like</button>
                    <button onClick={() => showToast('Comments can be enabled in the backend.')}>▢ Comment</button>
                    <button onClick={() => showToast('Share action will be connected.')}>↗ Share</button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* User's pending posts appear here */}
          <div className="space-y-3 mt-3">
            {pendingPosts.map(post => (
              <article key={post.id} className="bg-white border border-amber-200 rounded-2xl p-4">
                <b className="text-sm block">Your post · Pending approval</b>
                <span className="inline-block mt-2 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-bold">PENDING REVIEW</span>
                <p className="text-sm text-slate-600 leading-6 mt-3">{post.text}</p>
                {post.photo && <img src={post.photo} alt="Post attachment" className="mt-3 max-h-56 rounded-xl" />}
                {post.video && <p className="text-xs mt-2 text-slate-500">Selected video: {post.video}</p>}
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
