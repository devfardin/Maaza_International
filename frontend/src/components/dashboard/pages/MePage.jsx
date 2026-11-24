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
import DailyCheckinPopup from '@/components/dashboard/DailyCheckinPopup';

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
  const router = useRouter();

  // ── Auth / user ────────────────────────────────────────────────────────────
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;

  // ── Data fetches ───────────────────────────────────────────────────────────
  const { data: walletData, isLoading: walletLoading } = useGetMyWalletsQuery(userId, { skip: !userId });
  const { data: referralData } = useGetMyReferralsQuery(undefined, { skip: !userId });
  const { data: incomeData } = useGetIncomeSummaryQuery(undefined, { skip: !userId });
  const { data: txData } = useGetUserTransactionsQuery(userId, { skip: !userId });
  const { data: checkinData } = useGetDailyCheckinStatusQuery(undefined, { skip: !userId });

  // ── Derived values ─────────────────────────────────────────────────────────
  const rechargeBalance = walletData?.data?.rechargeWallet?.formattedBalance ?? '0.00';
  const withdrawBalance = walletData?.data?.balanceWallet?.formattedBalance ?? '0.00';
  const teamEarnings = (referralData?.data?.totalCommission ?? 0).toFixed(2);
  const totalEarned = (incomeData?.data?.totalEarned ?? 0).toFixed(2);
  const todayIncome = (incomeData?.data?.todayIncome ?? 0).toFixed(2);

  const checkinBonus = (checkinData?.data?.todayAmount ?? 0).toFixed(2);

  // Total withdrawn = sum of approved withdrawal transactions
  const allTx = txData?.data ?? [];

  // Total accumulated check-in bonus = sum of all daily_checkin credit transactions
  const totalCheckinBonus = allTx
    .filter((t) => t.type === 'daily_checkin' && t.flow === 'credit')
    .reduce((s, t) => s + Number(t.amount), 0)
    .toFixed(2);
  const totalWithdrawn = allTx
    .filter((t) => t.type === 'withdrawal' && t.flow === 'debit')
    .reduce((s, t) => s + Number(t.amount), 0)
    .toFixed(2);

  // ── Active tab state (Services / More) ────────────────────────────────────
  const [tab, setTab] = useState('services');

  // ── Daily check-in popup opened manually from Services ────────────────────
  const [checkinOpen, setCheckinOpen] = useState(false);

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
    { label: 'Recharge Wallet', value: `৳${rechargeBalance}`, icon: '💳', grad: 'linear-gradient(135deg,#176b43,#22c55e)' },
    { label: 'Withdraw Wallet', value: `৳${withdrawBalance}`, icon: '💰', grad: 'linear-gradient(135deg,#059669,#34d399)' },
    { label: 'Total Earnings', value: `৳${totalEarned}`, icon: '📈', grad: 'linear-gradient(135deg,#65a30d,#a3e635)' },
    { label: 'Total Withdrawn', value: `৳${totalWithdrawn}`, icon: '↗', grad: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
    { label: 'Today Earning', value: `৳${todayIncome}`, icon: '👥', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    { label: 'Team Earnings', value: `৳${teamEarnings}`, icon: '👥', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    { label: 'Total Check-in', value: `৳${totalCheckinBonus}`, icon: '✅', grad: 'linear-gradient(135deg,#e11d48,#fb7185)' },
    { label: 'Total Points', value: referralData?.data?.total ?? 0, icon: '⭐', grad: 'linear-gradient(135deg,#ea580c,#facc15)' },
  ];

  // ── Service shortcuts (3-column grid) ─────────────────────────────────────
  const services = [
    { page: 'purchased', icon: '📦', label: 'My Products' },
    { page: 'transactions', icon: '🏦', label: 'Funding Details' },
    { page: 'tasks', icon: '🎁', label: 'Redeem Bonus' },
    { page: 'bank', icon: '💳', label: 'Bank Account' },
    { page: 'checkin', icon: '📅', label: 'Daily Check-in' },
    { page: 'referrals', icon: '🤝', label: 'Contract' },
  ];

  return (
    <>
      {/* Inject border-glow animation once */}
      <style>{BORDER_ANIM_STYLE}</style>

      {/* Auto-opens once per day when today's check-in bonus is unclaimed */}
      <DailyCheckinPopup />
      {/* Opened by the Services "Daily Check-in" item */}
      {checkinOpen && <DailyCheckinPopup manual onClose={() => setCheckinOpen(false)} />}

      <div className="space-y-4 pb-4">

        {/* ── SECTION 1 · Team Management Banner ──────────────────────────── */}
        {/* Clickable card with a background image; navigates to referrals page */}
        <button
          onClick={() => showPage('referrals')}
          className="border-anim relative w-full overflow-hidden rounded-xl text-left focus:outline-none"
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
          <div className="relative px-5 py-7 sm:px-10 sm:py-12 text-center">

            <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              Team Management
            </h2>
            {/* <p className="mt-1.5 max-w-xs text-sm text-white/90">
              Grow your network, track referrals, and earn team commissions together.
            </p> */}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-lime-300 px-4 py-2 text-xs font-extrabold text-harvest-900">
              View Team →
            </span>
          </div>
        </button>

        {/* ── SECTION 2 · Wallet Quick Actions ────────────────────────────── */}
        {/* Animated-border card with Recharge + Withdraw buttons side by side */}
        <div className="border-anim rounded-xl bg-white p-4">
          <p className="mb-3 text-[11px] font-extrabold tracking-widest text-harvest-700">
            WALLET ACTIONS
          </p>
          <div className="grid grid-cols-2 gap-3">

            {/* Recharge button */}
            <button
              onClick={() => showPage('recharge')}
              className="flex items-center gap-3 rounded-md border-2 border-harvest-100 bg-harvest-50 px-4 py-3.5 transition hover:border-harvest-400 hover:bg-harvest-100 active:scale-95"
            >
              {/* Left: icon */}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-harvest-700 text-xl text-white shadow">
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
              className="flex items-center gap-3 rounded-md border-2 border-emerald-100 bg-emerald-50 px-4 py-3.5 transition hover:border-emerald-400 hover:bg-emerald-100 active:scale-95"
            >
              {/* Left: icon */}
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-600 text-xl text-white shadow">
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
              className="relative overflow-hidden rounded-md p-4"
              style={{ background: grad }}
            >
              {/* Decorative circle */}
              <span className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" />
              {/* Icon */}
              <div className="flex align-middle gap-2 items-center">
                {/* <span className="relative text-2xl">{icon}</span> */}
                {/* Label */}
                <p className="relative mt-0.5 text-base font-medium text-white/80">{label}</p>
              </div>
              {/* Value */}
              {walletLoading
                ? <div className="relative mt-2 h-6 w-20 animate-pulse rounded-lg bg-white/30" />
                : <p className="relative mt-1.5 text-lg font-extrabold text-white">{value}</p>
              }


            </div>
          ))}
        </div>

        {/* ── SECTION 4 · Tabbed Services ─────────────────────────────────── */}
        <div className="rounded-xl bg-white overflow-hidden shadow-sm border border-slate-100">

          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {['services', 'more'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-extrabold capitalize transition ${tab === t
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
                  onClick={() => (page === 'checkin' ? setCheckinOpen(true) : showPage(page))}
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
        <div className="rounded-xl bg-white border border-slate-100 overflow-hidden shadow-sm">

          {/* User profile header */}
          <button
            onClick={() => showPage('profile')}
            className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 transition hover:bg-harvest-50 active:scale-[0.99]"
          >
            {/* Avatar */}
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-harvest-700 text-lg font-extrabold text-white shadow">
              {user?.avatar
                ? <img src={user.avatar} alt={user?.name} className="h-full w-full rounded-full object-cover" />
                : user?.name?.charAt(0).toUpperCase() ?? '?'
              }

            </span>
            {/* Name + email */}
            <span className="flex-1 text-left">
              <b className="block text-sm font-extrabold text-slate-800">{user?.name ?? 'My Profile'}</b>
              <small className="text-[11px] text-slate-400">Edit your personal details</small>
            </span>
            <span className="text-slate-300 text-lg">›</span>
          </button>

          {/* Telegram channel */}
          <AccountRow
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            }
            label="Telegram Channel"
            sub="Join our official channel"
            href="https://t.me/maazainternational"
            iconBg="bg-sky-100"
            iconColor="text-sky-500"
          />

          {/* WhatsApp group */}
          <AccountRow
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            }
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
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${typeof icon === 'string' ? 'text-xl' : ''} ${iconBg} ${iconColor}`}>
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
