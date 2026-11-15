'use client';
// src/components/dashboard/pages/PurchasedPage.jsx
// My Products: income today, total earnings, and two tabs (Active / Expired).
// Each card shows the product image on the left and its earning details on the right,
// with the claim schedule, validity progress and a claim button that unlocks on time.
// All amounts are plain BDT (up to 2 decimals).

import { useEffect, useState } from 'react';
import {
  useGetMyPurchasesQuery,
  useGetIncomeSummaryQuery,
  useClaimDailyIncomeMutation,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { claimScheduleLabel, incomePerClaim } from '@/lib/product';
import CountdownTimer from '@/components/shared/CountdownTimer';

const bdt = (amount, digits = 2) =>
  `৳${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: digits })}`;

const TABS = [
  { key: 'active', label: 'Active products' },
  { key: 'expired', label: 'Expired products' },
];

export default function PurchasedPage() {
  const [tab, setTab] = useState('active');
  const { data: purchasesData, isLoading } = useGetMyPurchasesQuery(undefined, { pollingInterval: 60000 });
  const { data: summaryData } = useGetIncomeSummaryQuery();
  const [claimIncome, { isLoading: claiming }] = useClaimDailyIncomeMutation();
  const [claimingId, setClaimingId] = useState(null);

  // Parent-level clock: re-renders every second so a claim button unlocks the
  // moment its countdown reaches zero (no refetch needed).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const purchases = purchasesData?.data || [];
  const summary = summaryData?.data || { todayIncome: 0, totalEarned: 0 };
  const activeList = purchases.filter((p) => p.status === 'active');
  const expiredList = purchases.filter((p) => p.status !== 'active');
  const shown = tab === 'active' ? activeList : expiredList;

  async function handleClaim(purchaseId) {
    setClaimingId(purchaseId);
    try {
      const result = await claimIncome(purchaseId).unwrap();
      notify.success(`Income of ${bdt(result.data?.incomeAmount)} claimed!`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not claim income. Please try again later.'));
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">My products</h1>
        <p className="text-sm text-slate-500 mt-1">Track your products, claim your income and see how much you have earned.</p>
      </div>

      {/* Income summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 p-5 text-white shadow-soft">
          <p className="text-xs font-bold tracking-wider text-white/70">INCOME TODAY</p>
          <p className="mt-2 text-3xl font-extrabold">{bdt(summary.todayIncome)}</p>
          <p className="mt-1 text-xs text-white/60">Claimed from all your products today</p>
        </div>
        <div className="rounded-2xl bg-white border p-5 shadow-soft">
          <p className="text-xs font-bold tracking-wider text-slate-500">TOTAL EARNINGS</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{bdt(summary.totalEarned)}</p>
          <p className="mt-1 text-xs text-slate-500">Earned from every product you have bought</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5 w-full sm:w-fit">
        {TABS.map((t) => {
          const count = t.key === 'active' ? activeList.length : expiredList.length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                tab === t.key ? 'bg-white text-harvest-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label} <span className="ml-1 text-xs text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-28 h-28 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && shown.length === 0 && (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">
            {tab === 'active' ? 'You have no active products. Join a product to start earning.' : 'No expired products yet.'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {shown.map((p) => {
          const validity = p.validityDays || 1;
          // progress in days (hourly products can be a fraction of a day)
          const claimedDays = Math.min(p.totalClaimedDays || 0, validity);
          const claimedText = Number.isInteger(claimedDays) ? claimedDays : claimedDays.toFixed(2);
          const progress = Math.min(100, Math.round((claimedDays / validity) * 100));
          const isActive = p.status === 'active';
          const perClaim = incomePerClaim(p, p.dailyIncome);
          const nextAt = new Date(p.nextClaimAt);
          // first claim: as soon as the product is bought; later claims: when the interval timer ends
          const canClaim = isActive && (!p.lastClaimAt || now >= nextAt.getTime());
          const busy = claiming && claimingId === p._id;

          return (
            <article key={p._id} className="bg-white border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
              {/* Left: image */}
              <div className="sm:w-44 shrink-0">
                <div className="h-40 sm:h-44 w-full rounded-2xl bg-gradient-to-br from-lime-100 to-harvest-200 overflow-hidden grid place-items-center">
                  {p.productId?.image
                    ? <img src={p.productId.image} alt={p.productName} className="w-full h-full object-cover" />
                    : <span className="text-5xl">🌿</span>}
                </div>
              </div>

              {/* Right: details */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-lg truncate">{p.productName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">#{p._id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isActive ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-sm">
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-[11px] text-slate-500">Price</p>
                    <b>{bdt(p.purchasePrice, 0)}</b>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-[11px] text-slate-500">Claim</p>
                    <b>{claimScheduleLabel(p)}</b>
                    <p className="text-[10px] text-slate-400">{bdt(perClaim)} per claim</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-[11px] text-slate-500">Total earnings</p>
                    <b className="text-harvest-700">{bdt(p.receivedAmount)}</b>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-[11px] text-slate-500">Daily income</p>
                    <b>{bdt(p.dailyIncome)}</b>
                  </div>
                </div>

                {/* Validity progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-600">Validity period</span>
                    <span className="text-slate-500">{claimedText} / {validity} days claimed</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-harvest-500 to-lime-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Claim */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  {isActive && (
                    <div className="flex-1 rounded-xl bg-harvest-50 border border-harvest-100 px-4 py-2.5">
                      <p className="text-[11px] font-bold text-harvest-700 uppercase tracking-wide">Next claim</p>
                      {canClaim ? (
                        <p className="font-extrabold text-emerald-700">Available now</p>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <CountdownTimer target={nextAt} className="font-extrabold text-lg" />
                          <span className="text-[11px] text-slate-500">{nextAt.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleClaim(p._id)}
                    disabled={!canClaim || busy}
                    className="sm:w-60 rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Claiming…' : !isActive ? 'Expired' : canClaim ? 'Claim income' : 'Claim unlocks when timer ends'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
