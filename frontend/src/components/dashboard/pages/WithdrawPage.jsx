'use client';
// Withdraw: request a payout from the balance wallet to an ACTIVE bKash or Nagad account.
// A processing / tax fee (8%) is taken from every withdrawal; the preview shows what arrives.
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMyWalletsQuery,
  useGetMyPaymentAccountsQuery,
  useCreateWithdrawalMutation,
  useGetMyWithdrawalsQuery,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import StatusBadge from '@/components/shared/StatusBadge';
import { floorMoney, roundMoney } from '@/lib/money';
import { formatBDT, formatDateTime } from '@/components/shared/money';

const MIN_WITHDRAWAL = 120;
const FEE_PERCENT = 8;

const NOTICES = [
  'You must be a valid member to withdraw: make a deposit and buy at least one product.',
  'Minimum withdrawal request is ৳120.',
  'Withdrawals are paid to a bKash or Nagad personal wallet only.',
  `Every withdrawal has a ${FEE_PERCENT}% processing and tax fee, deducted from the amount.`,
  'Processing and delivery take 24 to 48 hours.',
];

export default function WithdrawPage({ showPage }) {
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const { data: walletsData } = useGetMyWalletsQuery(userId, { skip: !userId });
  const { data: accountsData, isLoading: accountsLoading } = useGetMyPaymentAccountsQuery();
  const { data: withdrawalsData } = useGetMyWithdrawalsQuery();
  const [createWithdrawal, { isLoading: submitting }] = useCreateWithdrawalMutation();

  const balance = walletsData?.data?.balanceWallet?.balance ?? 0;
  const availableBDT = Number(balance) || 0;

  // Only active accounts can receive a withdrawal
  const accounts = useMemo(
    () => (accountsData?.data ?? []).filter((a) => a.status === 'active'),
    [accountsData]
  );
  const selectedAccount = accounts.find((a) => a._id === accountId) ?? accounts[0] ?? null;
  const withdrawals = withdrawalsData?.data ?? [];

  // Live preview of the fee and the amount the member receives
  const value = roundMoney(Number(amount) || 0);
  const fee = floorMoney((value * FEE_PERCENT) / 100);
  const receive = roundMoney(value - fee);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedAccount) return notify.error('Activate a bKash or Nagad account on the Bank Details page first.');
    if (!(value >= MIN_WITHDRAWAL)) return notify.error(`Minimum withdrawal is ৳${MIN_WITHDRAWAL}.`);
    if (value > availableBDT) return notify.error(`Amount is more than your available balance (${formatBDT(balance)}).`);
    if (!confirmed) return notify.error('Please confirm your payout details first.');

    try {
      await createWithdrawal({ amount: value, paymentAccountId: selectedAccount._id }).unwrap();
      notify.success('Withdrawal request submitted. We will email you when it is reviewed.');
      setAmount('');
      setConfirmed(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not submit your withdrawal request.'));
    }
  }

  const inputCls = 'w-full rounded-xl border px-4 py-3.5 text-base sm:text-sm outline-none focus:border-harvest-500';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs tracking-widest font-extrabold text-harvest-700">WITHDRAW</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Withdraw your balance</h1>
        <p className="text-sm text-slate-500 mt-1">Send money from your balance wallet to your bKash or Nagad.</p>
      </div>

      {/* Important notices */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-xs font-extrabold tracking-wider text-amber-700">IMPORTANT</p>
        <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
          {NOTICES.map((n) => (
            <li key={n} className="flex gap-2"><span>•</span><span>{n}</span></li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-amber-900">
          <b>Please bind the correct receiving account.</b> The number must start with <b>01</b> and be <b>11 digits</b> long.
        </p>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-5 items-start">
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-harvest-50 border p-4">
              <small className="text-xs text-slate-500">Available balance</small>
              <b className="block text-lg sm:text-xl mt-1.5">{formatBDT(balance)}</b>
            </div>
            <div className="rounded-xl bg-slate-50 border p-4">
              <small className="text-xs text-slate-500">Minimum withdrawal</small>
              <b className="block text-lg sm:text-xl mt-1.5">৳{MIN_WITHDRAWAL}.00</b>
            </div>
          </div>

          <div>
            <label htmlFor="wd-amount" className="block text-sm font-bold mb-2">Withdrawal amount (৳)</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {[120, 500, 1000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${amount === String(v) ? 'bg-harvest-700 text-white border-harvest-700' : 'bg-white'}`}>
                  ৳{v}
                </button>
              ))}
              <button type="button" onClick={() => setAmount(String(Math.floor(availableBDT)))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white">Max</button>
            </div>
            <input id="wd-amount" type="number" inputMode="numeric" min={MIN_WITHDRAWAL} step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className={inputCls} />
          </div>

          {/* Fee preview */}
          <div className="rounded-xl border border-dashed border-harvest-200 bg-harvest-50/50 p-4 text-sm">
            <div className="flex justify-between py-1"><span className="text-slate-600">Withdrawal amount</span><b>৳{value.toLocaleString()}</b></div>
            <div className="flex justify-between py-1"><span className="text-slate-600">Processing &amp; tax fee ({FEE_PERCENT}%)</span><b className="text-rose-600">- ৳{fee.toLocaleString()}</b></div>
            <div className="mt-2 flex justify-between border-t pt-2"><span className="font-bold">You will receive</span><b className="text-lg text-harvest-700">৳{receive.toLocaleString()}</b></div>
          </div>

          <div>
            <p className="block text-sm font-bold mb-2">Payout account</p>
            {accountsLoading ? (
              <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ) : accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                No active payout account.{' '}
                <button type="button" onClick={() => showPage?.('bank')} className="font-bold text-harvest-700 underline">Open bank details</button>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((a) => {
                  const selected = selectedAccount?._id === a._id;
                  return (
                    <button key={a._id} type="button" aria-pressed={selected} onClick={() => setAccountId(a._id)}
                      className={`w-full rounded-xl border-2 p-3.5 flex items-center gap-3 text-left ${selected ? 'border-harvest-600 bg-harvest-50' : 'border-slate-200'}`}>
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-pink-50 grid place-items-center text-lg">📱</span>
                      <span className="min-w-0 flex-1">
                        <b className="block text-sm truncate">{a.method === 'bkash' ? 'bKash' : 'Nagad'} · {a.accountHolderName}</b>
                        <small className="text-xs text-slate-500 break-all">{a.accountNumber}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="flex gap-3 items-start text-sm text-slate-600">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>I confirm the payout number is correct. The full amount is held from my balance until the request is reviewed.</span>
          </label>

          <button type="submit" disabled={submitting || accounts.length === 0}
            className="w-full rounded-xl bg-harvest-700 text-white py-4 font-extrabold disabled:opacity-60">
            {submitting ? 'Submitting…' : 'Request withdrawal →'}
          </button>
        </form>

        {/* History */}
        <div className="bg-white border rounded-2xl p-5 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold">Recent withdrawals</h3>
            <button onClick={() => showPage?.('withdrawals')} className="text-xs font-bold text-harvest-700">View all</button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No withdrawals yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {withdrawals.slice(0, 5).map((w) => (
                <li key={w._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block text-sm">{formatBDT(w.amount)}</b>
                    {w.netAmount !== undefined && (
                      <span className="block text-[11px] text-slate-500">Received {formatBDT(w.netAmount)}</span>
                    )}
                    <span className="text-[11px] text-slate-400">{formatDateTime(w.createdAt)}</span>
                  </div>
                  <StatusBadge status={w.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
