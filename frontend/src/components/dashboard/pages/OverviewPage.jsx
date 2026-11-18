'use client';
// src/components/dashboard/pages/OverviewPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard home — shows wallet balances, recent purchases, quick actions.
// All data is fetched from the real backend via RTK Query hooks.
// ─────────────────────────────────────────────────────────────────────────────

import { useSelector } from 'react-redux';
import { useGetMyWalletsQuery, useGetMyPurchasesQuery, useGetUserTransactionsQuery, useGetMyReferralsQuery } from '@/redux/features/apiSlice';
import DailyCheckinCard from '@/components/dashboard/DailyCheckinCard';
import DailyCheckinPopup from '@/components/dashboard/DailyCheckinPopup';
import { vipLevelOf, vipLabel } from '@/lib/vip';

export default function OverviewPage({ showPage }) {
  // Get userId from Redux — needed for wallet and transaction queries
  const user = useSelector((state) => state.auth.user);
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

  // Extract wallet balances (plain BDT)
  const rechargeBalance = walletData?.data?.rechargeWallet?.formattedBalance ?? '0.00';
  const balanceAmount = walletData?.data?.balanceWallet?.formattedBalance ?? '0.00';

  // Team commission earned so far — paid into the balance (withdraw) wallet
  const { data: referralData } = useGetMyReferralsQuery(undefined, { skip: !userId });
  const teamEarnings = (referralData?.data?.totalCommission ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Get the 3 most recent purchases for the quick list
  const recentPurchases = purchasesData?.data?.slice(0, 3) ?? [];

  // Get the 5 most recent transactions
  const recentTx = txData?.data?.slice(0, 5) ?? [];

  // Quick action cards — each navigates to a dashboard sub-page
  const quickActions = [
    { page: 'recharge', icon: '＋', label: 'Recharge wallet', sub: 'Add funds to your wallet', cta: 'Recharge now →' },
    { page: 'purchased', icon: '▦', label: 'My products', sub: 'View purchased items', cta: 'My purchases →' },
    { page: 'transactions', icon: '💸', label: 'Transactions', sub: 'Track your spending, income, and payment history in one place.', cta: 'Export Statement →' },
    { page: 'tasks', icon: '✧', label: 'Task bonuses', sub: 'Complete tasks, earn rewards', cta: 'View tasks →' },

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
          className="flex-1 sm:flex-none rounded-md bg-harvest-700 text-white px-5 py-3 text-sm font-bold"
        >
          ＋ Recharge
        </button>
      </div>

      {/* ── Fast section: withdraw balance & recharge balance ── */}
      <div className="grid grid-cols-2 sm:gap-4 gap-2">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 text-white p-4 sm:p-6 shadow-soft">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          <p className="relative text-xs font-bold tracking-wider text-white/70">WITHDRAW BALANCE</p>
          {walletLoading
            ? <div className="relative mt-2 h-9 w-32 bg-white/20 rounded-lg animate-pulse" />
            : <p className="relative mt-2 text-[25px] font-extrabold">৳{balanceAmount}</p>
          }
          <p className="relative mt-1 text-xs text-white/60">Earnings &amp; commissions you can withdraw</p>
          <button
            onClick={() => showPage('withdraw')}
            className="relative mt-5 w-full rounded-md bg-lime-300 py-3 text-sm font-extrabold text-harvest-900 hover:bg-lime-200"
          >
            ↗ Withdraw
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white border p-4 sm:p-6 shadow-soft">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-harvest-50" />
          <p className="relative text-xs font-bold tracking-wider text-slate-500">RECHARGE BALANCE</p>
          {walletLoading
            ? <div className="relative mt-2 h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
            : <p className="relative mt-2 text-3xl font-extrabold text-slate-900">৳{rechargeBalance}</p>
          }
          <p className="relative mt-1 text-xs text-slate-500">Available for product purchases</p>
          <button
            onClick={() => showPage('recharge')}
            className="relative mt-5 w-full rounded-md bg-harvest-700 py-3 text-sm font-extrabold text-white hover:bg-harvest-800"
          >
            ＋ Recharge
          </button>
        </div>
      </div>

      {/* ── Team earnings (already added to the withdraw balance) ── */}
      <div className="relative overflow-hidden rounded-xl border border-harvest-100 bg-gradient-to-br from-harvest-50 via-white to-lime-50 p-5 shadow-soft">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-harvest-100/60" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-harvest-700 text-xl text-white shadow-soft">👥</span>
            <div>
              <p className="text-xs font-extrabold tracking-widest text-harvest-700">TEAM EARNINGS</p>
              <p className="mt-1 text-2xl font-extrabold text-harvest-900">৳{teamEarnings}</p>
              <p className="text-xs text-harvest-800/70">Team commission, added to your withdraw balance</p>
            </div>
          </div>
          <button
            onClick={() => showPage('referrals')}
            className="rounded-md border border-harvest-500 bg-white px-4 py-2.5 text-xs font-extrabold text-harvest-700 hover:bg-harvest-50"
          >
            View team →
          </button>
        </div>
      </div>

      {/* ── Daily check-in ── */}
      <DailyCheckinCard />
      <DailyCheckinPopup />

      {/* ── VIP level badge ── */}
      <div className="rounded-xl bg-white border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-harvest-50 grid place-items-center text-sm font-extrabold text-harvest-700">
          {vipLevelOf(user?.membershipLevel) || 'M'}
        </div>
        <div className="flex-1">
          <p className="font-extrabold text-sm">{vipLabel(vipLevelOf(user?.membershipLevel))}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep referring qualified members and spending to reach the next VIP level
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
            className="bg-white border rounded-xl p-4 text-left hover:border-harvest-300 hover:shadow-soft transition-all"
          >
            <span className="w-11 h-11 rounded-md bg-harvest-700 text-white grid place-items-center text-xl mb-3">{icon}</span>
            <b className="block text-sm">{label}</b>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
            <span className="block mt-3 text-harvest-700 text-xs font-extrabold">{cta}</span>
          </button>
        ))}
      </div>

      {/* ── Recent purchases ── */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <b className="text-sm">Active products</b>
          <button onClick={() => showPage('purchased')} className="text-harvest-700 text-xs font-extrabold">View all →</button>
        </div>
        {purchasesLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : recentPurchases.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No active products yet. <button onClick={() => showPage('products')} className="text-harvest-700 font-bold">Browse products →</button></p>
        ) : (
          <div className="space-y-3">
            {recentPurchases.map((p) => (
              <div key={p._id} className="flex items-center gap-3 p-3 rounded-md bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-harvest-50 grid place-items-center text-xl">🌿</div>
                <div className="flex-1 min-w-0">
                  <b className="text-xs block truncate">{p.productName}</b>
                  <p className="text-[10px] text-slate-500">Daily income: ৳{Number(p.dailyIncome).toFixed(2)}</p>
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
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <b className="text-sm">Recent transactions</b>
          <button onClick={() => showPage('transactions')} className="text-harvest-700 text-xs font-extrabold">All transactions →</button>
        </div>
        {txLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
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
                  {tx.flow === 'credit' ? '+' : '-'}৳{Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
