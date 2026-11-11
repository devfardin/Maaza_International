'use client';
// src/components/dashboard/pages/RechargePage.jsx
// Submits a deposit request and lists the user's pending (and past) requests,
// each with its MongoDB id and a copy button.

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetPaymentMethodsQuery,
  useCreateDepositRequestMutation,
  useGetMyDepositRequestsQuery,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import CopyButton from '@/components/shared/CopyButton';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatDateTime, formatBDT } from '@/components/shared/money';
import PageLoader from '@/components/shared/PageLoader';

export default function RechargePage({ showPage }) {
  const { t } = useI18n();
  const user   = useSelector((state) => state.auth.user);
  const userId = user?._id;

  const [amount, setAmount]               = useState('');
  const [method, setMethod]               = useState('');
  const [senderNumber, setSenderNumber]   = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitted, setSubmitted]         = useState(null);

  const { data: methodsData, isLoading: methodsLoading } = useGetPaymentMethodsQuery();
  const { data: requestsData, isLoading: requestsLoading } = useGetMyDepositRequestsQuery(userId, { skip: !userId });
  const [createDeposit, { isLoading: submitting }] = useCreateDepositRequestMutation();

  const paymentMethods = methodsData?.data ?? [];
  const requests       = requestsData?.data ?? [];
  const pending        = requests.filter((r) => r.status === 'pending');
  const history        = requests.filter((r) => r.status !== 'pending');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!method) return notify.error('Please select a payment method first.');
    if (Number(amount) < 200) return notify.error('Minimum deposit is ৳200.');

    try {
      const res = await createDeposit({
        userId,
        amount: Number(amount),
        methodCode: method,
        senderNumber,
        transactionId,
        currency: 'BDT',
      }).unwrap();

      // backend returns the stored request (amount in poisha); fall back to the typed amount
      setSubmitted(res?.data ?? { amount: Number(amount) * 100 });
      notify.success('Deposit request submitted. We will email you once it is reviewed.');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not submit your deposit request.'));
    }
  }

  function resetForm() {
    setSubmitted(null);
    setAmount('');
    setTransactionId('');
    setSenderNumber('');
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-12 sm:py-16">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-xs tracking-widest text-harvest-700 font-extrabold">REQUEST SUBMITTED</p>
        <h2 className="text-2xl font-extrabold mt-2">Deposit request sent!</h2>
        {submitted._id && (
          <div className="mt-4 rounded-xl border bg-white p-3 text-left">
            <p className="text-[11px] font-bold text-slate-500">Request ID</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 break-all text-xs font-semibold">{submitted._id}</code>
              <CopyButton value={submitted._id} />
            </div>
          </div>
        )}
        <p className="text-sm text-slate-500 mt-3 mb-6">
          Your deposit of {formatBDT(submitted.amount)} is under review. You will receive an email when it is approved or rejected.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => showPage('transactions')} className="border rounded-xl py-3 text-sm font-bold">View transactions</button>
          <button onClick={resetForm} className="rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold">New request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-start">

      {/* ── Form ── */}
      <div className="max-w-lg w-full mx-auto xl:mx-0 space-y-5">
        <div>
          <p className="text-xs tracking-widest font-extrabold text-harvest-700">RECHARGE WALLET</p>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-1">{t('recharge.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">Minimum deposit: ৳200</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="deposit-amount">Amount (BDT)</label>
            <input
              id="deposit-amount"
              type="number"
              inputMode="numeric"
              min="200"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min ৳200)"
              className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-base sm:text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[500, 1000, 1300, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className={`px-3 py-2 rounded-lg text-xs font-bold border ${amount === String(amt) ? 'bg-harvest-700 text-white border-harvest-700' : 'bg-white'}`}
              >
                ৳{amt}
              </button>
            ))}
          </div>

          <div>
            <p className="block text-sm font-semibold mb-1.5">Payment method</p>
            {methodsLoading ? (
              <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ) : paymentMethods.length === 0 ? (
              <p className="text-sm text-slate-400 p-4 border rounded-xl">No payment methods available.</p>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map((m) => {
                  const key = m.methodCode || m.name;
                  const selected = method === key;
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setMethod(key)}
                      aria-pressed={selected}
                      className={`w-full border-2 rounded-2xl p-3 sm:p-4 text-left flex items-center gap-3 ${selected ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}
                    >
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white border grid place-items-center font-bold text-xs">
                        {m.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{m.name}</p>
                        <p className="text-xs text-slate-500 break-all">Send to: <b>{m.accountNumber || m.number || '—'}</b></p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="sender-number">Your sender number</label>
            <input
              id="sender-number"
              type="tel"
              inputMode="tel"
              required
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="trx-id">Transaction ID</label>
            <input
              id="trx-id"
              type="text"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter the transaction ID from your payment"
              className="w-full rounded-xl border px-4 py-3.5 outline-none focus:border-harvest-500 text-base sm:text-sm"
            />
          </div>

          <div className="bg-gradient-to-br from-harvest-900 to-harvest-600 text-white rounded-2xl p-5 text-sm">
            <p className="font-extrabold mb-2">How to recharge</p>
            <ol className="space-y-1 text-white/80 text-xs list-decimal list-inside">
              <li>Select a payment method above</li>
              <li>Send the amount to the account number shown</li>
              <li>Enter your sender number and the transaction ID</li>
              <li>Submit — admin reviews it and emails you the result</li>
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

      {/* ── Pending & past requests ── */}
      <div className="w-full space-y-5">
        <div className="bg-white border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold">Pending deposit requests</h2>
            <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs font-bold">{pending.length} pending</span>
          </div>

          {requestsLoading ? (
            <PageLoader label="Loading your requests…" className="py-8" />
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No pending deposit requests.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((r) => <RequestCard key={r._id} r={r} />)}
            </ul>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-4 sm:p-5">
          <h2 className="font-extrabold">Request history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">{t('common.noData')}</p>
          ) : (
            <ul className="mt-4 divide-y">
              {history.slice(0, 10).map((r) => (
                <li key={r._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block text-sm">{formatBDT(r.amount)}</b>
                    <span className="text-[11px] text-slate-500">{formatDateTime(r.createdAt)}</span>
                    {r.adminNote && <p className="text-[11px] text-slate-500 mt-1">Note: {r.adminNote}</p>}
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({ r }) {
  return (
    <li className="rounded-xl border bg-slate-50 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="block text-sm">{formatBDT(r.amount)}</b>
          <span className="text-[11px] text-slate-500">{formatDateTime(r.createdAt)}</span>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-3">
        <p className="text-[11px] font-bold text-slate-500 mb-1">Request ID (MongoDB)</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 truncate rounded-lg bg-white border px-2.5 py-2 text-[11px] sm:text-xs">{r._id}</code>
          <CopyButton value={r._id} />
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 break-all">TrxID: {r.transactionId}</p>
    </li>
  );
}
