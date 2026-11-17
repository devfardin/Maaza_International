'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  claimScheduleLabel,
  isNewProduct,
  perDayBase,
  ratePercent,
  teamEarningFor,
} from '@/lib/product';

const bdt = (amount, digits = 2) =>
  `৳${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: digits })}`;

export default function ProductDetailModal({ product, onClose, onJoin, joining }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;

  const validityDays = product.rewardPlan?.validityDays || 0;
  const soldOut = product.quantity <= 0 || product.status == 'outofstock';
  const isNew = isNewProduct(product);
  const teamRows = (product.teamCommissions || []).filter((c) => c.level === 'A' || c.level === 'B');

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-full w-full max-w-lg flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-screen sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero image — scrolls away */}
          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-500 p-6">
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 right-2 h-36 w-36 rounded-full bg-lime-300/20" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              ✕
            </button>

            {isNew && (
              <span className="absolute left-3 top-3 z-10 animate-bounce rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 px-2.5 py-1 text-xs font-extrabold tracking-wider text-white shadow-lg">
                ✦ NEW
              </span>
            )}

            <div className="relative rounded-2xl bg-white/95 p-3 shadow-2xl ring-4 ring-white/20">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="block h-auto w-40 object-contain drop-shadow-lg sm:h-44 sm:w-44"
                />
              ) : (
                <span className="grid h-36 w-36 place-items-center text-6xl">🌿</span>
              )}
            </div>
          </div>

          {/* Stats strip — sticks to top once hero scrolls out */}
          <div className="sticky top-0 z-10 grid grid-cols-3 divide-x divide-white/20 bg-gradient-to-r from-harvest-900 via-harvest-700 to-lime-600 py-3">
            <div className="flex flex-col items-center px-2">
              <p className="text-xs font-medium tracking-wide text-white/80">Validity Period</p>
              <p className="mt-0.5 text-sm font-bold text-white">{validityDays} Days</p>
            </div>
            <div className="flex flex-col items-center px-2">
              <p className="text-xs font-medium tracking-wide text-white/80">Daily Earn</p>
              <p className="mt-0.5 text-sm font-bold text-white">{bdt(product.rewardPlan?.dailyIncome)}</p>
            </div>
            <div className="flex flex-col items-center px-2">
              <p className="text-xs font-medium tracking-wide text-white/80">Total Earn</p>
              <p className="mt-0.5 text-sm font-bold text-white">{bdt(product.rewardPlan?.totalEstimatedRevenue, 0)}</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-5 p-5">

            {/* Name + category + description */}
            <div>
              {product.category?.name && (
                <span className="rounded-full bg-harvest-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-harvest-700">
                  {product.category.name}
                </span>
              )}
              <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                {product.name}
              </h2>
              <p className="mt-1.5 text-base leading-6 text-slate-500">{product.description}</p>
            </div>

            {/* Price + Points + Purchase limit */}
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-100 bg-white text-center shadow-sm">
              <div className="p-3">
                <p className="text-base font-medium tracking-wider text-slate-700">Price</p>
                <p className="mt-1 text-lg font-extrabold text-harvest-700">{bdt(product.price, 0)}</p>
              </div>
              <div className="border-x border-slate-100 p-3">
                <p className="text-base font-medium tracking-wider text-slate-700">Points</p>
                <p className="mt-1 text-lg font-extrabold text-amber-600">{product.points ?? 0}</p>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium tracking-wider text-slate-700">Buy limit</p>
                <p className="mt-1 text-lg font-extrabold text-harvest-600">{product?.purchaseRules?.purchaseLimit ?? '—'}</p>
              </div>
            </div>

            {/* Claim schedule strip */}
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-harvest-100 bg-harvest-50/60 text-center">
              <div className="p-3">
                <p className="text-base font-medium tracking-wider text-harvest-700/90">Claim</p>
                <p className="mt-1 text-sm font-medium text-black">{claimScheduleLabel(product.rewardPlan)}</p>
              </div>
              <div className="border-x border-harvest-100 p-3">
                <p className="text-base font-medium tracking-wider text-harvest-700/90">Validity</p>
                <p className="mt-1 text-sm font-medium text-black">{validityDays} days</p>
              </div>
              <div className="p-3">
                <p className="text-base font-medium tracking-wider text-harvest-700/90">First Claim</p>
                <p className="mt-1 text-xs font-medium text-black">After purchase</p>
              </div>
            </div>

            {/* Team commission */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-harvest-900 to-harvest-700 text-base text-white">
                  👥
                </span>
                <div>
                  <p className="text-base font-extrabold text-slate-900">Team Commission</p>
                  <p className="text-xs text-slate-500">Daily income × rate × validity days</p>
                </div>
              </div>

              {teamRows.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">No team commission for this product.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {teamRows.map((c) => {
                    const perDay = perDayBase(product);
                    const total = teamEarningFor(c, product);
                    return (
                      <div
                        key={c.level}
                        className="relative overflow-hidden rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"
                      >
                        <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-harvest-50" />
                        <div className="relative flex items-center justify-between">
                          <span className="rounded-lg bg-gradient-to-r from-harvest-900 to-harvest-700 px-2.5 py-1 text-sm font-extrabold text-white">
                            Level {c.level}
                          </span>
                          <span className="rounded-lg bg-lime-100 px-2.5 py-1 text-sm font-extrabold text-harvest-800">
                            {ratePercent(c.rate)}
                          </span>
                        </div>
                        <p className="relative mt-2.5 text-xs text-slate-500">
                          {bdt(perDay)} × {ratePercent(c.rate)} × {validityDays}d
                        </p>
                        <p className="relative mt-0.5 text-2xl font-extrabold text-harvest-800">{bdt(total, 0)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bonuses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-harvest-50 to-white p-3.5 ring-1 ring-harvest-100">
                <p className="text-xs font-extrabold uppercase tracking-wider text-harvest-700">Invitation Bonus</p>
                <p className="mt-1 text-xl font-extrabold text-harvest-800">{bdt(product.bonuses?.invitationBonus, 0)}</p>
                <p className="mt-0.5 text-xs text-slate-500">Earned by your inviter</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-lime-50 to-white p-3.5 ring-1 ring-lime-100">
                <p className="text-xs font-extrabold uppercase tracking-wider text-lime-800">Upgrade Bonus</p>
                <p className="mt-1 text-xl font-extrabold text-lime-700">{bdt(product.bonuses?.upgradeBonus, 0)}</p>
                <p className="mt-0.5 text-xs text-slate-500">On every re-purchase</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer: Join Now (always visible) ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pay from</p>
            <p className="truncate text-base font-extrabold text-slate-800">
              Recharge wallet · {bdt(product.price, 0)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onJoin(product._id)}
            disabled={joining || soldOut}
            className="shrink-0 rounded-md bg-gradient-to-r from-harvest-700 to-harvest-500 px-6 py-3 text-base font-medium text-white shadow-soft transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 animate-border-pulse"
            style={{
              outline: '2px solid transparent',
              boxShadow: '0 0 0 2px #a3e635',
              animation: 'borderPulse 1.5s ease-in-out infinite',
            }}

          >
            {soldOut ? 'Out of stock' : joining ? 'Joining…' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
    , document.body);
}
