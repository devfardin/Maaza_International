'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTasksQuery } from '@/redux/features/apiSlice';
import ReferralsCard from '../ReferralsCard';
import ReferralInfoSection from '../ReferralInfoSection';

// ── Slider images (placeholder — replace with real paths) ────────────────────
const SLIDES = [
  '/slide1.png',
  '/slide2.png',
  '/slide3.png',
];

// ── Info cards ───────────────────────────────────────────────────────────────
const INFO_CARDS = [
  {
    icon: '💵',
    label: 'Weekly Salary',
    value: '৳500 – ৳5,000',
    sub: 'Based on VIP level',
    grad: 'linear-gradient(135deg,#176b43,#22c55e)',
  },
  // {
  //   icon: '💰',
  //   label: 'Monthly Salary',
  //   value: '৳2,000 – ৳20,000',
  //   sub: 'Consistent monthly income',
  //   grad: 'linear-gradient(135deg,#059669,#34d399)',
  // },
  {
    icon: '📋',
    label: 'Rule',
    value: 'Fair & Transparent',
    sub: 'Platform rules apply',
    grad: 'linear-gradient(135deg,#65a30d,#a3e635)',
  },
  // {
  //   icon: '🤝',
  //   label: 'Invitation',
  //   value: 'Earn Referral Bonus',
  //   sub: 'Invite friends & earn',
  //   grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
  // },
];

// ── Task gradient pool ────────────────────────────────────────────────────────
const GRADIENTS = [
  'from-violet-100 to-purple-200',
  'from-amber-100 to-orange-200',
  'from-sky-100 to-teal-200',
  'from-lime-100 to-emerald-200',
];

// ── Video Player ─────────────────────────────────────────────────────────────
function VideoSection() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [started, setStarted] = useState(false);
  const [buffered, setBuffered] = useState(0);

  const resetHide = () => {
    clearTimeout(hideTimer.current);
    setShowControls(true);
    if (playing) hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (!started) setStarted(true);
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); setShowControls(true); }
    resetHide();
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    resetHide();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    resetHide();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const pct = duration ? (progress / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl bg-black aspect-video select-none"
      onMouseMove={resetHide}
      onTouchStart={resetHide}
    >
      <video
        ref={videoRef}
        src="/v1.mp4"
        poster="/promosonal.png"
        className="w-full h-full object-cover"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { setPlaying(false); setShowControls(true); setStarted(false); setProgress(0); }}
        playsInline
      />

      {/* dark vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

      {/* Pre-play overlay */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <button
            onClick={togglePlay}
            className="w-18 h-18 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
            style={{ width: 72, height: 72 }}
          >
            <svg className="w-8 h-8 text-white" style={{ marginLeft: 4 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <span className="text-white/80 text-sm font-semibold tracking-widest uppercase">Business Introduction</span>
        </div>
      )}

      {/* Invisible click-to-toggle (after started) */}
      {started && (
        <button className="absolute inset-0 z-10" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} />
      )}

      {/* Controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-3 pt-10 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
          opacity: showControls || !playing ? 1 : 0,
          pointerEvents: showControls || !playing ? 'auto' : 'none',
        }}
      >
        {/* Progress track */}
        <div
          className="relative w-full h-1 rounded-full mb-3 cursor-pointer group/bar"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={seek}
        >
          {/* Buffered */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${bufPct}%`, background: 'rgba(255,255,255,0.3)' }}
          />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white transition-all"
            style={{ width: `${pct}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Button row */}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-white/70 transition active:scale-90">
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button onClick={toggleMute} className="text-white hover:text-white/70 transition active:scale-90">
            {muted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            )}
          </button>

          <span className="text-white/60 text-xs font-mono">{fmt(progress)} / {fmt(duration)}</span>

          <div className="flex-1" />

          <button onClick={toggleFullscreen} className="text-white hover:text-white/70 transition active:scale-90">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePase({ showPage }) {
  // ── Slider state ─────────────────────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (idx) => { setCurrent(idx); startTimer(); };
  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const router = useRouter();
  const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery();
  const tasks = tasksData?.data ?? [];

  return (
    <div className="space-y-5 pb-4">

      {/* ── SECTION 1 · Image Slider ─────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-slate-200 aspect-[16/7] select-none">

        {/* Slides */}
        {SLIDES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        {/* Fallback gradient when image missing */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-500" />

        {/* Prev arrow */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
          aria-label="Previous slide"
        >
          ‹
        </button>

        {/* Next arrow */}
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── SECTION 1b · Notice Marquee ──────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-hidden rounded-xl bg-harvest-700 px-3 py-2.5">
        <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[11px] font-extrabold text-harvest-700 tracking-wider">
          NOTICE
        </span>
        <div className="overflow-hidden flex-1">
          <p className="animate-marquee whitespace-nowrap text-sm text-white font-medium">
            🎉 Welcome to Maaza International! &nbsp;|&nbsp; Complete daily tasks to earn bonus rewards. &nbsp;|&nbsp; Invite friends and earn referral commissions. &nbsp;|&nbsp; Weekly salary is credited every Monday. &nbsp;|&nbsp; Contact support for any issues.
          </p>
        </div>
      </div>
      {/* ── SECTION 2 · Referral Info ────────────────────────────────────── */}
      <ReferralInfoSection />


      {/* ── SECTION 3 · referal section and socile media handle */}
      <div>
        <h1 className="text-xl font-medium text-white mb-2.5">Invite &amp; Earn</h1>

        {/* Referral link + social share */}
        <ReferralsCard />
      </div>

      {/* ── SECTION 4 · Promotional Banner ──────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl">
        <h1 className="text-xl font-semibold text-white mb-2.5">
          Our Offers
        </h1>
        <img src="/promosonal.png" alt="Promotional Banner" className="w-full object-cover rounded-xl" />
      </div>

      {/* ── SECTION 4 · Business Introduction Video ─────────────────────── */}
      <VideoSection />

      {/* ── SECTION 5 · Task Bonus ───────────────────────────────────────── */}
      <div>
        <div className="mb-3">
          <h2 className="text-xl font-extrabold text-white">Task Bonus</h2>
        </div>

        {/* Loading skeleton */}
        {tasksLoading && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-52 bg-white border rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!tasksLoading && tasks.length === 0 && (
          <p className="text-center text-white/50 text-sm py-8">No tasks available at the moment.</p>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {tasks.map((task, idx) => (
            <article
              key={task._id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* ── Top: icon left + info right ── */}
              <div className="flex gap-4 p-2.5">

                {/* Icon box */}
                <div className={`flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} text-5xl`}>
                  <img src={task?.image} alt={task.title} className="h-full w-full object-fill" />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-base font-extrabold leading-snug text-slate-900 line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                      {task.description}
                    </p>
                  </div>

                  {/* Reward + button */}
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-700">
                        Reward: <span className="text-xl font-extrabold text-harvest-700">৳{task.rewardAmount}</span>
                      </p>
                      {task.taskType && (
                        <p className="text-xs font-normal text-slate-500 mt-0.5">
                          Type: <span className="text-sm font-semibold text-harvest-700 capitalize">{task.taskType}</span>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                      className="shrink-0 rounded-md bg-gradient-to-r from-harvest-700 to-harvest-500 px-4 py-2 text-base font-medium text-white shadow-soft transition duration-200 active:scale-95"
                      style={{ boxShadow: '0 0 0 2px #a3e635' }}
                    >
                      Do Task
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Footer stats strip ── */}
              <div className="grid grid-cols-3 divide-x divide-white/20 bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600 py-3">
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium text-white">Reward</p>
                  <p className="mt-1 text-md font-medium text-white">৳{task.rewardAmount}</p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium text-white">Type</p>
                  <p className="mt-1 text-md font-medium text-white capitalize">{task.rewardType || '—'}</p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium text-white">Status</p>
                  <p className="mt-1 text-md font-medium text-white capitalize">{task.status || 'Active'}</p>
                </div>
              </div>

            </article>
          ))}
        </div>
      </div>

    </div>
  );
}
