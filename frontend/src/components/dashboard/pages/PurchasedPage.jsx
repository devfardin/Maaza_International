'use client';
// src/components/dashboard/pages/PurchasedPage.jsx
// Shows all products the user has purchased with claim daily income button.
// Daily income amounts are stored in poisha (integer) — divide by 100 for BDT.

import { useGetMyPurchasesQuery, useClaimDailyIncomeMutation } from '@/redux/features/apiSlice';

export default function PurchasedPage({ showToast }) {
  const { data: purchasesData, isLoading } = useGetMyPurchasesQuery();
  const [claimIncome, { isLoading: claiming }] = useClaimDailyIncomeMutation();

  const purchases = purchasesData?.data || [];

  // Claim daily income for a specific purchase — credits balance wallet
  async function handleClaim(purchaseId) {
    try {
      const result = await claimIncome(purchaseId).unwrap();
      showToast(`Daily income of ৳${(result.data?.incomeAmount / 100).toFixed(2)} claimed!`);
    } catch (err) {
      showToast(err?.data?.message || 'Could not claim income. Try again later.');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">My purchased products</h1>
        <p className="text-sm text-slate-500 mt-1">Review purchase details, status and claim daily income.</p>
      </div>

      {/* Loading skeleton */}
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
          // validityDays comes directly from the purchase document
          const days     = p.validityDays || 30;
          const elapsed  = p.totalClaimedDays || 0;
          const progress = Math.min(100, Math.round((elapsed / days) * 100));

          // Check if claim is available — nextClaimAt is a date string from backend
          const canClaim = p.status === 'active' && new Date() >= new Date(p.nextClaimAt);

          return (
            <article key={p._id} className="bg-white border rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-harvest-50 grid place-items-center text-3xl overflow-hidden">
                  {p.productId?.image
                    ? <img src={p.productId.image} alt={p.productName} className="w-full h-full object-cover" />
                    : '🌿'}
                </div>
                <div>
                  <span className={`text-xs font-bold ${p.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                    ● {p.status?.toUpperCase()}
                  </span>
                  <h3 className="font-extrabold mt-0.5">{p.productName}</h3>
                  <p className="text-xs text-slate-500">#{p._id?.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-y my-4 py-3 text-sm">
                <div>
                  <small className="text-xs text-slate-500 block">Purchase price</small>
                  {/* purchasePrice stored in poisha */}
                  <b>৳{(p.purchasePrice / 100).toFixed(0)}</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Validity</small>
                  <b>{days} days</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Daily income</small>
                  {/* dailyIncome stored in poisha */}
                  <b>৳{(p.dailyIncome / 100).toFixed(2)}</b>
                </div>
                <div>
                  <small className="text-xs text-slate-500 block">Progress</small>
                  <b>{elapsed} / {days} days</b>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-harvest-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              {/* Next claim time */}
              {p.status === 'active' && !canClaim && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Next claim: {new Date(p.nextClaimAt).toLocaleString('en-BD')}
                </p>
              )}

              <button
                onClick={() => handleClaim(p._id)}
                disabled={claiming || !canClaim}
                className="mt-4 w-full rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold disabled:opacity-50"
              >
                {claiming ? 'Claiming…' : canClaim ? 'Claim daily income' : 'Already claimed today'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
