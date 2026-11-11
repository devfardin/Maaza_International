'use client';
import { useState } from 'react';
import { useGetAllDepositRequestsQuery, useUpdateDepositStatusMutation } from '@/redux/features/apiSlice';
import DecisionDialog from '@/components/admin/DecisionDialog';
import CopyButton from '@/components/shared/CopyButton';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLoader from '@/components/shared/PageLoader';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import { notify, getErrorMessage } from '@/lib/toast';

const TABS = ['pending', 'approved', 'rejected', 'all'];

export default function AdminDepositsPage() {
  const [tab, setTab]       = useState('pending');
  const [decision, setDecision] = useState(null); // { id, action, label }

  const { data, isLoading } = useGetAllDepositRequestsQuery(undefined, { pollingInterval: 30000 });
  const [updateStatus, { isLoading: updating }] = useUpdateDepositStatusMutation();

  const all      = data?.data || [];
  const filtered = tab === 'all' ? all : all.filter((d) => d.status === tab);
  const counts   = Object.fromEntries(TABS.map((t) => [t, t === 'all' ? all.length : all.filter((d) => d.status === t).length]));

  async function confirmDecision({ adminNote }) {
    try {
      await updateStatus({ id: decision.id, status: decision.action, adminNote }).unwrap();
      notify.success(`Deposit ${decision.action}. The user has been emailed.`);
      setDecision(null);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update this deposit request.'));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Deposit requests</h1>
        <p className="text-sm text-slate-500 mt-1">Review deposits. Approving credits the recharge wallet and emails the user.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
            {t} <span className="ml-1 opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader label="Loading deposit requests…" />
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">No requests found.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((d) => (
              <li key={d._id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{d.userId?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{d.userId?.phone || ''}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-3 text-lg font-extrabold">{formatBDT(d.amount)}</p>
                <p className="text-xs text-slate-500">{d.methodCode} · sender {d.senderNumber}</p>
                <p className="text-xs text-slate-500 font-mono break-all">TrxID {d.transactionId}</p>
                <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(d.createdAt)}</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-[11px] bg-slate-50 border rounded-lg px-2 py-1.5">{d._id}</code>
                  <CopyButton value={d._id} />
                </div>
                {d.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => setDecision({ id: d._id, action: 'approved' })} className="rounded-xl bg-emerald-50 text-emerald-700 py-2.5 text-sm font-bold">Approve</button>
                    <button onClick={() => setDecision({ id: d._id, action: 'rejected' })} className="rounded-xl bg-rose-50 text-rose-700 py-2.5 text-sm font-bold">Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Request ID</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Method / Sender</th>
                  <th className="text-left px-5 py-3">Tx ID</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d._id} className="border-b last:border-0 hover:bg-slate-50 align-top">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{d.userId?.fullName || '—'}</p>
                      <p className="text-xs text-slate-400">{d.userId?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px]">{d._id.slice(-8)}</code>
                        <CopyButton value={d._id} />
                      </div>
                    </td>
                    <td className="px-5 py-3 font-bold">{formatBDT(d.amount)}</td>
                    <td className="px-5 py-3 text-slate-600">{d.methodCode}<br /><span className="text-xs">{d.senderNumber}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono break-all max-w-[160px]">{d.transactionId}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(d.createdAt)}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3">
                      {d.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => setDecision({ id: d._id, action: 'approved' })} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
                          <button onClick={() => setDecision({ id: d._id, action: 'rejected' })} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DecisionDialog
        key={decision ? `${decision.id}-${decision.action}` : 'closed'}
        open={!!decision}
        action={decision?.action}
        title={decision?.action === 'approved' ? 'Approve deposit?' : 'Reject deposit?'}
        description={decision?.action === 'approved'
          ? 'The amount will be credited to the user’s recharge wallet and they will be emailed. A welcome bonus is added on their first approved deposit.'
          : 'The request will be rejected and the user will be emailed.'}
        busy={updating}
        onCancel={() => setDecision(null)}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
