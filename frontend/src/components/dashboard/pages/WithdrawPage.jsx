'use client';
// Withdraw earnings: pick a saved payout account and request an amount from the balance wallet.
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMyWalletsQuery,
  useGetMyPaymentAccountsQuery,
  useCreateWithdrawalMutation,
  useGetMyWithdrawalsQuery,
} from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatBDT, formatDateTime, bdtFromPoisha } from '@/components/shared/money';

const MIN_WITHDRAWAL = 100;

export default function WithdrawPage({ showPage }) {
  const { t } = useI18n();
  const user   = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const [amount, setAmount]         = useState('');
  const [accountId, setAccountId]   = useState('');
  const [confirmed, setConfirmed]   = useState(false);

  const { data: walletsData } = useGetMyWalletsQuery(userId, { skip: !userId });
  const { data: accountsData, isLoading: accountsLoading } = useGetMyPaymentAccountsQuery();
  const { data: withdrawalsData } = useGetMyWithdrawalsQuery();
  const [createWithdrawal, { isLoading: submitting }] = useCreateWithdrawalMutation();

  const availableBDT = bdtFromPoisha(walletsData?.data?.balanceWallet?.balance ?? 0);
  const accounts = useMemo(() => accountsData?.data ?? [], [accountsData]);
  const selectedAccount = useMemo(
    () => accounts.find((a) => a._id === (accountId || accounts[0]?._id)) ?? null,
    [accounts, accountId]
  );
  const withdrawals = withdrawalsData?.data ?? [];

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!selectedAccount) return notify.error('Add a bKash or Nagad payout account first.');
    if (!Number.isInteger(value) || value < MIN_WITHDRAWAL) return notify.error(`Minimum withdrawal is ৳${MIN_WITHDRAWAL}.`);
    if (value > availableBDT) return notify.error(`Amount is more than your available balance (${formatBDT(Math.round(availableBDT * 100))}).`);
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('withdraw.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">Request a payout from your balance to your bKash or Nagad account.</p>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-5 items-start">
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 sm:p-7 space-y-5">
          <h2 className="font-extrabold text-lg">New withdrawal request</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-harvest-50 border p-4">
              <small className="text-xs text-slate-500">Available balance</small>
              <b className="block text-lg sm:text-xl mt-1.5">{formatBDT(walletsData?.data?.balanceWallet?.balance ?? 0)}</b>
            </div>
            <div className="rounded-xl bg-slate-50 border p-4">
              <small className="text-xs text-slate-500">Minimum withdrawal</small>
              <b className="block text-lg sm:text-xl mt-1.5">৳{MIN_WITHDRAWAL}.00</b>
            </div>
          </div>

          <div>
            <label htmlFor="wd-amount" className="block text-sm font-bold mb-2">Withdrawal amount (৳)</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {[500, 1000, 2000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${amount === String(v) ? 'bg-harvest-700 text-white border-harvest-700' : 'bg-white'}`}>
                  ৳{v}
                </button>
              ))}
              <button type="button" onClick={() => setAmount(String(Math.floor(availableBDT)))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-white">Max</button>
            </div>
            <input id="wd-amount" type="number" inputMode="numeric" min={MIN_WITHDRAWAL} step="1"
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className={inputCls} />
          </div>

          <div>
            <p className="block text-sm font-bold mb-2">Payout account</p>
            {accountsLoading ? (
              <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ) : accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                No payout account saved.{' '}
                <button type="button" onClick={() => showPage?.('bank')} className="font-bold text-harvest-700 underline">Add one</button>
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
            <span>I confirm the payout details are correct. The amount is held from my balance until the request is reviewed.</span>
          </label>

          <button type="submit" disabled={submitting || accounts.length === 0}
            className="w-full rounded-xl bg-harvest-700 text-white py-4 font-extrabold disabled:opacity-60">
            {submitting ? 'Submitting…' : `${t('withdraw.submit')} →`}
          </button>
        </form>

        <div className="bg-white border rounded-2xl p-5 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold">Recent withdrawals</h3>
            <button onClick={() => showPage?.('withdrawals')} className="text-xs font-bold text-harvest-700">View all</button>
          </div>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t('common.noData')}</p>
          ) : (
            <ul className="mt-3 divide-y">
              {withdrawals.slice(0, 5).map((w) => (
                <li key={w._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block text-sm">{formatBDT(w.amount)}</b>
                    <span className="text-[11px] text-slate-500">{formatDateTime(w.createdAt)}</span>
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
