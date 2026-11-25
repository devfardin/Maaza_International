'use client';

import { useI18n } from '@/lib/i18n';

const mobileNavItems = [
  {
    page: 'home', key: 'nav.home',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    page: 'products', key: 'nav.products',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
      </svg>
    ),
  },
  {
    page: 'community', key: 'nav.community', center: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    page: 'news', key: 'nav.news',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
      </svg>
    ),
  },
  {
    page: 'me', key: 'nav.me',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    ),
  },
];

export default function MobileNav({ activePage, showPage }) {
  const { t } = useI18n();

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-1.5 pb-1.5 pb-[calc(0.15rem+env(safe-area-inset-bottom))] pointer-events-none">
      <nav
        className="pointer-events-auto flex items-center justify-around rounded-xl px-1 py-1"
        style={{
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.18), 0 2px 0px rgba(163,230,53,0.3) inset',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        {mobileNavItems.map(({ page, icon, key, center }) => {
          const active = activePage === page;

          /* ── Centre FAB ── */
          if (center) {
            return (
              <div key={page} className="flex flex-col items-center -mt-8">
                <button
                  onClick={() => showPage(page)}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 active:scale-90"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #a3e635 0%, #176b43 100%)'
                      : 'linear-gradient(135deg, #176b43 0%, #103f2c 100%)',
                    boxShadow: active
                      ? '0 4px 20px rgba(163,230,53,0.5), 0 2px 8px rgba(23,107,67,0.4)'
                      : '0 4px 16px rgba(16,63,44,0.45)',
                  }}
                >
                  <span style={{ color: active ? '#103f2c' : '#a3e635' }}>{icon}</span>
                </button>
                <span
                  className="mt-1 text-xs font-bold"
                  style={{ color: active ? '#176b43' : '#494a4a' }}
                >
                  {t(key)}
                </span>
              </div>
            );
          }

          /* ── Regular tab ── */
          return (
            <button
              key={page}
              onClick={() => showPage(page)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all duration-200 active:scale-90"
            >
              {/* icon wrapper with active bg */}
              <span
                className="flex items-center justify-center w-11 h-9 rounded-xl transition-all duration-200"
                // style={{
                //   background: active ? 'rgba(23,107,67,0.1)' : 'transparent',
                // }}
              >
                <span
                  className="transition-all duration-200"
                  style={{
                    color: active ? '#176b43' : '#494a4a',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    display: 'block',
                  }}
                >
                  {icon}
                </span>
              </span>

              <span
                className="text-xs font-bold leading-none transition-all duration-200"
                style={{ color: active ? '#176b43' : '#494a4a' }}
              >
                {t(key)}
              </span>

              {/* active dot */}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
