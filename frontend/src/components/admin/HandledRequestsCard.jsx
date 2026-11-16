'use client';
// The requests the signed-in admin (or super admin) handled: deposits accepted, withdrawals paid,
// with counts and money totals. Today or all time.
import { useState } from 'react';
import { useGetMyHandledQuery } from '@/redux/features/apiSlice';
import { formatBDT } from '@/components/shared/money';

function Tile({ icon, label, count, amount, sub, tone }) {
  return (
    <div className="rounded-2xl border bg-white p-4 flex items-start gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-xl grid place-items-center text-lg shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-extrabold mt-0.5">{count} <span className="text-sm font-bold text-slate-400">requests</span></p>
        {amount !== undefined && <p className="text-sm font-bold mt-0.5">{formatBDT(amount)}</p>}
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function HandledRequestsCard() {
  const [period, setPeriod] = useState('today');
  const { data, isLoading } = useGetMyHandledQuery(undefined, { pollingInterval: 30000 });
  const h = data?.data?.[period];

  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold">Requests you handled</h2>
          <p className="text-xs text-slate-500 mt-0.5">Deposits you accepted and withdrawals you marked paid.</p>
        </div>
        <div className="flex rounded-xl border p-1 text-xs font-bold">
          {[['today', 'Today'], ['allTime', 'All time']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg ${period === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !h ? (
        <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Tile icon="💳" label="Deposits accepted" count={h.deposits.accepted.count} amount={h.deposits.accepted.amount}
              sub="total amount credited" tone="bg-emerald-50 text-emerald-700" />
            <Tile icon="💸" label="Withdrawals paid" count={h.withdrawals.paid.count} amount={h.withdrawals.paid.amount}
              sub={`${formatBDT(h.withdrawals.paid.netAmount)} sent after fee`} tone="bg-violet-50 text-violet-700" />
            <Tile icon="✖" label="Deposits rejected" count={h.deposits.rejected.count} amount={h.deposits.rejected.amount}
              tone="bg-rose-50 text-rose-700" />
            <Tile icon="↩" label="Withdrawals rejected" count={h.withdrawals.rejected.count} amount={h.withdrawals.rejected.amount}
              tone="bg-amber-50 text-amber-700" />
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Total handled {period === 'today' ? 'today' : 'all time'}: <b>{h.totalRequests}</b> requests
          </p>
        </>
      )}
    </div>
  );
}
