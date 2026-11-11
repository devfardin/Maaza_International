'use client';
// Admin payouts: review withdrawal requests. Approve = you have sent the money
// (optionally record the payout reference). Reject = amount is returned to the user's balance.
import { useState } from 'react';
import { useGetAllWithdrawalsQuery, useUpdateWithdrawalStatusMutation } from '@/redux/features/apiSlice';
import DecisionDialog from '@/components/admin/DecisionDialog';
import CopyButton from '@/components/shared/CopyButton';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLoader from '@/components/shared/PageLoader';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import { notify, getErrorMessage } from '@/lib/toast';

const TABS = ['pending', 'approved', 'rejected', 'all'];

export default function AdminWithdrawalsPage() {
  const [tab, setTab] = useState('pending');
  const [decision, setDecision] = useState(null); // { id, action }

  const { data, isLoading } = useGetAllWithdrawalsQuery(undefined, { pollingInterval: 30000 });
  const [updateWithdrawal, { isLoading: updating }] = useUpdateWithdrawalStatusMutation();

  const all = data?.data || [];
  const filtered = tab === 'all' ? all : all.filter((w) => w.status === tab);
  const counts = Object.fromEntries(TABS.map((t) => [t, t === 'all' ? all.length : all.filter((w) => w.status === t).length]));
  const pendingTotal = all.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  async function confirmDecision({ adminNote, payoutReference }) {
    try {
      await updateWithdrawal({ id: decision.id, status: decision.action, adminNote, payoutReference }).unwrap();
      notify.success(decision.action === 'approved'
        ? 'Withdrawal approved. The user has been emailed.'
        : 'Withdrawal rejected. The amount was returned to the user’s balance.');
      setDecision(null);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update this withdrawal.'));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Withdrawal requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Send the money to the user’s bKash / Nagad number, then approve here. Rejecting returns the amount to their balance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white border rounded-2xl p-4 min-w-0">
          <small className="text-xs text-slate-500">Pending requests</small>
          <b className="block text-xl mt-1">{counts.pending}</b>
        </div>
        <div className="bg-white border rounded-2xl p-4 min-w-0 col-span-1 lg:col-span-2">
          <small className="text-xs text-slate-500">Pending payout amount</small>
          <b className="block text-xl mt-1 truncate">{formatBDT(pendingTotal)}</b>
        </div>
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
        <PageLoader label="Loading withdrawals…" />
      ) : filtered.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">No withdrawal requests here.</div>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {filtered.map((w) => (
              <li key={w._id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{w.userId?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{w.userId?.phone || ''}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <p className="mt-3 text-lg font-extrabold">{formatBDT(w.amount)}</p>
                <p className="text-xs text-slate-600">{w.method === 'bkash' ? 'bKash' : 'Nagad'} · {w.accountNumber} · {w.accountHolderName}</p>
                <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(w.createdAt)}</p>
                {w.payoutReference && <p className="text-xs mt-1">Payout ref: <b>{w.payoutReference}</b></p>}
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-[11px] bg-slate-50 border rounded-lg px-2 py-1.5">{w._id}</code>
                  <CopyButton value={w._id} />
                </div>
                {w.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => setDecision({ id: w._id, action: 'approved' })} className="rounded-xl bg-emerald-50 text-emerald-700 py-2.5 text-sm font-bold">Approve (paid)</button>
                    <button onClick={() => setDecision({ id: w._id, action: 'rejected' })} className="rounded-xl bg-rose-50 text-rose-700 py-2.5 text-sm font-bold">Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden lg:block bg-white border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Request ID</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Payout to</th>
                  <th className="text-left px-5 py-3">Requested</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w._id} className="border-b last:border-0 hover:bg-slate-50 align-top">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{w.userId?.fullName || '—'}</p>
                      <p className="text-xs text-slate-400">{w.userId?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2"><code className="text-[11px]">{w._id.slice(-8)}</code><CopyButton value={w._id} /></div>
                    </td>
                    <td className="px-5 py-3 font-bold">{formatBDT(w.amount)}</td>
                    <td className="px-5 py-3 text-slate-600">{w.method === 'bkash' ? 'bKash' : 'Nagad'}<br /><span className="text-xs">{w.accountNumber}</span><br /><span className="text-xs text-slate-400">{w.accountHolderName}</span></td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(w.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={w.status} />
                      {w.processedBy && <p className="text-[11px] text-slate-400 mt-1">by {w.processedBy.fullName || 'admin'}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => setDecision({ id: w._id, action: 'approved' })} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Approve</button>
                          <button onClick={() => setDecision({ id: w._id, action: 'rejected' })} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">Reject</button>
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
        showReference
        title={decision?.action === 'approved' ? 'Mark withdrawal as paid?' : 'Reject withdrawal?'}
        description={decision?.action === 'approved'
          ? 'Confirm you have already sent this amount to the user’s bKash / Nagad. The user will be emailed.'
          : 'The amount will be returned to the user’s balance and they will be emailed the reason.'}
        busy={updating}
        onCancel={() => setDecision(null)}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
