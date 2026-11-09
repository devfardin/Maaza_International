'use client';

// Withdrawals page — full table of all withdrawal requests

const WITHDRAWALS = [
  { id: 'WD-261020-104', amount: '৳150.00', method: 'bKash', date: '20 Oct 2026', status: 'Approved', statusColor: 'text-emerald-700' },
  { id: 'WD-261017-098', amount: '৳100.00', method: 'Nagad', date: '17 Oct 2026', status: 'Pending',  statusColor: 'text-amber-700'   },
];

export default function WithdrawalsPage({ showPage }) {
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

        {/* Horizontally scrollable on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {WITHDRAWALS.map(({ id, amount, method, date, status, statusColor }) => (
                <tr key={id} className="border-t">
                  <td className="p-3">{id}</td>
                  <td className="p-3">{amount}</td>
                  <td className="p-3">{method}</td>
                  <td className="p-3">{date}</td>
                  <td className={`p-3 font-bold ${statusColor}`}>{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
