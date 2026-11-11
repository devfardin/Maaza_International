'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useCreatePaymentAccountMutation, useGetMyPaymentAccountsQuery } from '@/redux/features/apiSlice';

export default function BankPage({ showToast }) {
  const user = useSelector((s) => s.auth.user);

  const { data: accountsData } = useGetMyPaymentAccountsQuery();
  const apiAccounts = accountsData?.data || [];
  // Prefer API data, fall back to user profile embedded accounts
  const paymentAccounts = apiAccounts.length > 0 ? apiAccounts : (user?.paymentAccounts || []);
  const savedAccount = paymentAccounts[0] || null;

  const [editing, setEditing] = useState(false);
  const [bankMethod, setBankMethod] = useState('bKash');
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');

  const [createPaymentAccount, { isLoading }] = useCreatePaymentAccountMutation();

  function startEdit() {
    setEditing(true);
    setBankMethod(savedAccount?.method || 'bKash');
    setHolder(savedAccount?.accountHolderName || '');
    setNumber(savedAccount?.accountNumber || '');
  }

  async function handleSave() {
    if (!holder.trim()) return showToast('Enter the account holder name.');
    if (!/^01\d{9}$/.test(number.replace(/[\s-]/g, ''))) return showToast('Enter a valid 11-digit mobile wallet number.');

    try {
      await createPaymentAccount({
        method: bankMethod,
        accountHolderName: holder.trim(),
        accountNumber: number.replace(/[\s-]/g, ''),
      }).unwrap();
      setEditing(false);
      showToast('Payout details saved successfully.');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to save payout details.');
    }
  }

  const showForm = !savedAccount || editing;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Payout details</h1>
        <p className="text-sm text-slate-500 mt-1">Save one bKash or Nagad mobile wallet for withdrawals.</p>
      </div>

      <div className="max-w-4xl grid md:grid-cols-[.8fr_1.2fr] gap-5">
        {/* Left: saved method display */}
        <div className="bg-white border rounded-2xl p-5">
          <div className="w-12 h-12 rounded-2xl bg-harvest-50 grid place-items-center text-2xl">🛡️</div>
          <h2 className="font-extrabold text-lg mt-4">Saved payout method</h2>
          <p className="text-sm text-slate-500 leading-6 mt-2">Only one mobile wallet can be saved at a time.</p>

          {savedAccount && !editing ? (
            <div className="mt-5 rounded-xl bg-slate-50 border p-4">
              <span className="text-xs font-bold text-emerald-700">SAVED</span>
              <b className="block mt-2">{savedAccount.method} · {savedAccount.accountHolderName}</b>
              <span className="text-sm text-slate-500">{savedAccount.accountNumber}</span>
              <button onClick={startEdit} className="mt-4 w-full border bg-white rounded-xl py-3 text-sm font-bold">Edit details</button>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed p-5 text-center">
              <span className="text-3xl">＋</span>
              <p className="font-bold mt-2">No payout method added</p>
              <p className="text-xs text-slate-500 mt-1">Add one mobile wallet.</p>
            </div>
          )}
        </div>

        {/* Right: add/edit form */}
        <div className="bg-white border rounded-2xl p-5 sm:p-6">
          <h2 className="font-extrabold text-lg">{editing ? 'Edit payout details' : savedAccount ? 'Payout method saved' : 'Add payout method'}</h2>
          <p className="text-xs text-slate-500 mt-1">bKash or Nagad only.</p>

          {showForm && (
            <div className="grid grid-cols-2 gap-3 mt-5">
              {['bKash', 'Nagad'].map((m) => (
                <button
                  key={m}
                  onClick={() => setBankMethod(m)}
                  className={`border-2 rounded-xl p-3 text-left ${bankMethod === m ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}
                >
                  <b>{m}</b>
                  <small className="block text-xs text-slate-500 mt-1">Mobile wallet</small>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-bold mb-2">Account holder name</label>
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              disabled={!!savedAccount && !editing}
              placeholder="Registered account holder"
              className="w-full rounded-xl border px-3.5 py-3 text-sm disabled:bg-slate-50"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold mb-2">Mobile wallet number</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={!!savedAccount && !editing}
              inputMode="numeric"
              placeholder="01XXXXXXXXX"
              className="w-full rounded-xl border px-3.5 py-3 text-sm disabled:bg-slate-50"
            />
          </div>

          {showForm && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="mt-5 w-full rounded-xl bg-harvest-700 text-white py-4 text-sm font-extrabold disabled:opacity-60"
            >
              {isLoading ? 'Saving…' : editing ? 'Save changes' : 'Save payout details'}
            </button>
          )}

          <p className="text-xs text-slate-500 leading-5 mt-3">Never share your wallet PIN or OTP with anyone.</p>
        </div>
      </div>
    </div>
  );
}
