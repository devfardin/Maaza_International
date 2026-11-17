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
  `৳${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: digits })}`;

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
    <div className="grid sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-52 bg-white border rounded-2xl animate-pulse" />
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
        <h1 className="text-2xl font-extrabold mt-1">Browse Products</h1>
      </div>

      {/* ── Category filter tabs ── */}
      <div className="flex gap-2 flex-wrap pb-1">
        {tabs.map((tab) => {
          const active = activeCategory === tab._id;
          return (
            <button
              key={tab._id}
              onClick={() => setActiveCategory(tab._id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap transition ${active ? 'bg-harvest-700 text-white shadow-soft' : 'border bg-white text-slate-700 hover:border-harvest-300'
                }`}
            >
              {tab.name}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
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
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((product) => (
            <article
              key={product._id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              {/* ── NEW badge ── */}
              {isNewProduct(product) && (
                <span className="absolute right-3 top-3 z-10 animate-bounce rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white shadow-lg">
                  ✦ NEW
                </span>
              )}

              {/* ── Top: image left + info right ── */}
              <div className="flex gap-4 p-2.5">

                {/* Product image */}
                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-500 p-2">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-contain drop-shadow-lg" />
                    : <span className="text-5xl">🌿</span>
                  }
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    {/* Product name */}
                    <h3 className="text-base font-extrabold leading-snug text-slate-900 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-1 line-clamp-1 text-sm leading-5 text-slate-500">
                      {product.description}
                    </p>
                  </div>

                  {/* Price + Points + Join button */}
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div>
                      {/* Price */}
                      <p className="text-base font-semibold text-slate-700">
                        Price: <span className="text-xl font-extrabold text-harvest-700">{bdt(product.price)}</span>
                      </p>
                      {/* Conditionally show Points */}
                      {product.points > 0 && (
                        <p className="text-base font-semibold text-slate-700 mt-0.5">
                          Points: <span className="text-base font-extrabold text-harvest-700">{product.points}</span>
                        </p>
                      )}
                      {/* perchage limight */}
                      <p className="text-xs font-normal text-slate-500 mt-0.5">
                        Purchase limit: <span className="text-sm font-semibold text-harvest-700">{product?.purchaseRules?.purchaseLimit}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="shrink-0 rounded-md bg-gradient-to-r from-harvest-700 to-harvest-500 px-4 py-2 text-base font-medium text-white shadow-soft transition duration-200 active:scale-95 animate-border-pulse"
                      style={{
                        outline: '2px solid transparent',
                        boxShadow: '0 0 0 2px #a3e635',
                        animation: 'borderPulse 1.5s ease-in-out infinite',
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Product footer: stats strip ── */}
              <div className="grid grid-cols-3 justify-between align-middle items-center divide-x divide-white/20 bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600 py-3">
                {/* Validity Period */}
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium tracking-wide text-white">Validity Period</p>
                  <p className="mt-1 text-md font-medium text-white leading-tight text-center">
                    {product.rewardPlan?.validityDays ?? '—'} Days
                  </p>
                </div>
                {/* Every 1 Days Earn */}
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium tracking-wide text-white">Every 1 Day</p>
                  <p className="mt-1 text-md font-medium text-white">
                    {bdt(product.rewardPlan?.dailyIncome)}
                  </p>
                </div>
                {/* Total Earnings */}
                <div className="flex flex-col items-center px-2">
                  <p className="text-sm font-medium tracking-wide text-white">Total Earnings</p>
                  <p className="mt-1 text-md font-medium text-white">
                    {bdt(product.rewardPlan?.totalEstimatedRevenue)}
                  </p>
                </div>
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
