'use client';
// Create / edit a deposit payment method (super_admin). The image comes from the Media Library (or a new upload).
import { useState } from 'react';
import RichTextEditor from '@/components/shared/RichTextEditor';
import MediaField from '@/components/shared/MediaField';

const field = 'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500';
const ACCOUNT_TYPES = ['Merchant', 'Personal', 'Agent'];

export default function PaymentMethodForm({ method, onSubmit, onCancel, submitting }) {
  const isEdit = !!method;
  const [f, setF] = useState({
    name:          method?.name ?? '',
    code:          method?.code ?? '',
    accountNumber: method?.accountNumber ?? '',
    accountType:   method?.accountType ?? 'Personal',
    description:   method?.description ?? '',
    instructions:  method?.instructions ?? '',
    isActive:      method?.isActive ?? true,
  });
  const [image, setImage] = useState(method?.image ?? '');
  const [error, setError] = useState('');

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!image) return setError('Please choose an image for this payment method.');
    if (!f.name.trim()) return setError('Name is required.');
    if (!f.accountNumber.trim()) return setError('Account number is required.');
    if (!f.instructions || f.instructions === '<p></p>') return setError('Instructions are required.');

    onSubmit({
      file: null,
      data: {
        image,
        name: f.name.trim(),
        // blank code → the backend builds it from the name on create
        ...(f.code.trim() ? { code: f.code.trim() } : {}),
        accountNumber: f.accountNumber.trim(),
        accountType: f.accountType,
        description: f.description,
        instructions: f.instructions,
        isActive: f.isActive,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">Name</span>
          <input required value={f.name} onChange={set('name')} placeholder="e.g. bKash, Binance Pay" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs font-bold text-slate-600 mb-1">Payment code</span>
          <input
            value={f.code}
            onChange={(e) => setF((p) => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') }))}
            placeholder="e.g. bkash-personal (leave blank to create from the name)"
            maxLength={40}
            className={`${field} font-mono`}
          />
          <span className="mt-1 block text-[11px] text-slate-400">Lowercase letters, numbers and dashes. Members see it on the recharge page, and it must be unique.</span>
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">Account type</span>
          <select value={f.accountType} onChange={set('accountType')} className={field}>
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-slate-600 mb-1">Account number / ID</span>
          <input required value={f.accountNumber} onChange={set('accountNumber')} className={field} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-semibold">
          <input type="checkbox" checked={f.isActive} onChange={set('isActive')} className="h-4 w-4" />
          Active (visible to members)
        </label>
      </div>

      <MediaField label="Image" hint="Pick from the Media Library, or upload a new image" value={image} onChange={setImage} />

      <div>
        <span className="block text-xs font-bold text-slate-600 mb-1">Description</span>
        <RichTextEditor value={f.description} onChange={(html) => setF((p) => ({ ...p, description: html }))} placeholder="Short description shown to members" />
      </div>

      <div>
        <span className="block text-xs font-bold text-slate-600 mb-1">Instructions</span>
        <RichTextEditor value={f.instructions} onChange={(html) => setF((p) => ({ ...p, instructions: html }))} placeholder="Step-by-step payment instructions" />
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex gap-3 sticky bottom-0 bg-white pt-3 pb-1">
        <button type="button" onClick={onCancel} className="flex-1 border rounded-xl py-3 text-sm font-bold">Cancel</button>
        <button disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create payment method'}
        </button>
      </div>
    </form>
  );
}
