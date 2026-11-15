'use client';
// src/components/dashboard/pages/ProductsPage.jsx
// Product catalogue. Cards open the product details modal, where the user joins
// (buys) the product. Shows a NEW badge on recently added products.

import { useState } from 'react';
import { getErrorMessage } from '@/lib/toast';
import { useGetProductsQuery, useGetCategoriesQuery, usePurchaseProductMutation } from '@/redux/features/apiSlice';
import ProductDetailModal from '@/components/dashboard/ProductDetailModal';
import { claimScheduleLabel, isNewProduct } from '@/lib/product';

const bdt = (amount, digits = 0) =>
  `৳${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: digits })}`;

export default function ProductsPage({ showPage, showToast }) {
  // 'all' or a category _id
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // GET /products — all active products
  const { data: productsData, isLoading: productsLoading, isError } = useGetProductsQuery();

  // GET /categories — for the filter tabs
  const { data: categoriesData } = useGetCategoriesQuery();

  // POST /product-purchases/purchase
  const [purchaseProduct, { isLoading: purchasing }] = usePurchaseProductMutation();

  const products = productsData?.data ?? [];

  // Product.category is populated as { _id, name } — compare by id
  const categoryIdOf = (p) => p.category?._id ?? p.category;
  const tabs = [
    { _id: 'all', name: 'All', count: products.length },
    ...(categoriesData?.data ?? []).map((c) => ({
      _id: c._id,
      name: c.name,
      count: products.filter((p) => categoryIdOf(p) === c._id).length,
    })),
  ];

  const filtered = activeCategory === 'all'
    ? products
    : products.filter((p) => categoryIdOf(p) === activeCategory);

  // Join Now — pays from the recharge wallet
  async function handleJoin(productId) {
    try {
      await purchaseProduct({ productId, paymentSource: 'recharge' }).unwrap();
      showToast('Product joined successfully!');
      setSelectedProduct(null);
      showPage('purchased');
    } catch (err) {
      showToast(getErrorMessage(err, 'Purchase failed. Please check your wallet balance.'), 'error');
    }
  }

  if (productsLoading) return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 bg-white border rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  if (isError) return (
    <div className="text-center py-16 text-slate-500">
      <p className="text-4xl mb-3">⚠️</p>
      <p>Failed to load products. Please try again.</p>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <p className="text-xs tracking-widest font-extrabold text-harvest-700">PRODUCT CATALOGUE</p>
        <h1 className="text-xl font-extrabold mt-1">Browse Products</h1>
      </div>

      {/* ── Category filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const active = activeCategory === tab._id;
          return (
            <button
              key={tab._id}
              onClick={() => setActiveCategory(tab._id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                active ? 'bg-harvest-700 text-white shadow-soft' : 'border bg-white text-slate-700 hover:border-harvest-300'
              }`}
            >
              {tab.name}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Product grid ── */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-12">No products available in this category.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <article key={product._id} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              {/* Image */}
              <div className="relative h-56 bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-400">
                <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
                <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-lime-300/20" />
                {/* The whole image is shown (object-contain): nothing is cropped on any side */}
                <div className="absolute inset-4 flex items-center justify-center transition duration-500 group-hover:scale-[1.03]">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                    : <span className="text-6xl">🌿</span>
                  }
                </div>
                {isNewProduct(product) && (
                  <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-400 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-white shadow-lg">
                    ✦ NEW
                  </span>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-extrabold text-harvest-800 shadow">
                  {bdt(product.price)}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-harvest-600">{product.category?.name || 'Product'}</p>
                <h3 className="mt-1 text-base font-extrabold leading-snug text-slate-900">{product.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-harvest-50 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-harvest-700/70">Claim</p>
                    <p className="mt-0.5 text-[11px] font-extrabold leading-tight text-slate-800">{claimScheduleLabel(product.rewardPlan)}</p>
                  </div>
                  <div className="rounded-xl bg-lime-50 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-lime-800/70">Validity</p>
                    <p className="mt-0.5 text-[11px] font-extrabold text-slate-800">{product.rewardPlan?.validityDays} days</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-amber-800/70">Bonus</p>
                    <p className="mt-0.5 text-[11px] font-extrabold text-slate-800">{bdt(product.bonuses?.invitationBonus)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="mt-5 w-full rounded-2xl bg-gradient-to-r from-harvest-700 to-harvest-500 py-3 text-xs font-extrabold text-white shadow-soft transition group-hover:opacity-95"
                >
                  View details →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onJoin={handleJoin}
        joining={purchasing}
      />
    </div>
  );
}
