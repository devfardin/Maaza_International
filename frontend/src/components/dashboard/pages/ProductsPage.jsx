'use client';
// src/components/dashboard/pages/ProductsPage.jsx
// Fetches all products from GET /products and displays them.
// Shows referral bonus amount per product so users know what they earn
// when their referred member purchases this product.

import { getErrorMessage } from '@/lib/toast';
import { useState } from 'react';
import { useGetProductsQuery, useGetCategoriesQuery, usePurchaseProductMutation } from '@/redux/features/apiSlice';
import { useSelector } from 'react-redux';

export default function ProductsPage({ showPage, showToast }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { userId } = useSelector((state) => state.auth);

  // GET /products — all active products
  const { data: productsData, isLoading: productsLoading, isError } = useGetProductsQuery();

  // GET /categories — for the filter tabs
  const { data: categoriesData } = useGetCategoriesQuery();

  // POST /product-purchases/purchase
  const [purchaseProduct, { isLoading: purchasing }] = usePurchaseProductMutation();

  const products   = productsData?.data ?? [];
  const categories = ['All', ...(categoriesData?.data?.map(c => c.name) ?? [])];

  // Filter products by selected category
  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category?.name === activeCategory || p.category === activeCategory);

  // Handle product purchase — deducts from recharge wallet
  async function handlePurchase(productId) {
    try {
      await purchaseProduct({ productId, paymentSource: 'recharge' }).unwrap();
      showToast('Product purchased successfully!');
      setSelectedProduct(null);
      showPage('purchased');
    } catch (err) {
      showToast(getErrorMessage(err, 'Purchase failed. Please check your wallet balance.'), 'error');
    }
  }

  if (productsLoading) return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
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
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2.5 text-xs font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-harvest-700 text-white' : 'bg-white border'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Product grid ── */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-12">No products available in this category.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product._id} className="bg-white border rounded-2xl overflow-hidden hover:shadow-soft transition-shadow">

              {/* Product image */}
              <div className="h-40 bg-gradient-to-br from-lime-100 to-harvest-200 relative overflow-hidden">
                {product.image
                  ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-5xl">🌿</div>
                }
                {product.isFeatured && (
                  <span className="absolute top-2 left-2 bg-harvest-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Featured</span>
                )}
              </div>

              <div className="p-4">
                <p className="text-xs text-harvest-700 font-bold mb-1">{product.category?.name || 'Product'}</p>
                <h3 className="font-extrabold text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.description}</p>

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400">Price</p>
                    <p className="text-sm font-extrabold">৳{(product.price / 100).toFixed(0)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400">Daily income</p>
                    <p className="text-sm font-extrabold">৳{(product.rewardPlan?.dailyIncome / 100).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400">Validity</p>
                    <p className="text-sm font-extrabold">{product.rewardPlan?.validityDays}d</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400">Referral bonus</p>
                    {/* invitationBonus is the bonus the referrer earns when this product is purchased */}
                    <p className="text-sm font-extrabold text-harvest-700">
                      ৳{(product.bonuses?.invitationBonus / 100 ?? 0).toFixed(0)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full rounded-xl bg-harvest-700 text-white py-2.5 text-xs font-bold"
                >
                  View details & purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Product detail modal ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white/95 border-b px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold tracking-widest text-harvest-700">PRODUCT DETAILS</p>
                <h2 className="font-extrabold text-lg mt-1">{selectedProduct.name}</h2>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 rounded-xl border text-xl">×</button>
            </div>

            <div className="p-5 sm:p-7 space-y-4">
              {/* Product image */}
              <div className="h-40 rounded-2xl bg-gradient-to-br from-lime-100 to-harvest-200 overflow-hidden">
                {selectedProduct.image
                  ? <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-6xl">🌿</div>
                }
              </div>

              <p className="text-sm text-slate-600 leading-6">{selectedProduct.description}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-xl p-3">
                  <p className="text-xs text-slate-500">Price</p>
                  <b className="block text-lg mt-1">৳{(selectedProduct.price / 100).toFixed(0)}</b>
                </div>
                <div className="border rounded-xl p-3">
                  <p className="text-xs text-slate-500">Daily income</p>
                  <b className="block text-lg mt-1">৳{(selectedProduct.rewardPlan?.dailyIncome / 100).toFixed(2)}</b>
                </div>
                <div className="border rounded-xl p-3">
                  <p className="text-xs text-slate-500">Validity</p>
                  <b className="block mt-1">{selectedProduct.rewardPlan?.validityDays} days</b>
                </div>
                <div className="border rounded-xl p-3">
                  <p className="text-xs text-slate-500">Total estimated revenue</p>
                  <b className="block mt-1">৳{(selectedProduct.rewardPlan?.totalEstimatedRevenue / 100).toFixed(0)}</b>
                </div>
              </div>

              {/* Referral bonus — shown prominently so users know what their referrer earns */}
              <div className="bg-harvest-50 border border-harvest-100 rounded-xl p-4">
                <p className="text-xs font-extrabold text-harvest-700">REFERRAL BONUS</p>
                <p className="text-sm mt-1">
                  Your referrer earns <b>৳{(selectedProduct.bonuses?.invitationBonus / 100 ?? 0).toFixed(0)}</b> when you purchase this product.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Upgrade bonus: ৳{(selectedProduct.bonuses?.upgradeBonus / 100 ?? 0).toFixed(0)}
                </p>
              </div>

              {/* Welcome bonus reminder */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-extrabold text-amber-700">WELCOME BONUS</p>
                <p className="text-sm mt-1">You will receive a <b>৳120 welcome bonus</b> credited to your balance wallet upon purchase.</p>
              </div>

              {/* Action buttons */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { setSelectedProduct(null); showPage('recharge'); }}
                  className="border rounded-xl py-3 text-sm font-bold"
                >
                  ＋ Recharge wallet
                </button>
                <button
                  onClick={() => handlePurchase(selectedProduct._id)}
                  disabled={purchasing || selectedProduct.quantity <= 0}
                  className="bg-harvest-700 text-white rounded-xl py-3 text-sm font-extrabold disabled:opacity-60"
                >
                  {purchasing ? 'Processing…' : selectedProduct.quantity <= 0 ? 'Out of stock' : 'Purchase now →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
