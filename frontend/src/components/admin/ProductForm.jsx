'use client';
// Create / edit a product. All money fields are typed in BDT and converted to
// poisha (×100) for the API. Image upload is only shown when creating.

import { useState } from 'react';

const toPoisha = (bdt) => Math.round(Number(bdt || 0) * 100);
const toBdt = (poisha) => (poisha === undefined || poisha === null ? '' : String(poisha / 100));

const field = 'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export default function ProductForm({ mode = 'create', product, categories = [], onSubmit, onCancel, submitting, error }) {
  const commission = (level) => product?.teamCommissions?.find((c) => c.level === level);

  const [f, setF] = useState({
    name:            product?.name ?? '',
    category:        product?.category?._id ?? product?.category ?? '',
    description:     product?.description ?? '',
    price:           toBdt(product?.price),
    points:          product?.points ?? 0,
    quantity:        product?.quantity ?? '',
    dailyIncome:     toBdt(product?.rewardPlan?.dailyIncome),
    validityDays:    product?.rewardPlan?.validityDays ?? '',
    startAfter:      product?.rewardPlan?.startAfterPurchaseDays ?? 0,
    invitationBonus: toBdt(product?.bonuses?.invitationBonus ?? 0),
    upgradeBonus:    toBdt(product?.bonuses?.upgradeBonus ?? 0),
    purchaseLimit:   product?.purchaseRules?.purchaseLimit ?? 1,
    levels:          product?.purchaseRules?.allowedMembershipLevels ?? [1, 2, 3, 4, 5, 6, 7, 8],
    rateB:           commission('B') ? commission('B').rate * 100 : 10,
    rateC:           commission('C') ? commission('C').rate * 100 : 5,
    isFeatured:      product?.isFeatured ?? false,
    status:          product?.status ?? 'active',
  });
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState('');

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleLevel = (n) =>
    setF((p) => ({ ...p, levels: p.levels.includes(n) ? p.levels.filter((x) => x !== n) : [...p.levels, n].sort() }));

  // total revenue is derived: daily income × validity days
  const totalRevenue = Number(f.dailyIncome || 0) * Number(f.validityDays || 0);

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    if (mode === 'create' && !file) return setLocalError('Please choose a product image.');
    if (!f.levels.length) return setLocalError('Select at least one membership level.');
    if (!f.category) return setLocalError('Please choose a category.');

    const data = {
      name: f.name.trim(),
      category: f.category,
      description: f.description.trim(),
      price: toPoisha(f.price),
      points: Number(f.points || 0),
      quantity: Number(f.quantity),
      rewardPlan: {
        dailyIncome: toPoisha(f.dailyIncome),
        validityDays: Number(f.validityDays),
        totalEstimatedRevenue: toPoisha(totalRevenue),
        frequency: 'daily',
        startAfterPurchaseDays: Number(f.startAfter || 0),
      },
      bonuses: { invitationBonus: toPoisha(f.invitationBonus), upgradeBonus: toPoisha(f.upgradeBonus) },
      purchaseRules: { purchaseLimit: Number(f.purchaseLimit), allowedMembershipLevels: f.levels },
      teamCommissions: [
        { level: 'B', rate: Number(f.rateB) / 100, basis: 'daily-income' },
        { level: 'C', rate: Number(f.rateC) / 100, basis: 'daily-income' },
      ],
      isFeatured: f.isFeatured,
      status: f.status,
    };
    onSubmit({ data, file });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="grid sm:grid-cols-2 gap-4">
        <Field label="Title"><input required minLength={2} value={f.name} onChange={set('name')} className={field} /></Field>
        <Field label="Category">
          <select required value={f.category} onChange={set('category')} className={field}>
            <option value="">Select category…</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea required minLength={10} rows={3} value={f.description} onChange={set('description')} className={field} />
          </Field>
        </div>
        {mode === 'create' && (
          <div className="sm:col-span-2">
            <Field label="Image" hint="JPEG, PNG, WEBP or GIF · max 5 MB">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700" />
            </Field>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Price (৳)"><input required type="number" min="1" step="0.01" value={f.price} onChange={set('price')} className={field} /></Field>
        <Field label="Points"><input type="number" min="0" value={f.points} onChange={set('points')} className={field} /></Field>
        <Field label="Stock quantity"><input required type="number" min="0" step="1" value={f.quantity} onChange={set('quantity')} className={field} /></Field>
        <Field label="Daily earning (৳)"><input required type="number" min="0" step="0.01" value={f.dailyIncome} onChange={set('dailyIncome')} className={field} /></Field>
        <Field label="Validity period (days)"><input required type="number" min="1" step="1" value={f.validityDays} onChange={set('validityDays')} className={field} /></Field>
        <Field label="Total revenue (auto)"><input readOnly value={`৳${totalRevenue.toFixed(2)}`} className={`${field} text-slate-500`} /></Field>
        <Field label="First claim after (days)"><input type="number" min="0" step="1" value={f.startAfter} onChange={set('startAfter')} className={field} /></Field>
        <Field label="Purchase limit / user"><input required type="number" min="1" step="1" value={f.purchaseLimit} onChange={set('purchaseLimit')} className={field} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set('status')} className={field}>
            <option value="active">Active</option>
            <option value="inactive">Inactive (hidden)</option>
            <option value="outofstock">Out of stock</option>
          </select>
        </Field>
      </section>

      <section className="rounded-2xl border p-4 space-y-4">
        <p className="text-xs font-extrabold text-slate-500">REWARDS &amp; TEAM COMMISSION</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Invitation bonus (৳)" hint="Paid to the buyer's inviter"><input type="number" min="0" step="0.01" value={f.invitationBonus} onChange={set('invitationBonus')} className={field} /></Field>
          <Field label="Upgrade bonus (৳)" hint="Paid when a membership upgrade happens"><input type="number" min="0" step="0.01" value={f.upgradeBonus} onChange={set('upgradeBonus')} className={field} /></Field>
          <Field label="Level B commission %" hint="Of buyer's daily earning"><input type="number" min="0" max="100" step="0.1" value={f.rateB} onChange={set('rateB')} className={field} /></Field>
          <Field label="Level C commission %" hint="Of buyer's daily earning"><input type="number" min="0" max="100" step="0.1" value={f.rateC} onChange={set('rateC')} className={field} /></Field>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-slate-600 mb-2">Membership levels allowed to buy</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button type="button" key={n} onClick={() => toggleLevel(n)}
              className={`h-9 min-w-9 px-3 rounded-lg border text-xs font-bold ${f.levels.includes(n) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600'}`}>
              Lv {n}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm">
          <input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Feature this product
        </label>
      </section>

      {(localError || error) && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{localError || error}</p>}

      <div className="flex gap-3 sticky bottom-0 bg-white pt-3 pb-1">
        <button type="button" onClick={onCancel} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
        <button disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
          {submitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
