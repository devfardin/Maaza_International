'use client';
// Super admin only: every member's balance wallet and recharge wallet.
import { useMemo, useState } from 'react';
import { useGetMemberWalletsQuery } from '@/redux/features/apiSlice';
import { formatBDT } from '@/components/shared/money';
import PageLoader from '@/components/shared/PageLoader';

export default function MemberWalletsTable() {
  const { data, isLoading } = useGetMemberWalletsQuery(undefined, { pollingInterval: 60000 });
  const [query, setQuery] = useState('');
  const members = useMemo(() => data?.data?.members ?? [], [data]);
  const totals = data?.data?.totals;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.fullName?.toLowerCase().includes(q) || m.phone?.includes(q));
  }, [members, query]);

  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-extrabold">Member wallets</h2>
          <p className="text-xs text-slate-500 mt-0.5">Balance wallet (withdrawable) and recharge wallet for every member. Super admin only.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or phone"
          className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 w-full sm:w-64"
        />
      </div>

      {isLoading ? (
        <PageLoader label="Loading member wallets…" className="py-6" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-right px-4 py-3">Balance wallet</th>
                <th className="text-right px-4 py-3">Recharge wallet</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m._id} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-semibold">{m.fullName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{m.phone}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold">{formatBDT(m.balanceWallet)}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold">{formatBDT(m.rechargeWallet)}</td>
                  <td className="px-4 py-2.5 capitalize">{m.status}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No members found.</td>
                </tr>
              )}
            </tbody>
            {totals && !query && (
              <tfoot>
                <tr className="bg-slate-50 font-extrabold">
                  <td className="px-4 py-3" colSpan={2}>Total ({members.length} members)</td>
                  <td className="px-4 py-3 text-right">{formatBDT(totals.balanceWallet)}</td>
                  <td className="px-4 py-3 text-right">{formatBDT(totals.rechargeWallet)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
