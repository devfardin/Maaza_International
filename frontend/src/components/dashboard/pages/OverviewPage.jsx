'use client';
// src/components/dashboard/pages/OverviewPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard home — shows wallet balances, recent purchases, quick actions.
// All data is fetched from the real backend via RTK Query hooks.
// ─────────────────────────────────────────────────────────────────────────────

import { useSelector } from 'react-redux';
import { useGetMyWalletsQuery, useGetMyPurchasesQuery, useGetUserTransactionsQuery } from '@/redux/features/apiSlice';

export default function OverviewPage({ showPage }) {
  // Get userId from Redux — needed for wallet and transaction queries
  const user   = useSelector((state) => state.auth.user);
  const userId = user?._id;

  // Fetch wallet balances — GET /wallets/:userId
  const { data: walletData, isLoading: walletLoading } = useGetMyWalletsQuery(userId, {
    skip: !userId,
  });

  // Fetch user's purchases — GET /product-purchases/my-purchases
  const { data: purchasesData, isLoading: purchasesLoading } = useGetMyPurchasesQuery();

  // Fetch recent transactions — GET /transactions/user/:userId
  const { data: txData, isLoading: txLoading } = useGetUserTransactionsQuery(userId, {
    skip: !userId,
  });

  // Extract wallet balances — backend stores in poisha, formattedBalance is in BDT
  const rechargeBalance = walletData?.data?.rechargeWallet?.formattedBalance ?? '0.00';
  const balanceAmount   = walletData?.data?.balanceWallet?.formattedBalance   ?? '0.00';

  // Get the 3 most recent purchases for the quick list
  const recentPurchases = purchasesData?.data?.slice(0, 3) ?? [];

  // Get the 5 most recent transactions
  const recentTx = txData?.data?.slice(0, 5) ?? [];

  // Quick action cards — each navigates to a dashboard sub-page
  const quickActions = [
    { page: 'recharge',      icon: '＋', label: 'Recharge wallet',   sub: 'Add funds to your wallet',    cta: 'Recharge now →' },
    { page: 'products',      icon: '▦', label: 'Browse products',    sub: 'Explore available products',  cta: 'View products →' },
    { page: 'tasks',         icon: '✧', label: 'Task bonuses',       sub: 'Complete tasks, earn rewards', cta: 'View tasks →' },
    { page: 'referrals',     icon: '♧', label: 'Referral center',    sub: 'Invite friends, earn bonuses', cta: 'Invite now →' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Welcome header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs tracking-widest font-extrabold text-harvest-700">MEMBER DASHBOARD</p>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Member'} 👋
          </h1>
        </div>
        <button
          onClick={() => showPage('recharge')}
          className="flex-1 sm:flex-none rounded-xl bg-harvest-700 text-white px-5 py-3 text-sm font-bold"
        >
          ＋ Recharge wallet
        </button>
      </div>

      {/* ── Wallet balance card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 text-white p-5 sm:p-8 shadow-soft">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10 grid sm:grid-cols-2 gap-6">
          {/* Recharge wallet */}
          <div>
            <p className="text-xs text-white/60 mb-1">Recharge wallet</p>
            {walletLoading
              ? <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse" />
              : <p className="text-3xl font-extrabold">৳{rechargeBalance}</p>
            }
            <p className="text-xs text-white/50 mt-1">Available for product purchase</p>
          </div>
          {/* Balance wallet */}
          <div>
            <p className="text-xs text-white/60 mb-1">Balance wallet</p>
            {walletLoading
              ? <div className="h-8 w-32 bg-white/20 rounded-lg animate-pulse" />
              : <p className="text-3xl font-extrabold">৳{balanceAmount}</p>
            }
            <p className="text-xs text-white/50 mt-1">Earnings & commissions</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 mt-6">
          <button onClick={() => showPage('recharge')} className="rounded-xl bg-lime-300 text-harvest-900 px-4 py-3 text-sm font-extrabold">
            ＋ Recharge now
          </button>
          <button onClick={() => showPage('withdraw')} className="rounded-xl bg-white/10 text-white px-4 py-3 text-sm font-bold border border-white/20">
            ↗ Withdraw
          </button>
        </div>
      </div>

      {/* ── Membership level badge ── */}
      <div className="rounded-2xl bg-white border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-harvest-50 grid place-items-center text-2xl font-extrabold text-harvest-700">
          {user?.membershipLevel ?? 1}
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-sm">Level {user?.membershipLevel ?? 1} Member</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.membershipLevel >= 2
              ? 'You have unlocked higher-tier products'
              : 'Refer 5 valid members + deposit ৳1,300 to reach Level 2'}
          </p>
        </div>
        <button onClick={() => showPage('referrals')} className="text-xs font-bold text-harvest-700 whitespace-nowrap">
          View referrals →
        </button>
      </div>

      {/* ── Quick action cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(({ page, icon, label, sub, cta }) => (
          <button
            key={page}
            onClick={() => showPage(page)}
            className="bg-white border rounded-2xl p-4 text-left hover:border-harvest-300 hover:shadow-soft transition-all"
          >
            <span className="w-11 h-11 rounded-2xl bg-harvest-700 text-white grid place-items-center text-xl mb-3">{icon}</span>
            <b className="block text-sm">{label}</b>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
            <span className="block mt-3 text-harvest-700 text-xs font-extrabold">{cta}</span>
          </button>
        ))}
      </div>

      {/* ── Recent purchases ── */}
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <b className="text-sm">Active products</b>
          <button onClick={() => showPage('purchased')} className="text-harvest-700 text-xs font-extrabold">View all →</button>
        </div>
        {purchasesLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentPurchases.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No active products yet. <button onClick={() => showPage('products')} className="text-harvest-700 font-bold">Browse products →</button></p>
        ) : (
          <div className="space-y-3">
            {recentPurchases.map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-harvest-50 grid place-items-center text-xl">🌿</div>
                <div className="flex-1 min-w-0">
                  <b className="text-xs block truncate">{p.productName}</b>
                  <p className="text-[10px] text-slate-500">Daily income: ৳{(p.dailyIncome / 100).toFixed(2)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-white border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <b className="text-sm">Recent transactions</b>
          <button onClick={() => showPage('transactions')} className="text-harvest-700 text-xs font-extrabold">All transactions →</button>
        </div>
        {txLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentTx.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-xs font-semibold capitalize">{tx.type.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-extrabold ${tx.flow === 'credit' ? 'text-green-600' : 'text-rose-500'}`}>
                  {tx.flow === 'credit' ? '+' : '-'}৳{(tx.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
