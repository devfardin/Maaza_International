'use client';
import NotificationBell from '@/components/admin/NotificationBell';

export default function AdminHeader({ userRole = 'admin', userName = 'Admin User', onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="h-[66px] lg:h-[78px] px-4 sm:px-6 xl:px-9 flex items-center gap-3">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 text-white text-xl grid place-items-center">⚡</span>
          <b className="text-lg">Admin</b>
        </div>

        {/* Live search placeholder (desktop) */}
        <div className="hidden lg:block relative w-full max-w-sm">
          <input
            placeholder="Search users, products, transactions..."
            className="w-full rounded-xl border bg-slate-50 py-2.5 pl-4 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-xs font-bold text-blue-700 capitalize">{userRole.replace('_', ' ')}</span>
          </div>

          <NotificationBell />

          <div className="flex items-center gap-2 sm:border-l sm:pl-3">
            <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 grid place-items-center text-xs font-extrabold">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden md:block text-left">
              <b className="block text-xs">{userName}</b>
              <small className="text-[10px] text-slate-500 capitalize">{userRole.replace('_', ' ')}</small>
            </span>
          </div>

          <button onClick={onLogout} className="ml-1 px-3 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
