'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ProductDetailModal — opened from the products page.
//   Hero   : image on a brand gradient, NEW badge, name, category, description, chips
//   Body   : validity strip, team commission (A and B), bonuses
//   Footer : Join Now (always visible)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import {
  claimScheduleLabel,
  isNewProduct,
  perDayBase,
  ratePercent,
  teamEarningFor,
} from '@/lib/product';

const bdt = (amount, digits = 2) =>
  `৳${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: digits })}`;

function Chip({ label, value, tone = 'harvest' }) {
  const tones = {
    harvest: 'bg-harvest-50 text-harvest-800 ring-harvest-100',
    lime: 'bg-lime-50 text-lime-800 ring-lime-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  };
  return (
    <div className={`rounded-2xl p-4 ring-1 ${tones[tone]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

export default function ProductDetailModal({ product, onClose, onJoin, joining }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;

  const validityDays = product.rewardPlan?.validityDays || 0;
  const soldOut = product.quantity <= 0;
  const isNew = isNewProduct(product);
  // Only A (direct inviter) and B (inviter's inviter) earn team commission from a purchase
  const teamRows = (product.teamCommissions || []).filter((c) => c.level === 'A' || c.level === 'B');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="grid md:grid-cols-2">
            <div className="relative flex min-h-[18rem] items-center justify-center overflow-hidden bg-gradient-to-br from-harvest-900 via-harvest-700 to-lime-400 p-8 md:min-h-[24rem]">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-12 right-4 h-44 w-44 rounded-full bg-lime-300/20" />
              {/* The panel wraps the image, so the whole product image is shown on every side */}
              <div className="relative rounded-3xl bg-white/95 p-4 shadow-2xl ring-8 ring-white/20">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="block max-h-72 max-w-[min(20rem,70vw)] object-contain" />
                ) : (
                  <span className="grid h-56 w-56 place-items-center text-7xl">🌿</span>
                )}
              </div>
              {isNew && (
                <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-fuchsia-400 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white shadow-lg">
                  ✦ NEW
                </span>
              )}
            </div>

            <div className="relative flex flex-col p-6 sm:p-8">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
              {product.category?.name && (
                <span className="w-fit rounded-full bg-harvest-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-harvest-700">
                  {product.category.name}
                </span>
              )}
              <h2 className="mt-3 pr-10 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{product.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Chip label="Price" value={bdt(product.price, 0)} />
                <Chip label="Points" value={product.points ?? 0} tone="amber" />
                <Chip label="Daily income" value={bdt(product.rewardPlan?.dailyIncome)} tone="lime" />
                <Chip label="Total earnings" value={bdt(product.rewardPlan?.totalEstimatedRevenue, 0)} />
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {/* Validity strip */}
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-harvest-100 bg-harvest-50/60 text-center">
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-harvest-700/70">Claim</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">{claimScheduleLabel(product.rewardPlan)}</p>
              </div>
              <div className="border-x border-harvest-100 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-harvest-700/70">Validity</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">{validityDays} days</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-harvest-700/70">First claim</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">Right after purchase</p>
              </div>
            </div>

            {/* Team commission */}
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-harvest-700 text-sm text-white">👥</span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Team commission</p>
                  <p className="text-[11px] text-slate-500">Daily income × rate × validity days</p>
                </div>
              </div>

              {teamRows.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400">No team commission for this product.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teamRows.map((c) => {
                    const perDay = perDayBase(product);
                    const total = teamEarningFor(c, product);
                    return (
                      <div key={c.level} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
                        <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-harvest-50" />
                        <div className="relative flex items-center justify-between">
                          <span className="rounded-lg bg-harvest-700 px-2.5 py-1 text-xs font-extrabold text-white">Level {c.level}</span>
                          <span className="rounded-lg bg-lime-100 px-2.5 py-1 text-xs font-extrabold text-harvest-800">{ratePercent(c.rate)}</span>
                        </div>
                        <p className="relative mt-3 text-xs text-slate-500">
                          {bdt(perDay)} × {ratePercent(c.rate)} × {validityDays} days
                        </p>
                        <p className="relative mt-1 text-2xl font-extrabold text-harvest-800">{bdt(total, 0)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bonuses */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-harvest-50 to-white p-4 ring-1 ring-harvest-100">
                <p className="text-xs font-extrabold text-harvest-700">INVITATION BONUS</p>
                <p className="mt-1 text-sm text-slate-700">
                  Your inviter earns <b>{bdt(product.bonuses?.invitationBonus, 0)}</b> on your first purchase.
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-lime-50 to-white p-4 ring-1 ring-lime-100">
                <p className="text-xs font-extrabold text-lime-800">UPGRADE BONUS</p>
                <p className="mt-1 text-sm text-slate-700">
                  <b>{bdt(product.bonuses?.upgradeBonus, 0)}</b> on every purchase after your first.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Join Now stays visible */}
        <div className="flex items-center justify-between gap-4 border-t bg-white px-6 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pay from</p>
            <p className="truncate text-sm font-extrabold text-slate-800">Recharge wallet · {bdt(product.price, 0)}</p>
          </div>
          <button
            type="button"
            onClick={() => onJoin(product._id)}
            disabled={joining || soldOut}
            className="shrink-0 rounded-2xl bg-gradient-to-r from-harvest-700 to-harvest-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {soldOut ? 'Out of stock' : joining ? 'Joining…' : 'Join Now →'}
          </button>
        </div>
      </div>
    </div>
  );
}
