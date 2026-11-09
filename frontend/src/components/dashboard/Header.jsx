'use client';

// Header — sticky top bar shown on all screen sizes
// On mobile: shows logo. On desktop: shows search bar.

// Props:
//   showPage  — function to navigate to a dashboard page
//   showToast — function to show a toast notification
//   user      — logged-in user object from Redux (name, membershipLevel, etc.)
//   onLogout  — function to sign the user out
export default function Header({ showPage, showToast, user, onLogout }) {

  // Search: pressing Enter navigates to matching page
  function handleSearch(e) {
    if (e.key !== 'Enter') return;
    const q = e.target.value.toLowerCase();
    if (q.includes('product'))     showPage('products');
    else if (q.includes('task'))   showPage('tasks');
    else if (q.includes('wallet') || q.includes('transaction')) showPage('transactions');
    else if (q.includes('news'))   showPage('news');
    else showToast('Try products, tasks, wallet or news.');
  }

  // Language switcher — i18n can be wired here later
  function handleLang(e) {
    showToast(
      e.target.value === 'bn'
        ? 'বাংলা অনুবাদ সক্রিয় করতে i18n অনুবাদ যুক্ত করতে হবে।'
        : 'Language set to English.'
    );
  }
  
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="h-[66px] lg:h-[78px] px-4 sm:px-6 xl:px-9 flex items-center gap-3">

        {/* Mobile logo — hidden on desktop */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-xl grid place-items-center">✦</span>
          <b className="text-lg">Maaza International</b>
        </div>

        {/* Desktop search bar — hidden on mobile */}
        <div className="hidden lg:block relative w-full max-w-sm">
          <span className="absolute left-3 top-2.5 text-slate-400">⌕</span>
          <input
            onKeyDown={handleSearch}
            placeholder="Search products, tasks, updates..."
            className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-harvest-500"
          />
        </div>

        {/* Right side: language, notifications, user */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* Language selector */}
          <label className="flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold">
            <span>文</span>
            <select onChange={handleLang} className="bg-transparent outline-none">
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </label>

          {/* Notification bell with red dot */}
          <button
            onClick={() => showToast('You are all caught up.')}
            className="relative w-10 h-10 rounded-xl border"
          >
            ♧
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* User avatar — clicking goes to profile page */}
          <button
            onClick={() => showPage('profile')}
            className="flex items-center gap-2 sm:border-l sm:pl-3"
          >
            {/* Avatar shows first 2 letters of user's name */}
            <span className="w-9 h-9 rounded-xl bg-harvest-100 text-harvest-700 grid place-items-center text-xs font-extrabold">
              {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : '??'}
            </span>
            <span className="hidden sm:block text-left">
              <b className="block text-xs">{user?.fullName || 'Loading...'}</b>
              <small className="text-[10px] text-slate-500">Level {user?.membershipLevel || 'Member'}</small>
            </span>
          </button>

          {/* Logout button — visible on desktop */}
          <button
            onClick={onLogout}
            title="Sign out"
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 border-l pl-3 transition-colors"
          >
            ⏻ Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
