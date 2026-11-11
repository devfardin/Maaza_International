'use client';
import { useSelector } from 'react-redux';
import { useGetUserTransactionsQuery } from '@/redux/features/apiSlice';

export default function WithdrawalsPage({ showPage }) {
  const user   = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: txData, isLoading } = useGetUserTransactionsQuery(userId, { skip: !userId });

  const withdrawals = (txData?.data || []).filter((t) => t.type === 'withdrawal');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Withdrawal requests</h1>
        <p className="text-sm text-slate-500 mt-1">Track request IDs and payout status.</p>
      </div>

      <div className="bg-white border rounded-2xl p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold">Request history</h2>
          <button onClick={() => showPage('withdraw')} className="bg-harvest-700 text-white rounded-xl px-4 py-3 text-xs font-bold">＋ New request</button>
        </div>

        {isLoading && <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>}

        {!isLoading && withdrawals.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">No withdrawal requests found.</p>
        )}

        {!isLoading && withdrawals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((tx) => (
                  <tr key={tx._id} className="border-t">
                    <td className="p-3 font-mono text-xs">{tx._id?.slice(-10).toUpperCase()}</td>
                    <td className="p-3 font-bold">৳ {tx.amount?.toLocaleString()}</td>
                    <td className="p-3">{new Date(tx.createdAt).toLocaleDateString('en-BD')}</td>
                    <td className={`p-3 font-bold capitalize ${
                      tx.status === 'approved' ? 'text-emerald-700' :
                      tx.status === 'rejected' ? 'text-rose-600' :
                      'text-amber-600'
                    }`}>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
