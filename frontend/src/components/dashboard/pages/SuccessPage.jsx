'use client';

// Success page — shown after a recharge request is submitted
// Props: orderId, amount, method, txnId — filled in by RechargePage

export default function SuccessPage({ orderId, amount, method, txnId, showPage }) {
  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-14">
      <div className="bg-white border rounded-3xl p-6 sm:p-10 text-center">
        {/* Green checkmark icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center text-4xl">✓</div>

        <p className="text-xs tracking-widest text-harvest-700 font-extrabold mt-6">REQUEST SUBMITTED</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Thank you, Fardin!</h1>
        <p className="text-sm text-slate-500 leading-6 mt-3">Your recharge request has been received. The team will review the payment details and update its status.</p>

        {/* Order summary */}
        <div className="text-left rounded-2xl bg-slate-50 border p-5 mt-7 space-y-4">
          {[
            { label: 'Order ID',        value: orderId },
            { label: 'Amount',          value: `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2 })}` },
            { label: 'Payment method',  value: method },
            { label: 'Transaction ID',  value: txnId },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-sm text-slate-500">{label}</span>
              <b className="text-sm break-all text-right">{value}</b>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <span className="text-sm text-slate-500">Status</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-extrabold">PENDING</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <button onClick={() => showPage('transactions')} className="rounded-xl border py-3 font-bold">View transactions</button>
          <button onClick={() => showPage('overview')}     className="rounded-xl bg-harvest-700 text-white py-3 font-bold">Back to dashboard</button>
        </div>
      </div>
    </div>
  );
}
