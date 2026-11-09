'use client';
import { useState } from 'react';

// All products data — edit this array to add/remove products
const PRODUCTS = [
  { emoji: '🌿', cat: 'Agriculture', gradient: 'from-lime-100 to-harvest-200',    name: 'Maaza Green P1',        desc: 'Agriculture-focused business product with clear terms.',       price: 1000, points: 100, validity: '30 days' },
  { emoji: '🌾', cat: 'Agriculture', gradient: 'from-amber-100 to-orange-200',    name: 'Maaza Supply P2',       desc: 'A supply-chain product with an itemized overview.',            price: 2500, points: 250, validity: '45 days' },
  { emoji: '🍎', cat: 'Food supply', gradient: 'from-rose-100 to-orange-200',     name: 'Fresh Market P1',       desc: 'Fresh-produce distribution product overview.',                 price: 800,  points: 80,  validity: '20 days' },
  { emoji: '🍍', cat: 'Food supply', gradient: 'from-yellow-100 to-lime-200',     name: 'Tropical Produce P3',   desc: 'Produce procurement and distribution overview.',               price: 1500, points: 150, validity: '30 days' },
  { emoji: '🤝', cat: 'Community',   gradient: 'from-sky-100 to-teal-200',        name: 'Community Enterprise P1', desc: 'A community business opportunity listing.',                 price: 3000, points: 300, validity: '60 days' },
  { emoji: '🌳', cat: 'Community',   gradient: 'from-violet-100 to-fuchsia-200',  name: 'Future Growers P2',     desc: 'Long-term product concept with eligibility details.',          price: 5000, points: 500, validity: '90 days' },
];

const CATEGORIES = ['All', 'Agriculture', 'Food supply', 'Community'];

export default function ProductsPage({ openProduct }) {
  // activeCategory controls which products are shown
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.cat === activeCategory);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <p className="text-xs tracking-widest font-extrabold text-harvest-700">PRODUCT CATALOGUE</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Explore products</h1>
        <p className="text-sm text-slate-500 mt-1">Compare product details, eligibility and terms.</p>
      </div>

      {/* Category filter pills — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 hide-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2.5 text-xs font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-harvest-700 text-white' : 'bg-white border'}`}
          >
            {cat === 'All' ? 'All products' : cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(({ emoji, cat, gradient, name, desc, price, points, validity }) => (
          <article key={name} className="bg-white border rounded-2xl overflow-hidden">
            {/* Product image area */}
            <div className={`h-36 bg-gradient-to-br ${gradient} grid place-items-center text-6xl relative`}>
              {emoji}
              <span className="absolute top-3 left-3 bg-white/90 rounded-lg px-2 py-1 text-[10px] font-bold">{cat.toUpperCase()}</span>
            </div>
            <div className="p-4">
              <h3 className="font-extrabold">{name}</h3>
              <p className="text-xs text-slate-500 leading-5 mt-1.5">{desc}</p>
              {/* Product stats grid */}
              <div className="grid grid-cols-2 gap-3 py-4 mt-3 border-y">
                <div><small className="block text-xs text-slate-500">Price</small><b>৳ {price.toLocaleString()}</b></div>
                <div><small className="block text-xs text-slate-500">Points</small><b>{points} pts</b></div>
                <div><small className="block text-xs text-slate-500">Validity</small><b>{validity}</b></div>
                <div><small className="block text-xs text-slate-500">Frequency</small><b>Daily*</b></div>
              </div>
              <div className="flex items-center justify-between mt-4 gap-2">
                <small className="text-[10px] text-slate-500">*Terms apply</small>
                <button
                  onClick={() => openProduct(name, price, cat)}
                  className="rounded-xl bg-harvest-700 text-white px-4 py-2.5 text-xs font-bold"
                >
                  View details →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
