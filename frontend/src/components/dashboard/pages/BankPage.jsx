'use client';
// Payout accounts (bKash / Nagad) the user can withdraw to.
import { useState } from 'react';
import { useCreatePaymentAccountMutation, useGetMyPaymentAccountsQuery } from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import PageLoader from '@/components/shared/PageLoader';

const NUMBER_RE = /^01[3-9]\d{8}$/;

export default function BankPage() {
  const { t } = useI18n();
  const { data, isLoading } = useGetMyPaymentAccountsQuery();
  const [createAccount, { isLoading: saving }] = useCreatePaymentAccountMutation();

  const accounts = data?.data ?? [];

  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!NUMBER_RE.test(accountNumber.trim())) return notify.error('Enter a valid 11-digit mobile number (01XXXXXXXXX).');
    if (accountHolderName.trim().length < 2) return notify.error('Enter the account holder name.');
    try {
      await createAccount({
        method,
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        isPrimary: accounts.length === 0,
      }).unwrap();
      notify.success(`${method === 'bkash' ? 'bKash' : 'Nagad'} account saved. You can now withdraw to it.`);
      setAccountNumber('');
      setAccountHolderName('');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save this payout account.'));
    }
  }

  const inputCls = 'w-full rounded-xl border px-4 py-3 text-base sm:text-sm outline-none focus:border-harvest-500';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('bank.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">Save the bKash or Nagad number your withdrawals should be paid to.</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-5 items-start">
        <div className="bg-white border rounded-2xl p-5 sm:p-7">
          <h2 className="font-extrabold text-lg">Add payout account</h2>
          <form onSubmit={handleAdd} className="space-y-4 mt-5">
            <div>
              <p className="text-sm font-bold mb-2">Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'bkash', l: 'bKash' }, { v: 'nogod', l: 'Nagad' }].map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    aria-pressed={method === m.v}
                    onClick={() => setMethod(m.v)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold ${method === m.v ? 'border-harvest-600 bg-harvest-50 text-harvest-800' : 'border-slate-200'}`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="acc-number" className="block text-sm font-bold mb-2">Mobile number</label>
              <input id="acc-number" type="tel" inputMode="numeric" required value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} />
            </div>
            <div>
              <label htmlFor="acc-holder" className="block text-sm font-bold mb-2">Account holder name</label>
              <input id="acc-holder" type="text" required value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)} placeholder="As registered in bKash / Nagad" className={inputCls} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-harvest-700 text-white py-3.5 text-sm font-extrabold disabled:opacity-60">
              {saving ? 'Saving…' : 'Save payout account'}
            </button>
          </form>
        </div>

        <div className="bg-white border rounded-2xl p-5 sm:p-7">
          <h2 className="font-extrabold text-lg">Saved accounts</h2>
          {isLoading ? (
            <PageLoader label="Loading accounts…" className="py-8" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No payout account yet. Add one to start withdrawing.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {accounts.map((a) => (
                <li key={a._id} className="rounded-xl border p-4 flex items-center gap-3">
                  <span className="w-11 h-11 shrink-0 rounded-xl bg-pink-50 grid place-items-center text-xl">📱</span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm">{a.method === 'bkash' ? 'bKash' : 'Nagad'} · {a.accountHolderName}</b>
                    <span className="text-xs text-slate-500 break-all">{a.accountNumber}</span>
                  </div>
                  {a.isPrimary && <span className="rounded-full bg-harvest-50 text-harvest-700 px-2 py-1 text-[10px] font-bold">Primary</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
