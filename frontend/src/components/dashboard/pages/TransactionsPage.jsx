'use client';
import { useState } from 'react';

// Transactions page — wallet activity table with type filter

const TRANSACTIONS = [
  { type: 'Recharge',   label: 'Wallet recharge', id: 'RC-261026-034', date: '26 Oct 2026', amount: '+৳1,000', amountColor: 'text-emerald-700', status: 'Approved' },
  { type: 'Reward',     label: 'Task reward',      id: 'RW-261025-018', date: '25 Oct 2026', amount: '+৳20',    amountColor: 'text-emerald-700', status: 'Approved' },
  { type: 'Withdrawal', label: 'Withdrawal',        id: 'WD-261020-104', date: '20 Oct 2026', amount: '−৳150',  amountColor: 'text-rose-600',    status: 'Approved' },
  { type: 'Recharge',   label: 'Wallet recharge',  id: 'RC-261018-022', date: '18 Oct 2026', amount: '+৳2,000', amountColor: 'text-emerald-700', status: 'Pending'  },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState('all');

  const visible = filter === 'all'
    ? TRANSACTIONS
    : TRANSACTIONS.filter(t => t.type === filter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">Review wallet activity and request status.</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Wallet balance',   value: '৳2,450' },
          { label: 'Total recharged',  value: '৳5,000' },
          { label: 'Total rewards',    value: '৳356'   },
          { label: 'Pending requests', value: '01'     },
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
          <h2 className="font-extrabold">Recent transactions</h2>
          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border rounded-xl px-3 py-2 text-xs"
          >
            <option value="all">All</option>
            <option value="Recharge">Recharge</option>
            <option value="Reward">Reward</option>
            <option value="Withdrawal">Withdrawal</option>
          </select>
        </div>

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
              {visible.map(({ label, id, date, amount, amountColor, status }) => (
                <tr key={id} className="border-t">
                  <td className="p-3">
                    {label}
                    <small className="block text-slate-400">{id}</small>
                  </td>
                  <td className="p-3">{date}</td>
                  <td className={`p-3 font-bold ${amountColor}`}>{amount}</td>
                  <td className="p-3">{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
