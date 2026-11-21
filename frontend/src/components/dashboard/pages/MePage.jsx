'use client';
// src/components/dashboard/pages/MePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// "Me" page — personal hub with team banner, wallet actions, balance stats,
// service shortcuts, and account links.
// Color schema: harvest-700 (#176b43 green), lime-300 accents, white cards.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  useGetMyWalletsQuery,
  useGetMyReferralsQuery,
  useGetIncomeSummaryQuery,
  useGetUserTransactionsQuery,
  useGetDailyCheckinStatusQuery,
} from '@/redux/features/apiSlice';
import { clearAuthCookies } from '@/lib/authCookies';
import { logout } from '@/redux/features/authSlice';
import { useDispatch } from 'react-redux';

// ── Animated border keyframes injected once via a style tag ──────────────────
const BORDER_ANIM_STYLE = `
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0 2px #16a34a, 0 0 10px 2px #16a34a55; }
    50%      { box-shadow: 0 0 0 3px #84cc16, 0 0 18px 5px #84cc1655; }
  }
  .border-anim { animation: borderGlow 2.4s ease-in-out infinite; }
`;

export default function MePage({ showPage }) {
  const dispatch = useDispatch();
  const router   = useRouter();

  // ── Auth / user ────────────────────────────────────────────────────────────
  const user   = useSelector((s) => s.auth.user);
  const userId = user?._id;

  // ── Data fetches ───────────────────────────────────────────────────────────
  const { data: walletData,   isLoading: walletLoading }   = useGetMyWalletsQuery(userId, { skip: !userId });
  const { data: referralData }                              = useGetMyReferralsQuery(undefined, { skip: !userId });
  const { data: incomeData }                                = useGetIncomeSummaryQuery(undefined, { skip: !userId });
  const { data: txData }                                    = useGetUserTransactionsQuery(userId, { skip: !userId });
  const { data: checkinData }                               = useGetDailyCheckinStatusQuery(undefined, { skip: !userId });

  // ── Derived values ─────────────────────────────────────────────────────────
  const rechargeBalance = walletData?.data?.rechargeWallet?.formattedBalance  ?? '0.00';
  const withdrawBalance = walletData?.data?.balanceWallet?.formattedBalance   ?? '0.00';
  const teamEarnings    = (referralData?.data?.totalCommission ?? 0).toFixed(2);
  const totalEarned     = (incomeData?.data?.totalEarned       ?? 0).toFixed(2);
  const todayIncome     = (incomeData?.data?.todayIncome       ?? 0).toFixed(2);
  const checkinBonus    = (checkinData?.bonusAmount            ?? 0).toFixed(2);

  // Total withdrawn = sum of approved withdrawal transactions
  const allTx        = txData?.data ?? [];
  const totalWithdrawn = allTx
    .filter((t) => t.type === 'withdrawal' && t.flow === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0)
    .toFixed(2);

  // ── Active tab state (Services / More) ────────────────────────────────────
  const [tab, setTab] = useState('services');

  // ── Logout ─────────────────────────────────────────────────────────────────
  function handleLogout() {
    dispatch(logout());
    clearAuthCookies();
    router.push('/login');
  }

  // ── Balance stat cards config ──────────────────────────────────────────────
  // Using inline `style` for gradients — Tailwind v4 purges class strings that
  // are dynamically composed at runtime and never appear as full literals.
  const stats = [
    { label: 'Recharge Wallet',     value: `৳${rechargeBalance}`, icon: '💳', grad: 'linear-gradient(135deg,#176b43,#22c55e)' },
    { label: 'Withdraw Wallet',     value: `৳${withdrawBalance}`, icon: '💰', grad: 'linear-gradient(135deg,#059669,#34d399)' },
    { label: 'Total Earnings',      value: `৳${totalEarned}`,     icon: '📈', grad: 'linear-gradient(135deg,#65a30d,#a3e635)' },
    { label: 'Total Withdrawn',     value: `৳${totalWithdrawn}`,  icon: '↗',  grad: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
    { label: 'Team Earnings',       value: `৳${teamEarnings}`,    icon: '👥', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    { label: "Yesterday's Earning", value: `৳${todayIncome}`,     icon: '🌙', grad: 'linear-gradient(135deg,#d97706,#fbbf24)' },
    { label: 'Check-in Bonus',      value: `৳${checkinBonus}`,    icon: '✅', grad: 'linear-gradient(135deg,#e11d48,#fb7185)' },
    { label: 'Total Points',        value: referralData?.data?.total ?? 0, icon: '⭐', grad: 'linear-gradient(135deg,#ea580c,#facc15)' },
  ];

  // ── Service shortcuts (3-column grid) ─────────────────────────────────────
  const services = [
    { page: 'purchased',    icon: '📦', label: 'My Products' },
    { page: 'transactions',         icon: '🏦', label: 'Funding Details' },
    { page: 'tasks',        icon: '🎁', label: 'Redeem Bonus' },
    { page: 'bank',         icon: '💳', label: 'Bank Account' },
    { page: 'tasks',        icon: '📅', label: 'Daily Check-in' },
    { page: 'referrals',    icon: '🤝', label: 'Contract' },
  ];

  return (
    <>
      {/* Inject border-glow animation once */}
      <style>{BORDER_ANIM_STYLE}</style>

      <div className="space-y-4 pb-4">

        {/* ── SECTION 1 · Team Management Banner ──────────────────────────── */}
        {/* Clickable card with a background image; navigates to referrals page */}
        <button
          onClick={() => showPage('referrals')}
          className="border-anim relative w-full overflow-hidden rounded-2xl text-left focus:outline-none"
          aria-label="Go to Team Management"
        >
          {/* Background image — falls back to gradient if image missing */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/team.png')" }}
          />
          {/* Dark overlay for text legibility */}
          <div className="absolute inset-0 bg-black/55" />

          {/* Decorative circles */}
          <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-300/10" />
          <span className="absolute -bottom-8 left-10 h-28 w-28 rounded-full bg-white/5" />

          {/* Content */}
          <div className="relative px-5 py-7 sm:px-8 sm:py-9 text-center">
           
            <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Team Management
            </h2>
            <p className="mt-1.5 max-w-xs text-sm text-white/90">
              Grow your network, track referrals, and earn team commissions together.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-lime-300 px-4 py-2 text-xs font-extrabold text-harvest-900">
              View Team →
            </span>
          </div>
        </button>

        {/* ── SECTION 2 · Wallet Quick Actions ────────────────────────────── */}
        {/* Animated-border card with Recharge + Withdraw buttons side by side */}
        <div className="border-anim rounded-2xl bg-white p-4">
          <p className="mb-3 text-[11px] font-extrabold tracking-widest text-harvest-700">
            WALLET ACTIONS
          </p>
          <div className="grid grid-cols-2 gap-3">

            {/* Recharge button */}
            <button
              onClick={() => showPage('recharge')}
              className="flex items-center gap-3 rounded-xl border-2 border-harvest-100 bg-harvest-50 px-4 py-3.5 transition hover:border-harvest-400 hover:bg-harvest-100 active:scale-95"
            >
              {/* Left: icon */}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-harvest-700 text-xl text-white shadow">
                ＋
              </span>
              {/* Right: label */}
              <span className="text-left">
                <b className="block text-sm font-extrabold text-harvest-900">Recharge</b>
                <small className="text-[11px] text-slate-500">Add funds</small>
              </span>
            </button>

            {/* Withdraw button */}
            <button
              onClick={() => showPage('withdraw')}
              className="flex items-center gap-3 rounded-xl border-2 border-emerald-100 bg-emerald-50 px-4 py-3.5 transition hover:border-emerald-400 hover:bg-emerald-100 active:scale-95"
            >
              {/* Left: icon */}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-xl text-white shadow">
                ↗
              </span>
              {/* Right: label */}
              <span className="text-left">
                <b className="block text-sm font-extrabold text-emerald-900">Withdraw</b>
                <small className="text-[11px] text-slate-500">Cash out</small>
              </span>
            </button>

          </div>
        </div>

        {/* ── SECTION 3 · Balance Stats Grid ──────────────────────────────── */}
        {/* 2-column grid of 8 stat cards, each with gradient background */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon, grad }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl p-4 shadow"
              style={{ background: grad }}
            >
              {/* Decorative circle */}
              <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
              {/* Icon */}
              <span className="relative text-2xl">{icon}</span>
              {/* Value */}
              {walletLoading
                ? <div className="relative mt-2 h-6 w-20 animate-pulse rounded-lg bg-white/30" />
                : <p className="relative mt-1.5 text-lg font-extrabold text-white">{value}</p>
              }
              {/* Label */}
              <p className="relative mt-0.5 text-[11px] font-semibold text-white/80">{label}</p>
            </div>
          ))}
        </div>

        {/* ── SECTION 4 · Tabbed Services ─────────────────────────────────── */}
        <div className="rounded-2xl bg-white overflow-hidden shadow-sm border border-slate-100">

          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {['services', 'more'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-extrabold capitalize transition ${
                  tab === t
                    ? 'border-b-2 border-harvest-700 text-harvest-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'services' ? 'Services' : 'More'}
              </button>
            ))}
          </div>

          {/* Services tab — 3-column icon grid */}
          {tab === 'services' && (
            <div className="grid grid-cols-3 divide-x divide-y divide-slate-100">
              {services.map(({ page, icon, label }) => (
                <button
                  key={label}
                  onClick={() => showPage(page)}
                  className="flex flex-col items-center gap-2 px-2 py-5 transition hover:bg-harvest-50 active:scale-95"
                >
                  {/* Service icon circle */}
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-harvest-50 text-2xl shadow-sm">
                    {icon}
                  </span>
                  <span className="text-center text-[11px] font-bold leading-tight text-slate-700">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* More tab — placeholder for future items */}
          {tab === 'more' && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              More features coming soon.
            </div>
          )}
        </div>

        {/* ── SECTION 5 · Account Links ────────────────────────────────────── */}
        {/* Profile, social channels, and logout */}
        <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">

          {/* My Profile */}
          <AccountRow
            icon="👤"
            label="My Profile"
            sub="Edit your personal details"
            onClick={() => showPage('profile')}
            iconBg="bg-harvest-100"
            iconColor="text-harvest-700"
          />

          {/* Telegram channel */}
          <AccountRow
            icon="✈️"
            label="Telegram Channel"
            sub="Join our official channel"
            href="https://t.me/maazainternational"
            iconBg="bg-sky-100"
            iconColor="text-sky-600"
          />

          {/* WhatsApp group */}
          <AccountRow
            icon="💬"
            label="WhatsApp Group"
            sub="Connect with the community"
            href="https://wa.me/maazainternational"
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />

          {/* Logout — red accent */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 px-5 py-4 transition hover:bg-rose-50 active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-xl text-rose-600">
              ⏻
            </span>
            <span className="flex-1 text-left">
              <b className="block text-sm font-extrabold text-rose-600">Logout</b>
              <small className="text-[11px] text-slate-400">Sign out of your account</small>
            </span>
          </button>

        </div>

      </div>
    </>
  );
}

// ── AccountRow — reusable row for section 5 ──────────────────────────────────
// Renders either a <button> (onClick) or an <a> (href) depending on props.
function AccountRow({ icon, label, sub, onClick, href, iconBg, iconColor }) {
  const inner = (
    <>
      {/* Icon */}
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${iconBg} ${iconColor}`}>
        {icon}
      </span>
      {/* Text */}
      <span className="flex-1 text-left">
        <b className="block text-sm font-extrabold text-slate-800">{label}</b>
        <small className="text-[11px] text-slate-400">{sub}</small>
      </span>
      {/* Chevron */}
      <span className="text-slate-300 text-lg">›</span>
    </>
  );

  const cls = 'flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 active:scale-[0.99]';

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
