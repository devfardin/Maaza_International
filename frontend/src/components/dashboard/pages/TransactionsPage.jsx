'use client';
// Wallet activity. Backend stores amounts in poisha; formatBDT converts for display.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetUserTransactionsQuery, useGetMyWalletsQuery } from '@/redux/features/apiSlice';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import PageLoader from '@/components/shared/PageLoader';
import { useI18n } from '@/lib/i18n';

const CREDIT_TYPES = ['deposit', 'daily_checkin', 'profit', 'commission', 'new_user_bonus', 'withdrawal_refund'];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'profit', label: 'Daily income' },
  { value: 'commission', label: 'Commission' },
  { value: 'new_user_bonus', label: 'Welcome bonus' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'withdrawal_refund', label: 'Refund' },
  { value: 'product_purchase', label: 'Purchase' },
];

export default function TransactionsPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState('all');
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: txData, isLoading } = useGetUserTransactionsQuery(userId, { skip: !userId });
  const { data: walletData } = useGetMyWalletsQuery(userId, { skip: !userId });

  const txList = txData?.data || [];
  const recharge = walletData?.data?.rechargeWallet?.balance ?? 0;
  const balance  = walletData?.data?.balanceWallet?.balance ?? 0;

  const visible = filter === 'all' ? txList : txList.filter((tx) => tx.type === filter);
  const totalDeposited = txList
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('transactions.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">Review wallet activity and where every taka went.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Recharge wallet', value: formatBDT(recharge) },
          { label: 'Balance wallet (withdrawable)', value: formatBDT(balance) },
          { label: 'Total deposited', value: formatBDT(totalDeposited) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-2xl p-4 min-w-0">
            <small className="text-xs text-slate-500">{label}</small>
            <b className="block text-base sm:text-xl mt-2 truncate">{value}</b>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-4 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="font-extrabold">Transaction history</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-xs">
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {isLoading && <PageLoader label="Loading transactions…" className="py-8" />}
        {!isLoading && visible.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No transactions found.</p>}

        {!isLoading && visible.length > 0 && (
          <ul className="divide-y">
            {visible.map((tx) => {
              const isCredit = tx.flow === 'credit' || CREDIT_TYPES.includes(tx.type);
              return (
                <li key={tx._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm capitalize">{tx.type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[220px] sm:max-w-md">{tx.note}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(tx.createdAt)} · {tx.walletAffected} wallet</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-extrabold ${isCredit ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isCredit ? '+' : '−'}{formatBDT(tx.amount)}
                    </p>
                    <p className="text-[11px] text-slate-400">Bal {formatBDT(tx.balanceAfter)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
