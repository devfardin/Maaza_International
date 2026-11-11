'use client';
// src/components/dashboard/pages/RechargePage.jsx
// Fetches active payment methods from GET /payment-methods.
// Submits a deposit request via POST /deposit-requests/create-deposit-request.
// Amount is in BDT (min 200). Backend stores in poisha internally.

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetPaymentMethodsQuery, useCreateDepositRequestMutation } from '@/redux/features/apiSlice';

export default function RechargePage({ showPage, showToast }) {
  const user   = useSelector((state) => state.auth.user);
  const userId = user?._id;

  const [amount, setAmount]           = useState('');
  const [method, setMethod]           = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitted, setSubmitted]     = useState(false);

  // GET /payment-methods — bKash, Nagad etc. with their account numbers
  const { data: methodsData, isLoading: methodsLoading } = useGetPaymentMethodsQuery();

  // POST /deposit-requests/create-deposit-request
  const [createDeposit, { isLoading: submitting }] = useCreateDepositRequestMutation();

  const paymentMethods = methodsData?.data ?? [];

  // Handle deposit form submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (!method) { showToast('Please select a payment method.'); return; }

    try {
      await createDeposit({
        userId,
        amount: Number(amount),   // BDT integer — backend validates min 200
        methodCode: method,
        senderNumber,
        transactionId,
        currency: 'BDT',
      }).unwrap();

      setSubmitted(true);
      showToast('Deposit request submitted! Admin will approve within 24 hours.');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to submit deposit request.');
    }
  }

  // Show success state after submission
  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-xs tracking-widest text-harvest-700 font-extrabold">REQUEST SUBMITTED</p>
        <h2 className="text-2xl font-extrabold mt-2">Deposit request sent!</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Your deposit of ৳{amount} is under review. Admin will approve within 24 hours.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => showPage('transactions')} className="border rounded-xl py-3 text-sm font-bold">View transactions</button>
          <button onClick={() => { setSubmitted(false); setAmount(''); setTransactionId(''); setSenderNumber(''); }} className="rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold">New request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* ── Header ── */}
      <div>
        <p className="text-xs tracking-widest font-extrabold text-harvest-700">RECHARGE WALLET</p>
        <h1 className="text-xl font-extrabold mt-1">Add funds</h1>
        <p className="text-sm text-slate-500 mt-1">Minimum deposit: ৳200</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Amount input */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Amount (BDT)</label>
          <input
            type="number"
            min="200"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount (min ৳200)"
            className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-sm"
          />
        </div>

        {/* Quick amount buttons */}
        <div className="flex gap-2 flex-wrap">
          {[500, 1000, 1300, 2000, 5000].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(String(amt))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${amount === String(amt) ? 'bg-harvest-700 text-white border-harvest-700' : 'bg-white'}`}
            >
              ৳{amt}
            </button>
          ))}
        </div>

        {/* Payment method selection */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Payment method</label>
          {methodsLoading ? (
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ) : paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-400 p-4 border rounded-xl">No payment methods available.</p>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map(m => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setMethod(m.methodCode || m.name)}
                  className={`w-full border-2 rounded-2xl p-4 text-left flex items-center gap-3 ${method === (m.methodCode || m.name) ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center font-bold text-xs">
                    {m.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{m.name}</p>
                    {/* Show the admin's account number so user knows where to send money */}
                    <p className="text-xs text-slate-500">Send to: <b>{m.accountNumber || m.number || '—'}</b></p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sender number */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Your sender number</label>
          <input
            type="tel"
            required
            value={senderNumber}
            onChange={e => setSenderNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-sm"
          />
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Transaction ID</label>
          <input
            type="text"
            required
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            placeholder="Enter the transaction ID from your payment"
            className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-sm"
          />
        </div>

        {/* Info box */}
        <div className="bg-gradient-to-br from-harvest-900 to-harvest-600 text-white rounded-2xl p-5 text-sm">
          <p className="font-extrabold mb-2">How to recharge</p>
          <ol className="space-y-1 text-white/80 text-xs list-decimal list-inside">
            <li>Select a payment method above</li>
            <li>Send the amount to the account number shown</li>
            <li>Enter your sender number and the transaction ID</li>
            <li>Submit — admin will approve within 24 hours</li>
          </ol>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-harvest-700 text-white py-4 text-sm font-extrabold disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit deposit request →'}
        </button>
      </form>
    </div>
  );
}
