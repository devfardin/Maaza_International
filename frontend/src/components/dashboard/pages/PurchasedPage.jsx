'use client';
// src/components/dashboard/pages/PurchasedPage.jsx
// Products the user has bought. Each active product shows a live
// "Next claim" countdown and a claim button that unlocks when the timer ends.
// All amounts are stored in poisha — divide by 100 for BDT.

import { useEffect, useState } from 'react';
import { useGetMyPurchasesQuery, useClaimDailyIncomeMutation } from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import CountdownTimer from '@/components/shared/CountdownTimer';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLoader from '@/components/shared/PageLoader';

export default function PurchasedPage() {
  const { data: purchasesData, isLoading } = useGetMyPurchasesQuery(undefined, { pollingInterval: 60000 });
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

  async function handleClaim(purchaseId) {
    setClaimingId(purchaseId);
    try {
      const result = await claimIncome(purchaseId).unwrap();
      notify.success(`Daily income of ৳${(result.data?.incomeAmount / 100).toFixed(2)} claimed!`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not claim income. Please try again later.'));
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">My purchased products</h1>
        <p className="text-sm text-slate-500 mt-1">Track each purchase, see when the next claim opens and claim your daily income.</p>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border rounded-2xl p-4 animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && purchases.length === 0 && (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">You haven&apos;t purchased any products yet.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {purchases.map((p) => {
          const days     = p.validityDays || 30;
          const elapsed  = p.totalClaimedDays || 0;
          const progress = Math.min(100, Math.round((elapsed / days) * 100));
          const isActive = p.status === 'active';
          const nextAt   = new Date(p.nextClaimAt);
          const canClaim = isActive && now >= nextAt.getTime();
          const busy     = claiming && claimingId === p._id;

          return (
            <article key={p._id} className="bg-white border rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-harvest-50 grid place-items-center text-3xl overflow-hidden">
                  {p.productId?.image
                    ? <img src={p.productId.image} alt={p.productName} className="w-full h-full object-cover" />
                    : '🌿'}
                </div>
                <div className="min-w-0">
                  <StatusBadge status={p.status} />
                  <h3 className="font-extrabold mt-1 truncate">{p.productName}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">#{p._id?.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-y my-4 py-3 text-sm">
                <div>
                  <small className="text-xs text-slate-500 block">Purchase price</small>
                  <b>৳{(p.purchasePrice / 100).toFixed(0)}</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Validity</small>
                  <b>{days} days</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Daily income</small>
                  <b>৳{(p.dailyIncome / 100).toFixed(2)}</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Progress</small>
                  <b>{elapsed} / {days} days</b>
                </div>
              </div>

              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-harvest-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              {/* Next claim countdown */}
              {isActive && (
                <div className="mt-4 rounded-xl bg-harvest-50 border border-harvest-100 p-3 text-center">
                  <p className="text-[11px] font-bold text-harvest-700 uppercase tracking-wide">Next claim</p>
                  {canClaim ? (
                    <p className="font-extrabold text-emerald-700 mt-1">Available now</p>
                  ) : (
                    <CountdownTimer target={nextAt} className="block text-xl mt-1" />
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">{nextAt.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              )}

              <button
                onClick={() => handleClaim(p._id)}
                disabled={!canClaim || busy}
                className="mt-4 w-full rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Claiming…' : !isActive ? 'Completed' : canClaim ? 'Claim daily income' : 'Claim unlocks when timer ends'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
