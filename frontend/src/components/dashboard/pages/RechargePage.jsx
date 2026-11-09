'use client';
import { useState } from 'react';

// Recharge page — user submits a payment to top up their wallet
// Props:
//   onSuccess(orderId, amount, method, txnId) — called after valid form submit
//   prefillAmount — optional amount pre-filled from product purchase flow

export default function RechargePage({ onSuccess, prefillAmount, showPage }) {
  const [amount, setAmount]     = useState(prefillAmount || '');
  const [method, setMethod]     = useState('bKash');   // selected payment method
  const [sender, setSender]     = useState('');
  const [txnId, setTxnId]       = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError]       = useState('');

  // Merchant numbers — replace with real numbers before launch
  const merchantNumbers = { bKash: '01XXX-XXXXXX', Nagad: '01YYY-YYYYYY' };

  function copyMerchant() {
    navigator.clipboard?.writeText(merchantNumbers[method]);
  }

  function handleSubmit() {
    // Basic validation
    if (Number(amount) < 100)          return setError('Enter an amount of at least ৳100.');
    if (!/^01\d{9}$/.test(sender.replace(/[\s-]/g, ''))) return setError('Enter a valid 11-digit mobile number.');
    if (txnId.trim().length < 5)       return setError('Enter the transaction ID from your receipt.');
    if (!confirmed)                    return setError('Confirm your payment details first.');

    setError('');
    const orderId = 'RC-' + Date.now().toString().slice(-8);
    onSuccess(orderId, amount, method, txnId.trim());
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Recharge wallet</h1>
        <p className="text-sm text-slate-500 mt-1">Submit your payment information for review.</p>
      </div>

      <div className="grid xl:grid-cols-[1fr_.8fr] gap-5">
        {/* Left: form */}
        <div className="bg-white border rounded-2xl p-5 sm:p-7">
          <h2 className="font-extrabold text-lg">Recharge request</h2>

          {/* Amount input */}
          <div className="mt-5">
            <label className="block text-sm font-bold mb-2">Recharge amount (৳)</label>
            <input
              type="number" min="100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500"
            />
            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[500, 1000, 2500, 5000].map(a => (
                <button key={a} onClick={() => setAmount(a)} className="border rounded-xl py-3 text-sm font-bold">৳{a.toLocaleString()}</button>
              ))}
            </div>
          </div>

          {/* Payment method selector */}
          <div className="mt-6">
            <label className="block text-sm font-bold mb-2">Choose payment method</label>
            <div className="grid grid-cols-2 gap-3">
              {['bKash', 'Nagad'].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`border-2 rounded-2xl p-4 text-left ${method === m ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}
                >
                  <span className="text-2xl">{m === 'bKash' ? '📱' : '📲'}</span>
                  <b className="block mt-2">{m}</b>
                  <small className="text-xs text-slate-500">Mobile wallet</small>
                </button>
              ))}
            </div>
          </div>

          {/* Payment instructions box */}
          <div className="mt-5 rounded-2xl bg-slate-50 border p-4">
            <div className="flex justify-between">
              <b className="text-sm">Payment instructions</b>
              <span className={`rounded-lg px-2 py-1 text-xs font-bold ${method === 'bKash' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>{method}</span>
            </div>
            <p className="text-xs text-slate-500 leading-5 mt-2">Send the selected amount to the verified payment recipient. Confirm the recipient and amount before sending.</p>
            <div className="flex items-center justify-between mt-3">
              <div>
                <small className="block text-xs text-slate-500">Merchant payment number</small>
                <b className="text-base">{merchantNumbers[method]}</b>
              </div>
              <button onClick={copyMerchant} className="border bg-white rounded-lg px-3 py-2 text-xs font-bold">Copy</button>
            </div>
            {/* Reminder to replace placeholder before launch */}
            <p className="text-xs text-amber-700 mt-3">Replace this placeholder with verified merchant details before launch.</p>
          </div>

          {/* Sender number + transaction ID */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm font-bold mb-2">Your payment number</label>
              <input value={sender} onChange={e => setSender(e.target.value)} placeholder="01XXXXXXXXX" className="w-full rounded-xl border px-3.5 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Transaction ID</label>
              <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Enter transaction ID" className="w-full rounded-xl border px-3.5 py-3 text-sm" />
            </div>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex gap-3 items-start mt-5 text-sm text-slate-600">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
            <span>I confirm these payment details are accurate. My request will remain pending until reviewed.</span>
          </label>

          {/* Error message */}
          {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}

          <button onClick={handleSubmit} className="mt-5 w-full rounded-xl bg-harvest-700 text-white py-4 text-sm font-extrabold">
            Submit recharge request →
          </button>
        </div>

        {/* Right: balance card + tips */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-harvest-900 to-harvest-600 text-white rounded-2xl p-6">
            <p className="text-sm text-white/70">Recharge wallet balance</p>
            <b className="block text-3xl mt-2">৳ 2,450.00</b>
            <button onClick={() => showPage('transactions')} className="mt-4 bg-white/15 rounded-xl px-4 py-3 text-sm font-bold">View wallet activity →</button>
          </div>
          <div className="bg-white border rounded-2xl p-5">
            <h3 className="font-extrabold">Before you submit</h3>
            <ul className="text-sm text-slate-500 leading-6 list-disc pl-4 mt-3">
              <li>Check payment method and amount.</li>
              <li>Enter the transaction ID accurately.</li>
              <li>Never share your PIN or OTP.</li>
              <li>Keep the receipt until the request is reviewed.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
