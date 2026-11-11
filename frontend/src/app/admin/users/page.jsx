'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  useGetAllUsersQuery,
  useChangeUserStatusMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateAdminMutation,
} from '@/redux/features/apiSlice';

const STATUS_COLORS = {
  active:    'bg-emerald-50 text-emerald-700',
  suspended: 'bg-amber-50 text-amber-700',
  blocked:   'bg-rose-50 text-rose-700',
};
const ROLE_COLORS = {
  user:        'bg-slate-100 text-slate-700',
  admin:       'bg-blue-50 text-blue-700',
  super_admin: 'bg-violet-50 text-violet-700',
};

const inputCls = 'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500';

export default function AdminUsersPage() {
  const me = useSelector((s) => s.auth.user);
  const isSuper = me?.role === 'super_admin';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirm, setConfirm] = useState(null); // { user, action: 'active'|'suspended'|'blocked'|'delete'|'promote'|'demote' }
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useGetAllUsersQuery();
  const [changeStatus, { isLoading: changing }] = useChangeUserStatusMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [createAdmin, { isLoading: creating }] = useCreateAdminMutation();

  const q = search.trim().toLowerCase();
  const users = (data?.data || []).filter((u) =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (!q || u.fullName?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q))
  );

  // Mirrors the backend rules: never yourself, never a super_admin, admins only by a super_admin
  const canManage = (u) => u._id !== me?._id && u.role !== 'super_admin' && (u.role !== 'admin' || isSuper);

  async function runConfirm() {
    if (!confirm) return;
    setError('');
    const { user, action } = confirm;
    try {
      if (action === 'delete') await deleteUser(user._id).unwrap();
      else if (action === 'promote') await updateUser({ id: user._id, role: 'admin' }).unwrap();
      else if (action === 'demote') await updateUser({ id: user._id, role: 'user' }).unwrap();
      else await changeStatus({ id: user._id, status: action }).unwrap();
      setConfirm(null);
    } catch (e) {
      setError(e?.data?.message || 'Action failed.');
    }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.target);
    try {
      await createAdmin({
        fullName: f.get('fullName'),
        email: f.get('email'),
        phone: f.get('phone'),
        passwordHash: f.get('password'),
      }).unwrap();
      setShowCreate(false);
    } catch (err) {
      const first = err?.data?.errorSources?.[0];
      setError(first?.message || err?.data?.message || 'Could not create admin.');
    }
  }

  const actionButtons = (u) => {
    if (!canManage(u)) return <span className="text-xs text-slate-400">—</span>;
    const btn = (action, text, cls) => (
      <button key={action} onClick={() => { setError(''); setConfirm({ user: u, action }); }}
        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${cls}`}>{text}</button>
    );
    return (
      <div className="flex flex-wrap gap-1.5">
        {u.status !== 'active'    && btn('active',    'Activate', 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}
        {u.status !== 'suspended' && btn('suspended', 'Suspend',  'bg-amber-50 text-amber-700 hover:bg-amber-100')}
        {u.status !== 'blocked'   && btn('blocked',   'Block',    'bg-rose-50 text-rose-700 hover:bg-rose-100')}
        {isSuper && u.role === 'user'  && btn('promote', 'Make admin', 'bg-blue-50 text-blue-700 hover:bg-blue-100')}
        {isSuper && u.role === 'admin' && btn('demote',  'Make user',  'bg-slate-100 text-slate-700 hover:bg-slate-200')}
        {btn('delete', 'Delete', 'bg-slate-100 text-rose-700 hover:bg-rose-50')}
      </div>
    );
  };

  const confirmText = {
    delete:  'delete this account',
    promote: 'give this user ADMIN access',
    demote:  'remove admin access from this account',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all registered users{isSuper ? ' and admins' : ''}.</p>
        </div>
        {isSuper && (
          <button onClick={() => { setError(''); setShowCreate(true); }}
            className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-bold">+ Create admin</button>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or email…" className={inputCls} />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'user', 'admin', 'super_admin'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold capitalize ${roleFilter === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {isLoading && <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />}
        {!isLoading && users.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No users found.</p>}
        {users.map((u) => (
          <div key={u._id} className="bg-white border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-bold shrink-0">{u.fullName?.charAt(0).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="font-bold truncate">{u.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{u.phone} · {u.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[u.role]}`}>{u.role.replace('_', ' ')}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100">Lv {u.membershipLevel}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[u.status]}`}>{u.status}</span>
            </div>
            <div className="mt-3 pt-3 border-t space-y-2">
              {actionButtons(u)}
              <Link href={`/admin/activity?userId=${u._id}`} className="inline-block text-xs font-bold text-blue-600">View devices &amp; IPs →</Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                {['User', 'Phone', 'Role', 'Level', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-5 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>}
              {!isLoading && users.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No users found.</td></tr>}
              {users.map((u) => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-slate-50 align-top">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">{u.fullName?.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-semibold">{u.fullName}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                        <Link href={`/admin/activity?userId=${u._id}`} className="text-[11px] font-bold text-blue-600">devices &amp; IPs</Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.phone}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold capitalize px-2 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3 font-semibold">Lv {u.membershipLevel}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[u.status]}`}>{u.status}</span></td>
                  <td className="px-5 py-3 max-w-[280px]">{actionButtons(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-extrabold text-lg mb-2">Confirm action</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to{' '}
              {confirmText[confirm.action] || <>set this user&apos;s status to <b>{confirm.action}</b></>}
              {' '}for <b>{confirm.user.fullName}</b>?
            </p>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
              <button onClick={runConfirm} disabled={changing || updating || deleting}
                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <form onSubmit={handleCreateAdmin} className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-lg">Create admin</h3>
            <input name="fullName" required minLength={2} placeholder="Full name" className={inputCls} />
            <input name="email" type="email" required placeholder="Email" className={inputCls} />
            <input name="phone" required pattern="\+?[0-9]{11}" title="11 digit phone number" placeholder="Phone (11 digits)" className={inputCls} />
            <input name="password" type="password" required minLength={8} placeholder="Password (min 8 characters)" className={inputCls} />
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
              <button disabled={creating} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">{creating ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
