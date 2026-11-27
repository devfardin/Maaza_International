'use client';
// Super admin dashboard card: the whole redeem bonus budget, how much was claimed and how much is left.
import Link from 'next/link';
import { useGetRedeemSummaryQuery } from '@/redux/features/apiSlice';
import { formatBDT } from '@/components/shared/money';

export default function RedeemBonusCard() {
  const { data, isLoading } = useGetRedeemSummaryQuery();
  const s = data?.data;
  const money = (v) => (isLoading || !s ? '…' : formatBDT(v));
  const count = (v) => (isLoading || !s ? '…' : `${v ?? 0} users`);

  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0 bg-amber-50 text-amber-700">🎟️</div>
          <div>
            <h2 className="font-extrabold">Redeem bonus</h2>
            <p className="text-xs text-slate-500">{isLoading || !s ? '…' : `${s.codeCount} code${s.codeCount === 1 ? '' : 's'} created by admins`}</p>
          </div>
        </div>
        <Link href="/admin/redeem" className="text-xs font-bold text-blue-600 hover:underline">Manage codes</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-blue-50/50 p-4">
          <p className="text-xs text-slate-500">Total redeem bonus</p>
          <p className="text-2xl font-extrabold mt-1">{money(s?.totalBudget)}</p>
          <p className="text-xs text-slate-400 mt-1">all prizes, all codes</p>
        </div>
        <div className="rounded-xl border bg-emerald-50/50 p-4">
          <p className="text-xs text-slate-500">Claimed</p>
          <p className="text-2xl font-extrabold mt-1">{money(s?.claimedAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{count(s?.claimedUsers)} claimed</p>
        </div>
        <div className="rounded-xl border bg-amber-50/50 p-4">
          <p className="text-xs text-slate-500">Left</p>
          <p className="text-2xl font-extrabold mt-1">{money(s?.remainingAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{count(s?.remainingUsers)} left to claim</p>
        </div>
      </div>
    </div>
  );
}
