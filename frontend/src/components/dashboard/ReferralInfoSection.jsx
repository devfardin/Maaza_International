'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetSalaryStatusQuery } from '@/redux/features/apiSlice';
import { vipLabel } from '@/lib/vip';

const fmt = (n) => `৳${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// ── Weekly Salary Tab ─────────────────────────────────────────────────────────
function WeeklySalaryTab({ s, isLoading }) {
  const router = useRouter();
  if (isLoading || !s) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        <div className="h-20 bg-white/10 rounded-xl" />
        <div className="h-12 bg-white/10 rounded-xl" />
      </div>
    );
  }

  const schedule = s.schedule ?? [];
  const current  = s.referral?.validReferrals ?? 0;
  const isOpen   = s.window?.state === 'open';
  const segments = schedule.slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      <style>{`
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        .arrow-bounce { animation: arrowBounce 1s ease-in-out infinite; }
      `}</style>

      {/* Current level badge */}
      <div className="flex items-center justify-center gap-2">
        <span
          className="px-3 py-1 rounded-full text-xs font-extrabold tracking-widest text-white"
          style={{ background: 'linear-gradient(135deg,#65a30d,#a3e635)'}}
        >
          {vipLabel(s.vipLevel)}
        </span>
        <span className="text-white/50 text-xs">Your level · {current} referrals</span>
      </div>

      {/* Segmented progress block */}
      <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.07)' }}>

        {/* People count row — above each segment */}
        <div className="flex gap-1 mb-1">
          {segments.map((seg, i) => {
            const segStart = i === 0 ? 0 : segments[i - 1].qualifiedReferrals;
            const done     = current >= seg.qualifiedReferrals;
            const active   = !done && current > segStart;
            return (
              <div key={seg.vipLevel} className="flex-1 text-center">
                <span
                  className="text-[12px] font-bold"
                  style={{ color: done ? '#a3e635' : active ? '#d9f99d' : 'rgba(255,255,255,0.25)' }}
                >
                  👤 {seg.qualifiedReferrals}p
                </span>
              </div>
            );
          })}
        </div>

        {/* Segments row — arrow lives INSIDE the active segment at segFill% */}
        <div className="flex gap-1">
          {segments.map((seg, i) => {
            const segStart = i === 0 ? 0 : segments[i - 1].qualifiedReferrals;
            const segEnd   = seg.qualifiedReferrals;
            const segFill  = current <= segStart ? 0
              : current >= segEnd ? 100
              : Math.round(((current - segStart) / (segEnd - segStart)) * 100);
            const done   = current >= segEnd;
            const active = !done && current > segStart;

            return (
              <div
                key={seg.vipLevel}
                className="flex-1 h-5 rounded-sm overflow-visible relative"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                {/* Filled portion */}
                <div
                  className="h-full rounded-sm transition-all duration-700"
                  style={{
                    width: `${segFill}%`,
                    background: done
                      ? 'linear-gradient(90deg,#65a30d,#a3e635)'
                      : 'linear-gradient(90deg,#84cc16,#bef264)',
                    boxShadow: (done || active) ? '0 0 8px rgba(163,230,53,0.5)' : 'none',
                  }}
                />

                {/* Arrow — only on the active (in-progress) segment, at the fill end */}
                {active && (
                  <div
                    className="arrow-bounce absolute"
                    style={{
                      left:   `calc(${segFill}% - 5px)`,
                      bottom: '100%',
                      marginBottom: 2,
                      width:  0,
                      height: 0,
                      borderLeft:  '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop:   '7px solid #a3e635',
                      filter: 'drop-shadow(0 0 5px #84cc16)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Reward labels below each segment */}
        <div className="flex gap-1 mt-2">
          {segments.map((seg, i) => {
            const done   = current >= seg.qualifiedReferrals;
            const active = !done && current > (i === 0 ? 0 : segments[i - 1].qualifiedReferrals);
            return (
              <div key={seg.vipLevel} className="flex-1 text-center">
                <p
                  className="text-[10px] font-extrabold leading-tight"
                  style={{ color: done ? '#a3e635' : active ? '#d9f99d' : 'rgba(255,255,255,0.35)' }}
                >
                  {fmt(seg.weeklySalary)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim button */}
      <button
        onClick={() => router.push('/dashboard/salary')}
        className="w-full rounded-md py-3.5 text-sm font-extrabold tracking-wide transition active:scale-95"
        style={{
          background: isOpen ? 'linear-gradient(135deg,#65a30d,#a3e635)' : 'rgba(255,255,255,0.10)',
          color:      isOpen ? '#0f2e1a' : 'rgba(255,255,255,0.65)',
          boxShadow:  isOpen ? '0 4px 20px rgba(101,163,13,0.4)' : 'none',
        }}
      >
        {isOpen ? '🎉 Claim Salary Now →' : '📅 View Salary Page →'}
      </button>

      {isOpen && (
        <p className="text-center text-lime-400 text-xs font-bold animate-pulse">
          ⚡ Claim window is open right now!
        </p>
      )}
    </div>
  );
}

// ── Role Tab ──────────────────────────────────────────────────────────────────
function RoleTab({ s, isLoading }) {
  const router = useRouter();
  if (isLoading || !s) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-full" />
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-white/10 rounded" />)}
      </div>
    );
  }

  const schedule = s.schedule ?? [];
  const claimHours = s.window?.claimHours ?? '10:00 AM – 10:00 PM';

  if (schedule.length === 0) {
    return <p className="text-white/30 text-sm text-center py-6">No schedule available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Schedule table */}
      {/* <div className="rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="grid grid-cols-3 px-3 py-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">VIP Level</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-center">Weekly Salary</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Referrals</p>
        </div>
        {schedule.map((row) => {
          const mine = row.vipLevel === s.vipLevel;
          return (
            <div
              key={row.vipLevel}
              className={`grid grid-cols-3 items-center px-3 py-2.5 border-t ${mine ? 'border-lime-400/20' : 'border-white/5'}`}
              style={{ background: mine ? 'rgba(163,230,53,0.08)' : 'transparent' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full grid place-items-center text-[10px] font-extrabold shrink-0"
                  style={{
                    background: mine ? 'linear-gradient(135deg,#65a30d,#a3e635)' : 'rgba(255,255,255,0.08)',
                    color: mine ? '#0f2e1a' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {row.vipLevel}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-extrabold truncate ${mine ? 'text-lime-400' : 'text-white/70'}`}>
                    {vipLabel(row.vipLevel)}
                  </p>
                  {mine && (
                    <span className="text-[9px] bg-lime-400/20 text-lime-400 px-1 py-0.5 rounded-full font-bold">YOU</span>
                  )}
                </div>
              </div>
              <p className={`text-xs font-extrabold text-center ${mine ? 'text-lime-400' : 'text-white/60'}`}>
                {fmt(row.weeklySalary)}
              </p>
              <p className={`text-xs font-bold text-right ${mine ? 'text-lime-300' : 'text-white/40'}`}>
                👤 {row.qualifiedReferrals}
              </p>
            </div>
          );
        })}
      </div> */}

      {/* How to earn */}
      <div className="rounded-md p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm font-bold  tracking-widest text-white/60">How to earn weekly salary</p>
        {[
          { n: '1', icon: '📦', title: 'Buy a product', desc: 'Purchase any product to activate your membership.' },
          { n: '2', icon: '🔗', title: 'Share your referral code', desc: 'Each invitee counts once they deposit and buy a product.' },
          { n: '3', icon: '🏆', title: 'Reach a VIP level', desc: 'Auto-upgraded when your valid referral target is met.' },
          { n: '4', icon: '💵', title: 'Claim every Monday', desc: `Window: ${claimHours} (BD time). Must claim manually.` },
        ].map(({ n, icon, title, desc }) => (
          <div key={n} className="flex items-start gap-2.5">
            <span
              className="w-5 h-5 rounded-full grid place-items-center text-xs font-extrabold shrink-0 mt-0.5"
              style={{ background: 'rgba(163,230,53,0.15)', color: '#a3e635' }}
            >
              {n}
            </span>
            <div>
              <p className="text-sm font-extrabold text-white/80">{icon} {title}</p>
              <p className="text-xs text-white/50 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How to claim */}
      <div className="rounded-md p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm font-bold  tracking-widest text-white/60">How to claim</p>

        {/* 3 info pills */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: '📅', label: 'When', value: 'Every Monday' },
            { icon: '⏱️', label: 'Duration', value: '12 hours' },
            { icon: '✅', label: 'How', value: 'One tap' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="rounded-md px-2 py-2 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-base">{icon}</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wide font-bold mt-0.5">{label}</p>
              <p className="text-xs font-extrabold text-white/70 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="rounded-md px-3 py-2 flex gap-2 items-start" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <span className="text-sm shrink-0">⚠️</span>
          <p className="text-sm text-yellow-300/70 leading-snug">
            Unclaimed salary is <span className="font-extrabold text-yellow-300">permanently lost</span> after the window closes. It does not carry over.
          </p>
        </div>

        {/* Steps */}
        {[
          'Open the salary page on Monday during the claim window.',
          'Check the countdown — see how much time is left.',
          'Tap the Claim button. Salary lands in your wallet instantly.',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="w-4 h-4 rounded-full grid place-items-center text-[10px] font-extrabold shrink-0 mt-0.5"
              style={{ background: 'rgba(163,230,53,0.12)', color: '#a3e635' }}
            >
              {i + 1}
            </span>
            <p className="text-sm text-white/60 leading-snug">{text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push('/dashboard/salary')}
        className="w-full rounded-md py-3 text-sm font-extrabold tracking-wide transition active:scale-95"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
      >
        📄 View Full Salary Page →
      </button>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ReferralInfoSection() {
  const [tab, setTab] = useState('salary');
  const { data, isLoading } = useGetSalaryStatusQuery();
  const s = data?.data;

  const TABS = [
    { id: 'salary', label: '💵 Weekly Salary' },
    { id: 'role', label: '📋 Role' },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(160deg,#0d2818,#1a4a2a)' }}>
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-extrabold tracking-wide transition-all ${
              tab === id
                ? 'text-white border-b-2 border-lime-400 bg-white/5'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === 'salary' && <WeeklySalaryTab s={s} isLoading={isLoading} />}
        {tab === 'role'   && <RoleTab s={s} isLoading={isLoading} />}
      </div>
    </div>
  );
}
