'use client';
// ADMIN NAVIGATION
//   • Desktop (lg+): fixed sidebar
//   • Mobile/tablet : bottom tab bar (scrolls horizontally) so every page is reachable
// Items marked `superOnly` are shown to super_admin only (the backend enforces it too).

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const adminNav = [
  { href: '/admin',              icon: '📊', label: 'Dashboard'    },
  { href: '/admin/users',        icon: '👥', label: 'Users'        },
  { href: '/admin/products',     icon: '📦', label: 'Products'     },
  { href: '/admin/deposits',     icon: '💳', label: 'Deposits'     },
  { href: '/admin/transactions', icon: '💰', label: 'Transactions' },
  { href: '/admin/activity',     icon: '🛡️', label: 'Activity'     },
];

const isActiveRoute = (pathname, href) =>
  href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

export default function AdminSidebar({ userName = 'Admin', userRole = 'admin' }) {
  const pathname = usePathname();
  const items = adminNav.filter((i) => !i.superOnly || userRole === 'super_admin');

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-3 px-2 shrink-0">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 text-white text-2xl grid place-items-center">⚡</span>
          <span>
            <b className="block text-lg leading-tight">Maaza Admin</b>
            <small className="text-xs text-slate-500 capitalize">{userRole.replace('_', ' ')}</small>
          </span>
        </div>

        <nav className="space-y-1">
          {items.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActiveRoute(pathname, href) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 px-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 grid place-items-center font-bold text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <b className="text-xs block truncate">{userName}</b>
            <small className="text-[10px] text-slate-500 capitalize">{userRole.replace('_', ' ')}</small>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav
        aria-label="Admin navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex overflow-x-auto no-scrollbar">
          {items.map(({ href, icon, label }) => (
            <li key={href} className="flex-1 min-w-[72px]">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  isActiveRoute(pathname, href) ? 'text-blue-700 font-bold' : 'text-slate-500'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
