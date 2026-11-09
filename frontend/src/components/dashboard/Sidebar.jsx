'use client';

// Sidebar — shown only on large screens (lg+)
// Each nav button calls showPage() from the parent dashboard

// WORKSPACE nav items (top section)
const workspaceNav = [
  { page: 'overview',   icon: '⌂', label: 'Overview' },
  { page: 'products',   icon: '▦', label: 'Products' },
  { page: 'purchased',  icon: '▣', label: 'My products' },
  { page: 'tasks',      icon: '✧', label: 'Task bonus' },
  { page: 'community',  icon: '◎', label: 'Community' },
  { page: 'news',       icon: '▤', label: 'News & updates' },
];

// WALLET & ACCOUNT nav items (bottom section)
const accountNav = [
  { page: 'recharge',     icon: '＋', label: 'Recharge wallet' },
  { page: 'withdraw',     icon: '↗', label: 'Withdrawals' },
  { page: 'transactions', icon: '◈', label: 'Transactions' },
  { page: 'bank',         icon: '▤', label: 'Bank details' },
  { page: 'referrals',    icon: '♧', label: 'Referral center' },
  { page: 'profile',      icon: '◉', label: 'My profile' },
];

// Props:
//   activePage — current page segment (e.g. 'products', 'overview')
//   showPage   — function to navigate to a page
//   showToast  — function to show a toast notification
//   user       — logged-in user object from Redux (name, membershipLevel, etc.)
//   onLogout   — function to sign the user out
export default function Sidebar({ activePage, showPage, showToast, user, onLogout }) {
  return (
    // Sidebar: sticky, full height, only visible on lg screens
    // FIX: added overflow-y-auto so content doesn't overflow on small height screens
    <aside className="hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto w-64 
            [&::-webkit-scrollbar]:w-[2px] 
            [&::-webkit-scrollbar-track]:bg-slate-200]
            [&::-webkit-scrollbar-thumb]:bg-[#176b43] 
            [&::-webkit-scrollbar-thumb]:rounded-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 shrink-0">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-2xl grid place-items-center">✦</span>
        <span>
          <b className="block text-xl">Maaza International</b>
          <small className="text-xs text-slate-500">Grow with purpose</small>
        </span>
      </div>

      {/* WORKSPACE section */}
      <div>
        <p className="text-[10px] tracking-widest font-extrabold text-slate-400 px-3 mb-2">WORKSPACE</p>
        <nav className="space-y-1">
          {workspaceNav.map(({ page, icon, label }) => (
            <button
              key={page}
              onClick={() => showPage(page)}
              // nav-active class is applied when this page is the current one
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:bg-[#e8f5e9] hover:text-[#176b43] font-medium ${activePage === page ? 'nav-active' : 'text-slate-700'}`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* WALLET & ACCOUNT section */}
      <div>
        <p className="text-[10px] tracking-widest font-extrabold text-slate-400 px-3 mb-2">WALLET & ACCOUNT</p>
        <nav className="space-y-1">
          {accountNav.map(({ page, icon, label }) => (
            <button
              key={page}
              onClick={() => showPage(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:bg-[#e8f5e9] hover:text-[#176b43] ${activePage === page ? 'nav-active' : 'text-slate-700'}`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Support box — pushed to bottom with mt-auto */}
      <div className="mt-auto rounded-2xl border border-harvest-100 bg-harvest-50 p-4 shrink-0">
        <b className="text-sm">Need some help?</b>
        <p className="text-xs leading-5 text-slate-500 mt-1 mb-3">Find answers or contact support.</p>
        <button
          onClick={() => showToast('Support will be connected here.')}
          className="bg-harvest-700 text-white text-xs font-bold rounded-xl px-3 py-3 w-full"
        >
          Contact support ↗
        </button>
      </div>

      {/* User info + logout at very bottom */}
      <div className="flex items-center gap-2 px-2 shrink-0">
        {/* Avatar — shows first 2 letters of the user's name */}
        <div className="w-9 h-9 rounded-xl bg-harvest-100 text-harvest-700 grid place-items-center font-bold text-xs">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : '??'}
        </div>
        <div className="flex-1 min-w-0">
          <b className="text-xs block truncate">{user?.fullName || 'Loading...'}</b>
          <small className="text-[10px] text-slate-500">Level {user?.membershipLevel || 'Member'}</small>
        </div>
        {/* Logout button */}
        <button onClick={onLogout} title="Sign out"
          className="text-slate-400 hover:text-rose-500 transition-colors text-xl">
          ⏻
        </button>
      </div>
    </aside>
  );
}
