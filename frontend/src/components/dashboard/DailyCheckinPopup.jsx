'use client';
// ─────────────────────────────────────────────────────────────────────────────
// DailyCheckinPopup — shown once per day to a member who has NOT checked in yet.
// Lists each membership level with its reward per day, marks the member's
// current level, and ends with the "Daily checking" button.
// Closing it (or checking in) hides it until the next day.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetDailyCheckinStatusQuery,
  useDailyCheckinMutation,
  useGetVipLevelsQuery,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';

const todayKey = () => new Date().toISOString().slice(0, 10); // UTC, same day the backend uses
const bdt = (amount) => `৳ ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function DailyCheckinPopup() {
  const userId = useSelector((s) => s.auth.user?._id);
  const { data: statusData } = useGetDailyCheckinStatusQuery(undefined, { skip: !userId });
  const { data: levelsData } = useGetVipLevelsQuery(undefined, { skip: !userId });
  const [checkin, { isLoading: saving }] = useDailyCheckinMutation();
  // Key for "already seen today" — set when the popup is closed
  const [closedKey, setClosedKey] = useState(null);

  const status = statusData?.data;
  const storageKey = userId ? `checkinPopup:${userId}:${todayKey()}` : null;

  // Open once per day, only while today's bonus is still unclaimed
  const seenToday = typeof window !== 'undefined' && storageKey && localStorage.getItem(storageKey) === 'seen';
  const open = !!storageKey && !!status && !status.checkedInToday && !seenToday && closedKey !== storageKey;

  if (!open) return null;

  const currentVip = status?.vipLevel ?? 0;
  const levels = [
    ...(levelsData?.data ?? []).map((l) => ({
      vip: l.level,
      label: `VIP ${l.level}`,
      requirement: l.qualifiedReferrals,
      reward: l.dailyCheckinBonus,
    })),
  ];

  function close() {
    if (storageKey) localStorage.setItem(storageKey, 'seen');
    setClosedKey(storageKey);
  }

  async function handleCheckin() {
    try {
      const res = await checkin().unwrap();
      notify.success(`Checked in! ${bdt(res?.data?.amount)} added to your balance.`);
      close();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not check in right now.'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 p-6 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            ✕
          </button>
          <p className="text-xs font-extrabold tracking-widest text-lime-200">DAILY CHECK-IN</p>
          <h2 className="mt-1 text-xl font-extrabold">Your reward is waiting</h2>
          <p className="mt-1 text-sm text-white/80">
            You are <b className="text-white">VIP {currentVip}</b>. Check in today to collect your bonus.
          </p>
        </div>

        {/* Level table */}
        <div className="p-5">
          <div className="grid grid-cols-[1fr_auto] gap-2 px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <span>Membership level</span>
            <span className="text-right">Reward per day</span>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {levels.map((row) => {
              const isCurrent = row.vip === currentVip;
              return (
                <div
                  key={row.vip}
                  className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border px-4 py-3 ${
                    isCurrent ? 'border-harvest-500 bg-harvest-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-800">{row.label}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-harvest-700 px-2 py-0.5 text-[10px] font-bold text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.requirement > 0 ? `${row.requirement} qualified referrals` : 'Starting level'}
                    </p>
                  </div>
                  <span className={`text-right text-sm font-extrabold ${isCurrent ? 'text-harvest-700' : 'text-slate-700'}`}>
                    {bdt(row.reward)}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCheckin}
            disabled={saving}
            className="mt-5 w-full rounded-md bg-lime-300 py-3.5 text-sm font-extrabold text-harvest-900 shadow-soft transition hover:bg-lime-200 disabled:opacity-60"
          >
            {saving ? 'Checking in…' : 'Daily checking'}
          </button>
        </div>
      </div>
    </div>
  );
}
