// src/components/admin/AdminSidebar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SIDEBAR — permission-aware navigation.
//
// Each nav item has a `permission` key. The sidebar filters the list and only
// renders items the current user has permission to see.
//
// HOW TO ADD A NEW NAV ITEM:
// 1. Add a new object to the `adminNav` array below
// 2. Set `permission` to the key from src/lib/adminPermissions.js
// 3. Create the matching page at src/app/admin/your-page/page.jsx
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission } from '@/lib/adminPermissions';

// ── Nav items ─────────────────────────────────────────────────────────────────
// `href`       → the URL this item links to
// `permission` → the user must have this permission for the item to show
const adminNav = [
  { href: '/admin',              icon: '📊', label: 'Dashboard',    permission: 'DASHBOARD_VIEW'    },
  { href: '/admin/users',        icon: '👥', label: 'Users',        permission: 'USER_VIEW'         },
  { href: '/admin/products',     icon: '📦', label: 'Products',     permission: 'PRODUCT_VIEW'      },
  { href: '/admin/transactions', icon: '💰', label: 'Transactions', permission: 'TRANSACTION_VIEW'  },
  { href: '/admin/reports',      icon: '📈', label: 'Reports',      permission: 'REPORT_VIEW'       },
  { href: '/admin/settings',     icon: '⚙️', label: 'Settings',     permission: 'SETTINGS_VIEW'     },
];

export default function AdminSidebar({ userPermissions = [], userName = 'Admin User', userRole = 'Admin' }) {
  // usePathname gives us the current URL so we can highlight the active item
  const pathname = usePathname();

  // Only show nav items the user has permission for
  const visibleNav = adminNav.filter(item =>
    hasPermission(userPermissions, item.permission)
  );

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto">

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 shrink-0">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 text-white text-2xl grid place-items-center">⚡</span>
        <span>
          <b className="block text-xl">Maaza International Admin</b>
          <small className="text-xs text-slate-500">Control panel</small>
        </span>
      </div>

      {/* Nav — only items the user can access */}
      <nav className="space-y-1">
        {visibleNav.map(({ href, icon, label }) => {
          // Highlight the active page:
          // For /admin exactly, only match exact. For sub-pages, match prefix.
          const isActive = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="mt-auto space-y-4 shrink-0">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <b className="text-sm">Admin Tools</b>
          <p className="text-xs text-slate-500 mt-1">Manage users, products and transactions</p>
        </div>
        <div className="flex items-center gap-2 px-2">
          {/* Avatar initials — first letter of name */}
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 grid place-items-center font-bold text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <b className="text-xs block">{userName}</b>
            <small className="text-[10px] text-slate-500">{userRole}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
