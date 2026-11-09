'use client';

// MobileNav — fixed bottom bar, only visible on mobile (hidden on lg+)
// Shows 5 main pages for quick access

const mobileNavItems = [
  { page: 'overview',  icon: '⌂', label: 'Home' },
  { page: 'products',  icon: '▦', label: 'Products' },
  { page: 'purchased', icon: '▣', label: 'My items' },
  { page: 'community', icon: '◎', label: 'Community' },
  { page: 'profile',   icon: '◉', label: 'Profile' },
];

export default function MobileNav({ activePage, showPage }) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t safe-bottom">
      <div className="flex justify-around px-1 pt-2 pb-1">
        {mobileNavItems.map(({ page, icon, label }) => (
          <button
            key={page}
            onClick={() => showPage(page)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 text-xs ${activePage === page ? 'nav-active rounded-xl' : 'text-slate-500'}`}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
