'use client';
// Super admin only: track what every admin did — approvals, rejections,
// user status changes, product changes — with a per-admin filter.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminActivityQuery, useGetAdminActivitySummaryQuery } from '@/redux/features/apiSlice';
import PageLoader from '@/components/shared/PageLoader';
import { formatDateTime } from '@/components/shared/money';

const ACTION_LABEL = {
  deposit_approved: 'Approved deposit',
  deposit_rejected: 'Rejected deposit',
  withdrawal_approved: 'Marked withdrawal paid',
  withdrawal_rejected: 'Rejected withdrawal',
  user_status_changed: 'Changed user status',
  user_updated: 'Edited user',
  user_deleted: 'Deleted user',
  product_created: 'Created product',
  product_updated: 'Updated product',
  product_deleted: 'Deleted product',
};

export default function AdminActivityPage() {
  const role = useSelector((s) => s.auth.user?.role);
  const [adminId, setAdminId] = useState('');

  const { data: summaryData, isLoading: summaryLoading } = useGetAdminActivitySummaryQuery(undefined, {
    skip: role !== 'super_admin',
    pollingInterval: 30000,
  });
  const { data: logData, isLoading: logLoading } = useGetAdminActivityQuery(
    { adminId, limit: 200 },
    { skip: role !== 'super_admin', pollingInterval: 30000 }
  );

  if (role && role !== 'super_admin') {
    return <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-500">Only the super admin can view admin activity.</div>;
  }

  const admins = summaryData?.data ?? [];
  const logs = logData?.data ?? [];
  const selectedName = admins.find((a) => String(a._id) === adminId)?.adminName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Admin activity</h1>
        <p className="text-sm text-slate-500 mt-1">See which admin approved, rejected or changed what, and when.</p>
      </div>

      {/* Per-admin summary */}
      <section>
        <h2 className="font-extrabold mb-3">Admins</h2>
        {summaryLoading ? (
          <PageLoader label="Loading admins…" className="py-6" />
        ) : admins.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-center text-sm text-slate-400">No admin actions recorded yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <button
              onClick={() => setAdminId('')}
              className={`text-left rounded-2xl border p-4 bg-white ${adminId === '' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <b className="block text-sm">All admins</b>
              <span className="text-xs text-slate-500">Show every action</span>
            </button>
            {admins.map((a) => (
              <button
                key={String(a._id)}
                onClick={() => setAdminId(String(a._id))}
                className={`text-left rounded-2xl border p-4 bg-white min-w-0 ${adminId === String(a._id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm truncate">{a.adminName || 'Admin'}</b>
                  <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${a.adminRole === 'super_admin' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                    {a.adminRole?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{a.totalActions} actions</p>
                <p className="text-[11px] text-slate-400">Last active {formatDateTime(a.lastActionAt)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Activity log */}
      <section className="bg-white border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-extrabold">{selectedName ? `Actions by ${selectedName}` : 'All admin actions'}</h2>
          <span className="text-xs text-slate-500">{logs.length} shown</span>
        </div>

        {logLoading ? (
          <PageLoader label="Loading activity…" className="py-6" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No activity yet.</p>
        ) : (
          <ul className="divide-y">
            {logs.map((l) => (
              <li key={l._id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <b>{l.adminName || 'Admin'}</b>{' '}
                    <span className="text-slate-500">·</span>{' '}
                    <span className="font-semibold">{ACTION_LABEL[l.action] || l.action}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 break-words">{l.summary}</p>
                </div>
                <time className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{formatDateTime(l.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
