'use client';

// Sidebar — shown only on large screens (lg+)
// Each nav button calls showPage() from the parent dashboard
import { useI18n } from '@/lib/i18n';
import { notify } from '@/lib/toast';

const workspaceNav = [
  { page: 'overview',  icon: '⌂', key: 'nav.overview' },
  { page: 'products',  icon: '▦', key: 'nav.products' },
  { page: 'purchased', icon: '▣', key: 'nav.myProducts' },
  { page: 'tasks',     icon: '✧', key: 'nav.tasks' },
  { page: 'community', icon: '◎', key: 'nav.community' },
  { page: 'news',      icon: '▤', key: 'nav.news' },
];

const accountNav = [
  { page: 'recharge',     icon: '＋', key: 'nav.recharge' },
  { page: 'withdraw',     icon: '↗', key: 'nav.withdrawals' },
  { page: 'transactions', icon: '◈', key: 'nav.transactions' },
  { page: 'bank',         icon: '▤', key: 'nav.bank' },
  { page: 'referrals',    icon: '♧', key: 'nav.referrals' },
  { page: 'profile',      icon: '◉', key: 'nav.profile' },
];

// Props:
//   activePage — current page segment (e.g. 'products', 'overview')
//   showPage   — function to navigate to a page
//   user       — logged-in user object from Redux
//   onLogout   — function to sign the user out
export default function Sidebar({ activePage, showPage, user, onLogout }) {
  const { t } = useI18n();

  const renderItem = ({ page, icon, key }) => (
    <button
      key={page}
      onClick={() => showPage(page)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:bg-[#e8f5e9] hover:text-[#176b43] font-medium ${activePage === page ? 'nav-active' : 'text-slate-700'}`}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {t(key)}
    </button>
  );

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen bg-white border-r border-slate-200 p-5 flex-col gap-6 overflow-y-auto w-64 [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-[#176b43] [&::-webkit-scrollbar-thumb]:rounded-full">

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 shrink-0">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-2xl grid place-items-center">✦</span>
        <span>
          <b className="block text-xl">Maaza International</b>
          <small className="text-xs text-slate-500">{t('brand.tagline')}</small>
        </span>
      </div>

      <div>
        <p className="text-[10px] tracking-widest font-extrabold text-slate-400 px-3 mb-2">{t('section.workspace')}</p>
        <nav className="space-y-1">{workspaceNav.map(renderItem)}</nav>
      </div>

      <div>
        <p className="text-[10px] tracking-widest font-extrabold text-slate-400 px-3 mb-2">{t('section.wallet')}</p>
        <nav className="space-y-1">{accountNav.map(renderItem)}</nav>
      </div>

      {/* Support box — pushed to bottom with mt-auto */}
      <div className="mt-auto rounded-2xl border border-harvest-100 bg-harvest-50 p-4 shrink-0">
        <b className="text-sm">Need some help?</b>
        <p className="text-xs leading-5 text-slate-500 mt-1 mb-3">Find answers or contact support.</p>
        <button
          onClick={() => notify.info('Support will be connected here soon.')}
          className="bg-harvest-700 text-white text-xs font-bold rounded-xl px-3 py-3 w-full"
        >
          Contact support ↗
        </button>
      </div>

      {/* User info + logout at very bottom */}
      <div className="flex items-center gap-2 px-2 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-harvest-100 text-harvest-700 grid place-items-center font-bold text-xs">
          {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : '??'}
        </div>
        <div className="flex-1 min-w-0">
          <b className="text-xs block truncate">{user?.fullName || t('common.loading')}</b>
          <small className="text-[10px] text-slate-500">Level {user?.membershipLevel || 1}</small>
        </div>
        <button onClick={onLogout} title={t('header.signOut')} className="text-slate-400 hover:text-rose-500 transition-colors text-xl">
          ⏻
        </button>
      </div>
    </aside>
  );
}
