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
      <div className="grid grid-cols-2 sm:gap-4 gap-2.5">
        <div className="rounded-xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 p-4 sm:p-5 text-white shadow-soft">
          <p className="text-xs font-bold tracking-wider text-white/70">INCOME TODAY</p>
          <p className="mt-2 text-3xl font-extrabold">{bdt(summary.todayIncome)}</p>
          <p className="mt-1 text-xs text-white/60">Claimed from all your products today</p>
        </div>
        <div className="rounded-2xl bg-white border p-4 sm:p-5 shadow-soft">
          <p className="text-xs font-bold tracking-wider text-slate-500">TOTAL EARNINGS</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{bdt(summary.totalEarned)}</p>
          <p className="mt-1 text-xs text-slate-500">Earned from every product you have bought</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1.5 w-full sm:w-fit">
        {TABS.map((t) => {
          const count = t.key === 'active' ? activeList.length : expiredList.length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none rounded-xl px-5 py-2.5 text-sm font-bold transition ${tab === t.key ? 'bg-white text-harvest-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
        <div className="bg-white border rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">
            {tab === 'active' ? 'You have no active products. Join a product to start earning.' : 'No expired products yet.'}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {shown.map((p) => {
          const validity = p.validityDays || 1;
          const claimedDays = Math.min(p.totalClaimedDays || 0, validity);
          const claimedText = Number.isInteger(claimedDays) ? claimedDays : claimedDays.toFixed(2);
          const progress = Math.min(100, Math.round((claimedDays / validity) * 100));
          const isActive = p.status === 'active';
          const nextAt = new Date(p.nextClaimAt);
          const canClaim = isActive && (!p.lastClaimAt || now >= nextAt.getTime());
          const busy = claiming && claimingId === p._id;

          return (
            <article key={p._id} className="relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">

              {/* Top: image left + info right */}
              <div className="flex gap-4 p-2.5">

                {/* Product image */}
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-500 p-2">
                  {p.productId?.image
                    ? <img src={p.productId.image} alt={p.productName} className="h-full w-full rounded-lg object-contain drop-shadow-lg" />
                    : <span className="text-5xl">🌿</span>}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold leading-snug text-slate-900 line-clamp-2">{p.productName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">#{p._id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {isActive ? 'Active' : 'Expired'}
                    </span>
                  </div>

                  <div className="mt-1">
                    <p className="text-base font-semibold text-slate-700">
                      Price: <span className="text-xl font-extrabold text-harvest-700">{bdt(p.purchasePrice, 0)}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Claim Every 1 Day: <span className="font-semibold text-harvest-700">{bdt(p.dailyIncome)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats footer strip */}
              <div className="grid grid-cols-3 divide-x divide-white/20 bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600 py-3">
                <div className="flex flex-col items-center px-2">
                  <p className="text-[11px] font-medium tracking-wide text-white/80">Claim / Day</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{bdt(p.dailyIncome)}</p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <p className="text-[11px] font-medium tracking-wide text-white/80">Total Revenue</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{bdt(p.totalRevenue ?? p.dailyIncome * validity, 0)}</p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <p className="text-[11px] font-medium tracking-wide text-white/80">Already Received</p>
                  <p className="mt-0.5 text-sm font-bold text-white">{bdt(p.receivedAmount)}</p>
                </div>
              </div>

              {/* Validity progress */}
              <div className="px-2.5 py-2.5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-600">Validity period</span>
                  <span className="text-slate-500">{claimedText} / {validity} days</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-harvest-500 to-lime-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Claim row */}
              <div className="flex items-center gap-2 p-2.5 pt-0">
                {isActive && (
                  <div className="flex-1 rounded-lg bg-harvest-50 border border-harvest-100 px-3 py-2">
                    <p className="text-[10px] font-bold text-harvest-700 uppercase tracking-wide">Next claim</p>
                    {canClaim ? (
                      <p className="text-sm font-extrabold text-emerald-700">Available now</p>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <CountdownTimer target={nextAt} className="font-extrabold text-sm text-slate-800" />
                        <span className="text-[11px] text-slate-500">{nextAt.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleClaim(p._id)}
                  disabled={!canClaim || busy}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-harvest-700 to-harvest-500 text-white px-4 py-2.5 text-sm font-bold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
                >
                  {busy ? 'Claiming…' : !isActive ? 'Expired' : canClaim ? 'Claim' : 'Locked'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
