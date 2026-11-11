'use client';
import { useMemo, useState } from 'react';
import { useGetAllTransactionsQuery } from '@/redux/features/apiSlice';

const TYPES = ['all', 'deposit', 'withdrawal', 'product_purchase', 'profit', 'commission', 'new_user_bonus', 'daily_checkin'];
const bdt = (p) => `৳${((p || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (t) => t.replace(/_/g, ' ');

export default function AdminTransactionsPage() {
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetAllTransactionsQuery();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.data || []).filter((t) =>
      (type === 'all' || t.type === type) &&
      (!q || t.userId?.fullName?.toLowerCase().includes(q) || t.userId?.phone?.includes(q) || t.note?.toLowerCase().includes(q))
    );
  }, [data, type, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">Every wallet movement across the platform.</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user, phone or note…"
          className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold capitalize ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>
              {label(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {isLoading && <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />}
        {!isLoading && rows.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No transactions found.</p>}
        {rows.map((t) => (
          <div key={t._id} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{t.userId?.fullName || 'Unknown'}</p>
                <p className="text-xs text-slate-400 capitalize">{label(t.type)} · {t.walletAffected}</p>
              </div>
              <p className={`font-extrabold text-sm shrink-0 ${t.flow === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.flow === 'credit' ? '+' : '−'}{bdt(t.amount)}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2">{t.note}</p>
            <p className="text-[11px] text-slate-400 mt-1">{new Date(t.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                {['Date', 'User', 'Type', 'Wallet', 'Amount', 'Balance after', 'Note'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No transactions found.</td></tr>}
              {rows.map((t) => (
                <tr key={t._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3"><p className="font-semibold">{t.userId?.fullName || 'Unknown'}</p><p className="text-xs text-slate-400">{t.userId?.phone}</p></td>
                  <td className="px-5 py-3 capitalize">{label(t.type)}</td>
                  <td className="px-5 py-3 capitalize">{t.walletAffected}</td>
                  <td className={`px-5 py-3 font-bold whitespace-nowrap ${t.flow === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.flow === 'credit' ? '+' : '−'}{bdt(t.amount)}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{bdt(t.balanceAfter)}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={t.note}>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
