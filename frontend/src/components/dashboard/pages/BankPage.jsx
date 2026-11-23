'use client';
// Bank details: one bKash and one Nagad payout account. Each can be edited and
// switched Active / Inactive. Only ACTIVE accounts are offered on the withdraw page.
import { useState } from 'react';
import {
  useCreatePaymentAccountMutation,
  useGetMyPaymentAccountsQuery,
  useUpdateMyPaymentAccountMutation,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import PageLoader from '@/components/shared/PageLoader';

const NUMBER_RE = /^01[3-9]\d{8}$/;
const METHODS = [
  { value: 'bkash', label: 'bKash', tint: 'bg-pink-500', soft: 'bg-pink-50 text-pink-700', logo: '/bKash-Logo.png' },
  { value: 'nogod', label: 'Nagad', tint: 'bg-orange-500', soft: 'bg-orange-50 text-orange-700', logo: '/nogod-logo.png' },
];

export default function BankPage() {
  const { data, isLoading } = useGetMyPaymentAccountsQuery();
  const accounts = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>

        <h1 className="text-2xl font-semibold text-center text-white">Payout accounts</h1>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
        <b>Please bind the correct receiving account.</b> The number must start with <b>01</b> and be <b>11 digits</b> long.
      </div>

      {isLoading ? (
        <PageLoader label="Loading accounts…" className="py-10" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 items-start">
          {METHODS.map((m) => (
            <AccountSlot
              key={m.value}
              method={m}
              account={accounts.find((a) => a.method === m.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountSlot({ method, account }) {
  const [createAccount, { isLoading: creating }] = useCreatePaymentAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateMyPaymentAccountMutation();
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');

  const busy = creating || updating;
  const isActive = account?.status === 'active';

  function startEdit() {
    setNumber(account?.accountNumber || '');
    setHolder(account?.accountHolderName || '');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!NUMBER_RE.test(number.trim())) return notify.error('Enter a valid number: 01 followed by 9 digits (11 digits in total).');
    if (holder.trim().length < 2) return notify.error('Enter the account holder name.');
    try {
      if (account) {
        await updateAccount({ id: account._id, accountNumber: number.trim(), accountHolderName: holder.trim() }).unwrap();
        notify.success(`${method.label} account updated.`);
      } else {
        await createAccount({ method: method.value, accountNumber: number.trim(), accountHolderName: holder.trim() }).unwrap();
        notify.success(`${method.label} account saved and active.`);
      }
      setEditing(false);
    } catch (err) {
      notify.error(getErrorMessage(err, `Could not save the ${method.label} account.`));
    }
  }

  async function toggleActive() {
    try {
      await updateAccount({ id: account._id, status: isActive ? 'inactive' : 'active' }).unwrap();
      notify.success(isActive ? `${method.label} account deactivated.` : `${method.label} account is now active.`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not change the account status.'));
    }
  }

  const inputCls = 'w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-harvest-500';

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* <span className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-extrabold text-white ${method.tint}`}>
            {method.label.slice(0, 2).toUpperCase()}
          </span> */}
          <img className="h-9 w-9 rounded-md" src={method?.logo} alt={method?.label} />
          <div>
            <h2 className="font-extrabold text-lg">{method.label} account</h2>
            <p className="text-xs text-slate-500">{account ? 'Saved' : 'Not added yet'}</p>
          </div>
        </div>
        {account && (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {isActive ? '● Active' : '○ Inactive'}
          </span>
        )}
      </div>

      {/* Saved details */}
      {account && !editing && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Number</p>
            <p className="mt-1 font-extrabold tracking-wide text-slate-800">{account.accountNumber}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Account holder</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{account.accountHolderName}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <p className="text-sm font-bold">Use for withdrawals</p>
              <p className="text-xs text-slate-500">{isActive ? 'Withdrawals can be sent here.' : 'Turn on to use this account.'}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={toggleActive}
              disabled={busy}
              className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${isActive ? 'bg-harvest-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${isActive ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          <button type="button" onClick={startEdit} className="w-full rounded-xl border py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Edit details
          </button>
        </div>
      )}

      {/* Add / edit form */}
      {(!account || editing) && (
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold">{method.label} number</label>
            <input
              type="tel"
              inputMode="numeric"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-slate-400">Starts with 01 · 11 digits</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">Account holder name</label>
            <input
              type="text"
              required
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="As registered on your wallet"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {editing && (
              <button type="button" onClick={() => setEditing(false)} className="rounded-xl border py-3 text-sm font-bold">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className={`rounded-xl bg-harvest-700 py-3 text-sm font-extrabold text-white disabled:opacity-60 ${editing ? '' : 'col-span-2'}`}
            >
              {busy ? 'Saving…' : account ? 'Save changes' : `Add ${method.label} account`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
