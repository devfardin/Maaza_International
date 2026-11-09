'use client';

// Overview page — the main dashboard home screen
// Shows wallet balance, stats, quick action cards, product list and task list

export default function OverviewPage({ showPage, openTask }) {
  return (
    <div>
      {/* Page heading + action buttons */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] sm:text-xs tracking-widest font-extrabold text-harvest-700">MEMBER DASHBOARD</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">Welcome back, Fardin 👋</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1.5">Here's your wallet, products and latest account activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => showPage('recharge')} className="flex-1 sm:flex-none rounded-xl bg-harvest-700 text-white px-5 py-3 text-sm font-bold">＋ Recharge wallet</button>
          <button onClick={() => showPage('withdraw')} className="flex-1 sm:flex-none rounded-xl border bg-white px-5 py-3 text-sm font-bold">↗ Withdraw</button>
        </div>
      </div>

      {/* Wallet balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 text-white p-5 sm:p-8 mb-5 shadow-soft">
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-16 w-56 h-56 border border-white/10 rounded-full" />
        <div className="relative grid md:grid-cols-[1.2fr_.8fr] gap-5 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-lime-200">YOUR RECHARGE WALLET</p>
            <p className="text-sm text-white/75 mt-3">Wallet balance</p>
            <div className="flex items-end gap-3 mt-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold">৳ 2,450.00</h2>
              <span className="mb-1 rounded-lg bg-white/15 px-2 py-1 text-xs">BDT</span>
            </div>
            <p className="text-sm text-white/75 mt-3 max-w-md leading-6">Manage wallet activity, review requests and keep your account information in one place.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => showPage('recharge')} className="rounded-xl bg-lime-300 text-harvest-900 px-4 py-3 text-sm font-extrabold">＋ Recharge now</button>
              <button onClick={() => showPage('transactions')} className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm font-bold">View transactions →</button>
            </div>
          </div>
          {/* Decorative plant icon — desktop only */}
          <div className="hidden md:flex justify-center">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-lime-200 to-emerald-400 shadow-2xl grid place-items-center text-7xl">🌱</div>
          </div>
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Available rewards',   value: '৳ 186.00',  sub: 'Eligible reward balance' },
          { label: 'Purchased products',  value: '03',        sub: 'Current products' },
          { label: 'Task bonuses',        value: '৳ 50.00',   sub: 'Rewards credited' },
          { label: 'Referral bonus',      value: '৳ 120.00',  sub: 'Qualified referrals' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border rounded-2xl p-4 sm:p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <b className="block text-xl sm:text-2xl mt-3">{value}</b>
            <small className="text-xs text-slate-500">{sub}</small>
          </div>
        ))}
      </div>

      {/* Quick action cards */}
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl font-extrabold">Quick actions</h2>
        <p className="text-sm text-slate-500 mt-1 mb-3">Your most-used account tools, right at your fingertips.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { page: 'recharge',  icon: '＋', color: 'harvest', bg: 'harvest', label: 'Recharge wallet',  sub: 'Add funds to your wallet',    cta: 'Recharge now →' },
            { page: 'withdraw',  icon: '↗',  color: 'amber',   bg: 'amber',   label: 'Withdraw earnings', sub: 'Request an eligible payout', cta: 'Withdraw →' },
            { page: 'purchased', icon: '▣',  color: 'sky',     bg: 'sky',     label: 'My products',      sub: 'View purchased items',        cta: 'View products →' },
            { page: 'tasks',     icon: '✧',  color: 'violet',  bg: 'violet',  label: 'Task bonuses',     sub: 'Explore available tasks',     cta: 'See tasks →' },
          ].map(({ page, icon, label, sub, cta }) => (
            <button key={page} onClick={() => showPage(page)} className="text-left rounded-2xl border-2 border-slate-100 bg-white p-4 sm:p-5 hover:border-slate-300">
              <span className="w-11 h-11 rounded-2xl bg-harvest-700 text-white grid place-items-center text-xl">{icon}</span>
              <b className="block mt-3 text-sm sm:text-base">{label}</b>
              <span className="block text-xs text-slate-500 mt-1">{sub}</span>
              <span className="block mt-3 text-harvest-700 text-xs font-extrabold">{cta}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom two-column: products preview + task preview */}
      <div className="grid xl:grid-cols-[1.2fr_.8fr] gap-4">

        {/* Purchased products preview */}
        <div className="bg-white border rounded-2xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-extrabold">My purchased products</h2>
              <p className="text-xs text-slate-500 mt-1">Your current products.</p>
            </div>
            <button onClick={() => showPage('purchased')} className="text-harvest-700 text-xs font-extrabold">View all →</button>
          </div>
          {[
            { emoji: '🌿', bg: 'bg-harvest-50', name: 'Maaza Green P1',   date: 'Purchased 20 Oct 2026', price: '৳ 1,000' },
            { emoji: '🌾', bg: 'bg-amber-50',   name: 'Maaza Supply P2',  date: 'Purchased 12 Oct 2026', price: '৳ 2,500' },
            { emoji: '🍎', bg: 'bg-sky-50',     name: 'Fresh Market P1',   date: 'Purchased 04 Oct 2026', price: '৳ 800' },
          ].map(({ emoji, bg, name, date, price }, i, arr) => (
            <div key={name} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}>
              <div className={`w-12 h-12 rounded-xl ${bg} grid place-items-center text-2xl`}>{emoji}</div>
              <div className="flex-1">
                <b className="text-sm block">{name}</b>
                <span className="text-xs text-slate-500">{date}</span>
              </div>
              <div className="text-right">
                <b className="text-sm block">{price}</b>
                <span className="text-xs text-emerald-700 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Task bonus preview */}
        <div className="bg-white border rounded-2xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-extrabold">Task bonus</h2>
              <p className="text-xs text-slate-500 mt-1">Available tasks and rewards.</p>
            </div>
            <button onClick={() => showPage('tasks')} className="text-harvest-700 text-xs font-extrabold">All tasks →</button>
          </div>
          {[
            { emoji: '📣', bg: 'bg-violet-50', name: 'Share our announcement', desc: 'Help others discover community updates.', reward: '৳ 20 reward' },
            { emoji: '📝', bg: 'bg-amber-50',  name: 'Complete your profile',  desc: 'Keep account information up to date.',   reward: '৳ 30 reward' },
          ].map(({ emoji, bg, name, desc, reward }, i, arr) => (
            <div key={name} className={`flex gap-3 py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}>
              <div className={`w-14 h-14 rounded-xl ${bg} grid place-items-center text-2xl shrink-0`}>{emoji}</div>
              <div className="flex-1">
                <b className="text-sm">{name}</b>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
                <div className="flex justify-between mt-2">
                  <b className="text-xs text-harvest-700">{reward}</b>
                  <button onClick={() => openTask(name)} className="text-xs font-bold underline">Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
