'use client';
// Super admin only: everything that was soft-deleted (hidden from the site, still in the database).
// A record can be removed for good here, unless it still has purchase, money or referral history.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetDeletedItemsQuery, usePermanentlyDeleteItemMutation } from '@/redux/features/apiSlice';
import PageLoader from '@/components/shared/PageLoader';
import { formatDateTime } from '@/components/shared/money';
import { notify, getErrorMessage } from '@/lib/toast';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'users', label: 'Members' },
  { value: 'news', label: 'News' },
  { value: 'popups', label: 'Popups' },
  { value: 'community', label: 'Community' },
  { value: 'tasks', label: 'Tasks' },
];

const KIND_COLORS = 'bg-slate-100 text-slate-600';

function ConfirmDelete({ item, onCancel, onConfirm, busy }) {
  const [typed, setTyped] = useState('');
  const ready = typed.trim() === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl">
        <h2 className="font-extrabold text-lg text-rose-700">Delete permanently?</h2>
        <p className="mt-2 text-sm text-slate-600">
          <b>{item.title}</b> ({item.typeLabel}) will be removed from the database. This cannot be undone.
        </p>
        <label htmlFor="confirm-delete" className="mt-5 block text-xs font-bold text-slate-600">
          Type <span className="text-rose-700">DELETE</span> to confirm
        </label>
        <input
          id="confirm-delete"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-rose-500"
        />
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border py-3 text-sm font-bold">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready || busy}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeletedItemsAdmin() {
  const me = useSelector((s) => s.auth.user);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState(null);

  const { data, isLoading, isFetching } = useGetDeletedItemsQuery(tab, { skip: me?.role !== 'super_admin' });
  const [permanentlyDeleteItem, { isLoading: deleting }] = usePermanentlyDeleteItemMutation();

  if (me && me.role !== 'super_admin') {
    return (
      <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-500">
        Only the super admin can view deleted items.
      </div>
    );
  }

  const payload = data?.data ?? { items: [], counts: {} };
  const q = search.trim().toLowerCase();
  const items = payload.items.filter((i) => !q || i.title.toLowerCase().includes(q) || i.subtitle?.toLowerCase().includes(q));

  async function handleDelete() {
    const item = confirming;
    try {
      await permanentlyDeleteItem({ kind: item.kind, id: item.id }).unwrap();
      notify.success(`"${item.title}" was deleted permanently.`);
      setConfirming(null);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not delete this item.'));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Deleted items</h1>
        <p className="text-sm text-slate-500 mt-1">
          Items removed from the site stay here. Delete them permanently only when you are sure.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const count = t.value === 'all'
              ? Object.values(payload.counts ?? {}).reduce((a, b) => a + b, 0)
              : payload.counts?.[t.value] ?? 0;
            const on = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                aria-pressed={on}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${on ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {t.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or title"
          className="w-full sm:w-64 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        {isLoading && <PageLoader label="Loading deleted items…" />}

        {!isLoading && items.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">Nothing deleted here.</div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Item</th>
                  <th className="px-5 py-3 font-bold">Type</th>
                  <th className="px-5 py-3 font-bold">Deleted on</th>
                  <th className="px-5 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60' : ''}>
                {items.map((item) => (
                  <tr key={`${item.kind}-${item.id}`} className="border-t">
                    <td className="px-5 py-3.5">
                      <b className="block">{item.title}</b>
                      {item.subtitle && <span className="text-xs text-slate-400">{item.subtitle}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_COLORS}`}>{item.typeLabel}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDateTime(item.deletedAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {item.blockedReason ? (
                        <span className="text-xs text-slate-400" title={item.blockedReason}>Cannot delete: {item.blockedReason.toLowerCase()}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(item)}
                          className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Delete permanently
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirming && (
        <ConfirmDelete item={confirming} busy={deleting} onCancel={() => setConfirming(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
