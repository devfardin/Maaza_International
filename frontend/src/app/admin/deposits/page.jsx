'use client';
import { useState } from 'react';
import { useGetAllDepositRequestsQuery, useUpdateDepositStatusMutation } from '@/redux/features/apiSlice';

const TAB_FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminDepositsPage() {
  const [tab, setTab]           = useState('pending');
  const [actionId, setActionId] = useState(null);
  const [action, setAction]     = useState('');
  const [note, setNote]         = useState('');

  const { data, isLoading, refetch } = useGetAllDepositRequestsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateDepositStatusMutation();

  const all      = data?.data || [];
  const filtered = tab === 'all' ? all : all.filter((d) => d.status === tab);

  const counts = {
    all:      all.length,
    pending:  all.filter((d) => d.status === 'pending').length,
    approved: all.filter((d) => d.status === 'approved').length,
    rejected: all.filter((d) => d.status === 'rejected').length,
  };

  async function handleAction() {
    if (!actionId || !action) return;
    try {
      await updateStatus({ id: actionId, status: action, adminNote: note || undefined }).unwrap();
      setActionId(null); setAction(''); setNote('');
      refetch();
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Deposit Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve or reject user deposit requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TAB_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t} <span className="ml-1 opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Method</th>
                <th className="text-left px-5 py-3">Sender</th>
                <th className="text-left px-5 py-3">Tx ID</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No requests found.</td></tr>
              )}
              {filtered.map((d) => (
                <tr key={d._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{d.userId?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{d.userId?.phone || ''}</p>
                  </td>
                  <td className="px-5 py-3 font-bold">৳{(d.amount / 100).toFixed(2)}</td>
                  <td className="px-5 py-3 text-slate-600">{d.methodCode}</td>
                  <td className="px-5 py-3 text-slate-600">{d.senderNumber}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">{d.transactionId}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {new Date(d.createdAt).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      d.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      d.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{d.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    {d.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActionId(d._id); setAction('approved'); }}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >Approve</button>
                        <button
                          onClick={() => { setActionId(d._id); setAction('rejected'); }}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {actionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-extrabold text-lg mb-2 capitalize">{action} Deposit</h3>
            <p className="text-sm text-slate-600 mb-3">
              Are you sure you want to <b className="capitalize">{action}</b> this deposit request?
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Admin note (optional)"
              rows={2}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setActionId(null); setAction(''); setNote(''); }}
                className="flex-1 border rounded-xl py-3 text-sm font-bold"
              >Cancel</button>
              <button
                onClick={handleAction}
                disabled={updating}
                className={`flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 ${
                  action === 'approved' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >{updating ? 'Saving…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
