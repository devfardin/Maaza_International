'use client';

// Purchased products — shows all products the user has bought
// Each card has a progress bar showing days elapsed vs total validity

// Edit this array to change purchased product data
const PURCHASED = [
  { emoji: '🌿', name: 'Maaza Green P1',   order: 'MI-2601021', price: '1,000', days: 30, elapsed: 7  },
  { emoji: '🌾', name: 'Maaza Supply P2',  order: 'MI-2600988', price: '2,500', days: 45, elapsed: 15 },
  { emoji: '🍎', name: 'Fresh Market P1',   order: 'HP-2600841', price: '800',   days: 20, elapsed: 20 },
];

export default function PurchasedPage({ openProduct }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">My purchased products</h1>
        <p className="text-sm text-slate-500 mt-1">Review purchase details, status and validity.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PURCHASED.map(({ emoji, name, order, price, days, elapsed }) => {
          // Calculate progress percentage (capped at 100%)
          const progress = Math.min(100, (elapsed / days) * 100);
          return (
            <article key={order} className="bg-white border rounded-2xl p-4">
              {/* Product header */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-harvest-50 grid place-items-center text-3xl">{emoji}</div>
                <div>
                  <span className="text-xs text-emerald-700 font-bold">● ACTIVE</span>
                  <h3 className="font-extrabold mt-1">{name}</h3>
                  <p className="text-xs text-slate-500">Order #{order}</p>
                </div>
              </div>

              {/* Product details grid */}
              <div className="grid grid-cols-2 gap-3 border-y my-4 py-3">
                <div><small className="text-xs text-slate-500 block">Purchase price</small><b>৳ {price}</b></div>
                <div><small className="text-xs text-slate-500 block">Validity</small><b>{days} days</b></div>
                <div><small className="text-xs text-slate-500 block">Purchase date</small><b>Oct 2026</b></div>
                <div><small className="text-xs text-slate-500 block">Progress</small><b>{elapsed} / {days} days</b></div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-harvest-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>

              <button
                onClick={() => openProduct(name, Number(price.replace(',', '')), 'Agriculture')}
                className="mt-4 w-full border rounded-xl py-3 text-sm font-bold"
              >
                View product details
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
