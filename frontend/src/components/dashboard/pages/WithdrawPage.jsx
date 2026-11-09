'use client';
import { useState } from 'react';

// Withdraw page — user requests a payout of their earned rewards
// Props:
//   savedBank  — { method, holder, number } or null
//   showPage   — navigation function
//   showToast  — show notification

export default function WithdrawPage({ savedBank, showPage, showToast }) {
  const [amount, setAmount]     = useState('');
  const [confirmed, setConfirmed] = useState(false);

  function handleSubmit() {
    if (!savedBank)                          return showToast('Add your bKash or Nagad payout details first.');
    if (Number(amount) < 100 || Number(amount) > 186) return showToast('Enter an amount between ৳100 and ৳186.');
    if (!confirmed)                          return showToast('Confirm your payout details first.');
    showToast('Withdrawal request submitted for review.');
    showPage('withdrawals');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Withdraw earnings</h1>
        <p className="text-sm text-slate-500 mt-1">Request a payout of eligible earnings, rewards and referral bonuses.</p>
      </div>

      <div className="grid xl:grid-cols-[1fr_.8fr] gap-5">
        {/* Left: form */}
        <div className="bg-white border rounded-2xl p-5 sm:p-7">
          <h2 className="font-extrabold text-lg">New withdrawal request</h2>

          {/* Balance info */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl bg-harvest-50 border p-4">
              <small className="text-xs text-slate-500">Available earnings</small>
              <b className="block text-xl mt-2">৳ 186.00</b>
            </div>
            <div className="rounded-xl bg-slate-50 border p-4">
              <small className="text-xs text-slate-500">Minimum withdrawal</small>
              <b className="block text-xl mt-2">৳ 100.00</b>
            </div>
          </div>

          {/* Amount input */}
          <div className="mt-5">
            <label className="block text-sm font-bold mb-2">Withdrawal amount (৳)</label>
            <input
              type="number" min="100" max="186"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border px-4 py-3.5"
            />
            <p className="text-xs text-slate-500 mt-2">Only eligible earnings can be requested, subject to account terms.</p>
          </div>

          {/* Saved payout method display */}
          <div className="mt-5">
            <label className="block text-sm font-bold mb-2">Payout method</label>
            <div className="rounded-xl border p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-pink-50 grid place-items-center text-xl">📱</span>
              <div className="flex-1">
                <b className="block text-sm">{savedBank ? `${savedBank.method} · ${savedBank.holder}` : 'No payout method saved'}</b>
                <span className="text-xs text-slate-500">{savedBank ? savedBank.number : 'Add bKash or Nagad details'}</span>
              </div>
              <button onClick={() => showPage('bank')} className="text-xs font-bold text-harvest-700">Manage</button>
            </div>
          </div>

          <label className="flex gap-3 items-start mt-5 text-sm text-slate-600">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
            <span>I confirm the payout details are correct.</span>
          </label>

          <button onClick={handleSubmit} className="mt-5 w-full rounded-xl bg-harvest-700 text-white py-4 font-extrabold">
            Submit withdrawal request →
          </button>
        </div>

        {/* Right: history */}
        <div className="bg-white border rounded-2xl p-5 h-fit">
          <h3 className="font-extrabold">Withdrawal request history</h3>
          <div className="flex justify-between py-4 border-b mt-3">
            <div>
              <b className="block text-sm">৳ 150.00</b>
              <small className="text-xs text-slate-500">WD-261020-104 · bKash</small>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 h-fit text-xs font-bold">Approved</span>
          </div>
          <div className="flex justify-between py-4">
            <div>
              <b className="block text-sm">৳ 100.00</b>
              <small className="text-xs text-slate-500">WD-261017-098 · Nagad</small>
            </div>
            <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 h-fit text-xs font-bold">Pending</span>
          </div>
          <button onClick={() => showPage('withdrawals')} className="w-full border rounded-xl py-3 text-xs font-bold">View all requests</button>
        </div>
      </div>
    </div>
  );
}
