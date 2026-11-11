'use client';

// Header — sticky top bar shown on all screen sizes
// Props:
//   showPage  — function to navigate to a dashboard page
//   user      — logged-in user object from Redux
//   onLogout  — function to sign the user out
import { useI18n } from '@/lib/i18n';
import { notify } from '@/lib/toast';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

export default function Header({ showPage, user, onLogout }) {
  const { t } = useI18n();

  // Search: pressing Enter navigates to matching page
  function handleSearch(e) {
    if (e.key !== 'Enter') return;
    const q = e.target.value.toLowerCase();
    if (q.includes('product'))     showPage('products');
    else if (q.includes('task'))   showPage('tasks');
    else if (q.includes('wallet') || q.includes('transaction')) showPage('transactions');
    else if (q.includes('news'))   showPage('news');
    else notify.info('Try products, tasks, wallet or news.');
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="h-[66px] lg:h-[78px] px-4 sm:px-6 xl:px-9 flex items-center gap-2 sm:gap-3">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <span className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-xl grid place-items-center">✦</span>
          <b className="text-base sm:text-lg truncate">Maaza International</b>
        </div>

        {/* Desktop search bar */}
        <div className="hidden lg:block relative w-full max-w-sm">
          <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
          <input
            onKeyDown={handleSearch}
            placeholder={t('header.search')}
            className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-harvest-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* Language switcher — saved and applied across the app */}
          <LanguageSwitcher />

          {/* User avatar — clicking goes to profile page */}
          <button
            onClick={() => showPage('profile')}
            className="flex items-center gap-2 sm:border-l sm:pl-3 min-w-0"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-harvest-100 text-harvest-700 grid place-items-center text-xs font-extrabold">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : '??'}
            </span>
            <span className="hidden md:block text-left min-w-0">
              <b className="block text-xs truncate max-w-[140px]">{user?.fullName || t('common.loading')}</b>
              <small className="text-[10px] text-slate-500">Level {user?.membershipLevel || 1}</small>
            </span>
          </button>

          <button
            onClick={onLogout}
            title={t('header.signOut')}
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 border-l pl-3 transition-colors"
          >
            ⏻ {t('header.signOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
