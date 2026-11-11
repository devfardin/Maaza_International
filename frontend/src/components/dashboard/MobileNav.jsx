'use client';

// MobileNav — fixed bottom bar, only visible on mobile (hidden on lg+)
import { useI18n } from '@/lib/i18n';

const mobileNavItems = [
  { page: 'overview',  icon: '⌂', key: 'nav.overview' },
  { page: 'products',  icon: '▦', key: 'nav.products' },
  { page: 'recharge',  icon: '＋', key: 'nav.recharge' },
  { page: 'withdraw',  icon: '↗', key: 'nav.withdrawals' },
  { page: 'profile',   icon: '◉', key: 'nav.profile' },
];

export default function MobileNav({ activePage, showPage }) {
  const { t } = useI18n();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around px-1 pt-2 pb-1">
        {mobileNavItems.map(({ page, icon, key }) => (
          <button
            key={page}
            onClick={() => showPage(page)}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold ${activePage === page ? 'nav-active rounded-xl' : 'text-slate-500'}`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="truncate max-w-full">{t(key)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
