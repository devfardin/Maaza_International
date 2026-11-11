'use client';
// Login / registration tracking: who, from which IP, on what device / browser / OS.
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetActivityLogsQuery } from '@/redux/features/apiSlice';

const EVENTS = [
  { id: '',             label: 'All' },
  { id: 'register',     label: 'Registrations' },
  { id: 'login',        label: 'Logins' },
  { id: 'login_failed', label: 'Failed logins' },
];
const EVENT_STYLE = {
  register:     'bg-violet-50 text-violet-700',
  login:        'bg-emerald-50 text-emerald-700',
  login_failed: 'bg-rose-50 text-rose-700',
};
const DEVICE_ICON = { mobile: '📱', tablet: '📟', desktop: '💻', bot: '🤖', unknown: '❔' };

function ActivityInner() {
  const params = useSearchParams();
  const userId = params.get('userId') || '';
  const [event, setEvent] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetActivityLogsQuery({ userId, event, limit: 300 });
  const q = search.trim().toLowerCase();
  const rows = (data?.data || []).filter((l) =>
    !q || l.ip?.includes(q) || l.phone?.includes(q) || l.userId?.fullName?.toLowerCase().includes(q) ||
    l.browser?.toLowerCase().includes(q) || l.os?.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Activity &amp; devices</h1>
        <p className="text-sm text-slate-500 mt-1">
          IP address, device type, browser and OS captured at registration and login.
          {userId && <> Showing one user only. <a href="/admin/activity" className="text-blue-600 font-bold">Show all</a></>}
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, IP, browser or OS…"
          className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {EVENTS.map((e) => (
            <button key={e.id} onClick={() => setEvent(e.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold ${event === e.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {isLoading && <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />}
        {!isLoading && rows.length === 0 && <p className="text-center text-sm text-slate-400 py-10">No activity found.</p>}
        {rows.map((l) => (
          <div key={l._id} className="bg-white border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{l.userId?.fullName || l.phone || 'Unknown'}</p>
                <p className="text-xs text-slate-400">{l.phone}</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${EVENT_STYLE[l.event]}`}>{l.event.replace('_', ' ')}</span>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs mt-3">
              <div><dt className="text-slate-400">IP</dt><dd className="font-semibold break-all">{l.ip}</dd></div>
              <div><dt className="text-slate-400">Device</dt><dd className="font-semibold capitalize">{DEVICE_ICON[l.deviceType]} {l.deviceType}</dd></div>
              <div><dt className="text-slate-400">Browser</dt><dd className="font-semibold">{l.browser}</dd></div>
              <div><dt className="text-slate-400">OS</dt><dd className="font-semibold">{l.os}</dd></div>
            </dl>
            <p className="text-[11px] text-slate-400 mt-2">{new Date(l.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                {['When', 'User', 'Event', 'IP address', 'Device', 'Browser', 'OS'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>}
              {!isLoading && rows.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No activity found.</td></tr>}
              {rows.map((l) => (
                <tr key={l._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3"><p className="font-semibold">{l.userId?.fullName || '—'}</p><p className="text-xs text-slate-400">{l.phone}</p></td>
                  <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${EVENT_STYLE[l.event]}`}>{l.event.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3 font-mono text-xs">{l.ip}</td>
                  <td className="px-5 py-3 capitalize whitespace-nowrap">{DEVICE_ICON[l.deviceType]} {l.deviceType}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{l.browser}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{l.os}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminActivityPage() {
  return <Suspense><ActivityInner /></Suspense>;
}
