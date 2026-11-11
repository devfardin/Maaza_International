'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetUserTransactionsQuery, useGetMyWalletsQuery } from '@/redux/features/apiSlice';

const TYPE_COLORS = {
  deposit: 'text-emerald-700',
  recharge: 'text-emerald-700',
  reward: 'text-emerald-700',
  profit: 'text-emerald-700',
  commission: 'text-emerald-700',
  withdrawal: 'text-rose-600',
  product_purchase: 'text-rose-600',
  purchase: 'text-rose-600',
};

const STATUS_COLORS = {
  approved: 'text-emerald-700',
  completed: 'text-emerald-700',
  pending: 'text-amber-600',
  rejected: 'text-rose-600',
};

export default function TransactionsPage() {
  const [filter, setFilter] = useState('all');
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: txData, isLoading } = useGetUserTransactionsQuery(userId, { skip: !userId });
  const { data: walletData } = useGetMyWalletsQuery(userId, { skip: !userId });

  const txList = txData?.data || [];

  // New apiSlice returns { rechargeWallet, balanceWallet } shape
  const rechargeBalance = walletData?.data?.rechargeWallet;
  const balanceAmount = walletData?.data?.balanceWallet?.formattedBalance ?? '0.00';

  const totalDeposited = txList
    .filter((t) => ['deposit', 'recharge'].includes(t.type?.toLowerCase()) && t.status !== 'rejected')
    .reduce((s, t) => s + (t.amount || 0), 0);

  const totalEarned = txList
    .filter((t) => ['reward', 'profit', 'commission'].includes(t.type?.toLowerCase()))
    .reduce((s, t) => s + (t.amount || 0), 0);

  const pendingCount = txList.filter((t) => t.status?.toLowerCase() === 'pending').length;

  const visible = filter === 'all'
    ? txList
    : txList.filter((t) => t.type?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">Review wallet activity and request status.</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Recharge wallet', value: `৳ ${rechargeBalance?.balance}` },
          { label: 'Balance wallet', value: `৳ ${balanceAmount}` },
          { label: 'Total deposited', value: `৳ ${(totalDeposited / 100).toFixed(2)}` },
          { label: 'Pending requests', value: String(pendingCount).padStart(2, '0') },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-2xl p-4">
            <small className="text-xs text-slate-500">{label}</small>
            <b className="block text-xl mt-2">{value}</b>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div className="bg-white border rounded-2xl p-4 sm:p-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="font-extrabold">Transaction history</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-xs"
          >
            <option value="all">All</option>
            <option value="deposit">Deposit</option>
            <option value="profit">Profit</option>
            <option value="commission">Commission</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="product_purchase">Purchase</option>
          </select>
        </div>

        {isLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading transactions…</p>}
        {!isLoading && visible.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">No transactions found.</p>
        )}

        {!isLoading && visible.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Transaction</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
              {
                console.log(visible)
              }
                {visible.map((tx) => {
                  const isCredit = tx.flow === 'credit' || ['deposit', 'recharge', 'reward', 'profit', 'commission'].includes(tx.type?.toLowerCase());
                  const amtColor = TYPE_COLORS[tx.type?.toLowerCase()] || 'text-slate-700';
                  const stColor = STATUS_COLORS[tx.status?.toLowerCase()] || 'text-slate-500';
                  // Amount stored in poisha — divide by 100 for BDT display
                  const displayAmt =  tx.amount;
                  return (
                    <tr key={tx._id} className="border-t">
                      <td className="p-3">
                        <span className="capitalize">{tx.type?.replace(/_/g, ' ') || 'Transaction'}</span>
                        <small className="block text-slate-400">{tx._id?.slice(-8).toUpperCase()}</small>
                      </td>
                      <td className="p-3">{new Date(tx.createdAt).toLocaleDateString('en-BD')}</td>
                      <td className={`p-3 font-bold ${amtColor}`}>
                        {isCredit ? '+' : '−'}৳ {Number(displayAmt).toLocaleString()}
                      </td>
                      <td className={`p-3 font-bold capitalize ${stColor}`}>{tx.flow}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
