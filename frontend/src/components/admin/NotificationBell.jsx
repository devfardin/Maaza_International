'use client';
// Admin notification bell — shows deposit requests, withdrawal requests and product
// purchases as they happen. Polls every 15s and shows a top-right toast for new events.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/redux/features/apiSlice';
import { notify } from '@/lib/toast';
import { playNotificationSound } from '@/lib/sound';

const ICON = { deposit_request: '💳', withdrawal_request: '💸', product_purchase: '🛒' };
const TARGET = { deposit_request: '/admin/deposits', withdrawal_request: '/admin/withdrawals', product_purchase: '/admin/transactions' };

function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(value).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const seenIds = useRef(null); // ids already known — null until first load

  const { data } = useGetNotificationsQuery(20, { pollingInterval: 15000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const items = data?.data?.items ?? [];
  const unread = data?.data?.unreadCount ?? 0;

  // Live toast for each event that arrives after the first load
  useEffect(() => {
    if (!data?.data) return;
    const ids = items.map((n) => n._id);
    if (seenIds.current === null) {
      seenIds.current = new Set(ids);
      return;
    }
    const fresh = items.filter((n) => !seenIds.current.has(n._id));
    if (fresh.length) playNotificationSound();
    fresh.forEach((n) => {
      notify.info(n.title, { description: n.message });
    });
    ids.forEach((id) => seenIds.current.add(id));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the panel on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  async function openItem(n) {
    if (!n.isRead) await markRead(n._id).unwrap().catch(() => {});
    setOpen(false);
    router.push(TARGET[n.type] || '/admin');
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative w-10 h-10 rounded-xl border grid place-items-center text-base hover:bg-slate-50"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold grid place-items-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] rounded-2xl border bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <b className="text-sm">Notifications</b>
            <button
              onClick={() => markAll()}
              disabled={markingAll || unread === 0}
              className="text-xs font-bold text-blue-700 disabled:text-slate-300"
            >
              Mark all read
            </button>
          </div>

          <ul className="max-h-[60vh] overflow-y-auto divide-y">
            {items.length === 0 && <li className="p-6 text-center text-sm text-slate-400">No activity yet.</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button onClick={() => openItem(n)} className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 ${n.isRead ? '' : 'bg-blue-50/50'}`}>
                  <span className="text-lg leading-none mt-0.5">{ICON[n.type] || '🔔'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <b className="text-sm truncate">{n.title}</b>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                    </span>
                    <span className="block text-xs text-slate-600 mt-0.5 break-words">{n.message}</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
