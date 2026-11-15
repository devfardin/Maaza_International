'use client';
// src/components/dashboard/pages/RechargePage.jsx
// Recharge the wallet: pick a payment method, pay to its number, then submit the
// sender number and transaction ID. Pending requests appear only while one is waiting.

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
import { roundMoney } from '@/lib/money';
import PageLoader from '@/components/shared/PageLoader';
import SafeHtml from '@/components/shared/SafeHtml';

const AMOUNT_CHIPS = [500, 1000, 1300, 2000, 5000];
const MIN_DEPOSIT = 200;

export default function RechargePage({ showPage }) {
  const { t } = useI18n();
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(''); // selected payment method CODE
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const { data: methodsData, isLoading: methodsLoading } = useGetPaymentMethodsQuery();
  const { data: requestsData, isLoading: requestsLoading } = useGetMyDepositRequestsQuery(userId, { skip: !userId });
  const [createDeposit, { isLoading: submitting }] = useCreateDepositRequestMutation();

  const paymentMethods = methodsData?.data ?? [];
  const selectedMethod = paymentMethods.find((m) => m.code === method) || null;
  const requests = requestsData?.data ?? [];
  const pending = requests.filter((r) => r.status === 'pending');
  const history = requests.filter((r) => r.status !== 'pending');

  // 1 = choose method, 2 = pay & enter details
  const step = selectedMethod ? (amount && Number(amount) >= MIN_DEPOSIT ? 2 : 1) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!method) return notify.error('Please select a payment method first.');
    if (Number(amount) < MIN_DEPOSIT) return notify.error(`Minimum deposit is ৳${MIN_DEPOSIT}.`);

    try {
      const res = await createDeposit({
        userId,
        amount: roundMoney(amount),
        methodCode: method,
        senderNumber,
        transactionId,
        currency: 'BDT',
      }).unwrap();
      setSubmitted(res?.data ?? { amount: roundMoney(amount) });
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
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-harvest-100">
          <span className="absolute inset-0 animate-ping rounded-full bg-harvest-200/60" />
          <span className="relative text-5xl">✅</span>
        </div>
        <p className="mt-6 text-xs font-extrabold tracking-widest text-harvest-700">REQUEST SUBMITTED</p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Deposit request sent!</h2>
        <p className="mt-3 text-sm text-slate-500">
          Your deposit of <b className="text-slate-800">{formatBDT(submitted.amount)}</b> is under review.
          You will get an email when it is approved or rejected.
        </p>

        {submitted._id && (
          <div className="mt-6 rounded-2xl border border-harvest-100 bg-white p-4 text-left shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Request ID</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 break-all text-xs font-semibold text-slate-700">{submitted._id}</code>
              <CopyButton value={submitted._id} />
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => showPage('transactions')} className="rounded-xl border py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            View transactions
          </button>
          <button onClick={resetForm} className="rounded-xl bg-harvest-700 py-3 text-sm font-extrabold text-white hover:bg-harvest-800">
            New request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-harvest-900 via-harvest-700 to-harvest-500 p-5 text-white shadow-soft sm:p-7">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 right-16 h-32 w-32 rounded-full bg-lime-300/15" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-widest text-lime-200">RECHARGE WALLET</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t('recharge.title')}</h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              Send money to one of our payment numbers, then confirm it here. Approved deposits are credited to your recharge wallet.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Minimum</p>
            <p className="text-xl font-extrabold">৳{MIN_DEPOSIT}</p>
          </div>
        </div>

        {/* Steps */}
        <ol className="relative mt-6 grid grid-cols-3 gap-2 text-xs font-bold">
          {['Choose method', 'Pay & confirm', 'Wait for approval'].map((label, i) => (
            <li key={label} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${i < step + 1 ? 'bg-white/20' : 'bg-white/5 text-white/50'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${i < step + 1 ? 'bg-lime-300 text-harvest-900' : 'bg-white/20'}`}>{i + 1}</span>
              <span className="truncate">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-soft sm:p-7">
          {/* Amount */}
          <section>
            <p className="text-sm font-extrabold text-slate-800">1 · Amount (BDT)</p>
            <input
              id="deposit-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={MIN_DEPOSIT}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount (min ৳${MIN_DEPOSIT})`}
              className="mt-2 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-4 text-lg font-extrabold text-slate-900 outline-none transition focus:border-harvest-500 focus:bg-white"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {AMOUNT_CHIPS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    amount === String(amt) ? 'border-harvest-700 bg-harvest-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-harvest-300'
                  }`}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </section>

          {/* Method */}
          <section>
            <p className="text-sm font-extrabold text-slate-800">2 · Payment method</p>
            {methodsLoading ? (
              <div className="mt-2 h-24 animate-pulse rounded-2xl bg-slate-100" />
            ) : paymentMethods.length === 0 ? (
              <p className="mt-2 rounded-2xl border p-4 text-sm text-slate-400">No payment methods available right now.</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {paymentMethods.map((m) => {
                  const selected = method === m.code;
                  return (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setMethod(m.code)}
                      aria-pressed={selected}
                      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition ${
                        selected ? 'border-harvest-600 bg-harvest-50 shadow-soft' : 'border-slate-100 bg-white hover:border-harvest-200'
                      }`}
                    >
                      <div className="grid h-14 w-full place-items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {m.image
                          ? <img src={m.image} alt="" className="max-h-14 max-w-full object-contain" loading="lazy" />
                          : <span className="grid h-12 w-12 place-items-center rounded-xl bg-harvest-100 text-xs font-extrabold text-harvest-700">{m.name?.slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <p className="text-sm font-extrabold leading-tight text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.accountType}</p>
                      <span className="rounded-lg bg-harvest-700 px-2.5 py-1 font-mono text-[11px] font-extrabold tracking-widest text-white">{m.code?.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMethod && (
              <div className="mt-4 space-y-3 rounded-2xl bg-gradient-to-br from-harvest-50 to-white p-4 ring-1 ring-harvest-100">
                <p className="text-sm font-extrabold text-harvest-800">Send ৳{amount || '—'} to {selectedMethod.name}</p>
                <div className="rounded-xl border border-harvest-100 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment number</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all text-base font-extrabold tracking-wide text-slate-900">{selectedMethod.accountNumber}</code>
                    <CopyButton value={selectedMethod.accountNumber} label="Copy" />
                  </div>
                </div>
                {selectedMethod.instructions && (
                  <div className="text-sm text-slate-600">
                    <SafeHtml html={selectedMethod.instructions} />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Confirmation details */}
          <section className="space-y-4">
            <p className="text-sm font-extrabold text-slate-800">3 · Confirm your payment</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-500">Your sender number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-harvest-500 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-500">Transaction ID</span>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="From your payment message"
                  className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-harvest-500 focus:bg-white"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-harvest-700 to-harvest-500 py-4 text-sm font-extrabold text-white shadow-soft transition hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit deposit request →'}
          </button>
        </form>

        {/* Pending (only while something is waiting) and history */}
        <div className="w-full space-y-5">
          {requestsLoading && <PageLoader label="Loading your requests…" className="py-8" />}

          {!requestsLoading && pending.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </span>
                  <h2 className="font-extrabold text-slate-900">Waiting for approval</h2>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{pending.length} pending</span>
              </div>
              <ul className="mt-4 space-y-3">
                {pending.map((r) => <RequestCard key={r._id} r={r} />)}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900">Request history</h2>
              <span className="rounded-full bg-harvest-50 px-2.5 py-1 text-xs font-bold text-harvest-700">{history.length} total</span>
            </div>

            {!requestsLoading && history.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-harvest-50 text-2xl">🧾</div>
                <p className="mt-3 text-sm text-slate-400">{t('common.noData')}</p>
              </div>
            ) : (
              <ol className="relative mt-4 space-y-3 border-l-2 border-harvest-100 pl-5">
                {history.slice(0, 10).map((r) => (
                  <li key={r._id} className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <span className={`absolute -left-[27px] top-5 h-3 w-3 rounded-full ring-4 ring-white ${
                      r.status === 'approved' ? 'bg-harvest-600' : r.status === 'rejected' ? 'bg-rose-500' : 'bg-slate-300'
                    }`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-slate-900">{formatBDT(r.amount)}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">TrxID {r.transactionId}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(r.createdAt)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.adminNote && <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[11px] text-slate-600">Note: {r.adminNote}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ r }) {
  return (
    <li className="rounded-2xl border border-amber-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-slate-900">{formatBDT(r.amount)}</p>
          <span className="text-[11px] text-slate-500">{formatDateTime(r.createdAt)}</span>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-bold text-slate-500">Request ID</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border bg-slate-50 px-2.5 py-2 text-[11px]">{r._id}</code>
          <CopyButton value={r._id} />
        </div>
      </div>
      <p className="mt-2 break-all text-[11px] text-slate-500">TrxID: {r.transactionId}</p>
    </li>
  );
}
