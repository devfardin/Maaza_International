'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useGetTaskByIdQuery } from '@/redux/features/apiSlice';

export default function TaskDetailPage({ params }) {
  const { taskId } = use(params);
  const router = useRouter();
  const { data, isLoading, isError } = useGetTaskByIdQuery(taskId);
  const task = data?.data;

  if (isLoading) return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-4 pb-10">
      <div className="h-8 w-32 rounded-xl bg-white/10" />
      <div className="h-64 rounded-2xl bg-white/10" />
      <div className="h-12 rounded-xl bg-white/10" />
      <div className="h-24 rounded-xl bg-white/10" />
    </div>
  );

  if (isError || !task) return (
    <div className="flex flex-col items-center justify-center py-24 text-white/60 gap-3">
      <span className="text-5xl">⚠️</span>
      <p className="text-base font-medium">Task not found.</p>
      <button onClick={() => router.back()} className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition">
        ← Go back
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* ── Back button ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tasks
      </button>

      {/* ── Hero card ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* Image */}
        {task.image && (
          <img
            src={task.image}
            alt={task.title}
            className="w-full block"
          />
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600">
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-xs font-medium text-white/70">Reward</p>
            <p className="mt-0.5 text-base font-extrabold text-white">৳{task.rewardAmount}</p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-xs font-medium text-white/70">Status</p>
            <p className="mt-0.5 text-base font-extrabold text-white capitalize">{task.status || 'Active'}</p>
          </div>
          <div className="flex flex-col items-center py-3 px-2">
            <p className="text-xs font-medium text-white/70">Type</p>
            <p className="mt-0.5 text-base font-extrabold text-white capitalize">{task.rewardType || '—'}</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          {/* Title block */}
        {/* <div className="bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600 px-5 py-4"> */}
          <h1 className="text-xl font-bold text-black/80">{task.title}</h1>
        {/* </div> */}

          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm leading-6 text-slate-600">{task.description}</p>
            </div>
          )}

          {/* Dates */}
          {(task.startsAt || task.endsAt) && (
            <div className="grid grid-cols-2 gap-3">
              {task.startsAt && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Starts</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {new Date(task.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
              {task.endsAt && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ends</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {new Date(task.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {task.instructions && (
            <div className="rounded-xl bg-harvest-50 ring-1 ring-harvest-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-harvest-700 text-white text-sm">📋</span>
                <p className="text-sm font-extrabold text-harvest-800">How to complete</p>
              </div>
              <p className="text-sm leading-6 text-harvest-900/80">{task.instructions}</p>
            </div>
          )}

          {/* Special note */}
          {task.specialNote && (
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400 text-white text-sm">⚠️</span>
                <p className="text-sm font-extrabold text-amber-800">Special Note</p>
              </div>
              <p className="text-sm leading-6 text-amber-900/80">{task.specialNote}</p>
            </div>
          )}

          {/* Reward highlight */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-harvest-900 to-harvest-700 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Task Reward</p>
              <p className="mt-0.5 text-2xl font-extrabold text-white">৳{task.rewardAmount}</p>
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-white/60 capitalize">{task.rewardType || 'Cash'}</span>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-slate-400 leading-5">
            Rewards are subject to eligibility and admin review. Never share private account information.
          </p>
        </div>
      </div>
    </div>
  );
}
