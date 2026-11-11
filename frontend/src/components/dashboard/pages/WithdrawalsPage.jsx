'use client';
// Full withdrawal history for the logged-in user, with live status.
import { useGetMyWithdrawalsQuery } from '@/redux/features/apiSlice';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import StatusBadge from '@/components/shared/StatusBadge';
import PageLoader from '@/components/shared/PageLoader';
import CopyButton from '@/components/shared/CopyButton';
import { useI18n } from '@/lib/i18n';

export default function WithdrawalsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useGetMyWithdrawalsQuery(undefined, { pollingInterval: 60000 });
  const rows = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('nav.withdrawals')}</h1>
        <p className="text-sm text-slate-500 mt-1">Every payout request you have made and what happened to it.</p>
      </div>

      {isLoading ? (
        <PageLoader label="Loading withdrawals…" />
      ) : rows.length === 0 ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">{t('common.noData')}</div>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((w) => (
              <li key={w._id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b className="text-base">{formatBDT(w.amount)}</b>
                    <p className="text-[11px] text-slate-500">{formatDateTime(w.createdAt)}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <p className="text-xs text-slate-600 mt-2">{w.method === 'bkash' ? 'bKash' : 'Nagad'} · {w.accountNumber}</p>
                {w.payoutReference && <p className="text-xs text-slate-600 mt-1">Ref: {w.payoutReference}</p>}
                {w.adminNote && <p className="text-xs text-slate-500 mt-1">Note: {w.adminNote}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate text-[11px] bg-slate-50 border rounded-lg px-2 py-1.5">{w._id}</code>
                  <CopyButton value={w._id} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">{t('common.amount')}</th>
                  <th className="p-3">Payout to</th>
                  <th className="p-3">{t('common.date')}</th>
                  <th className="p-3">{t('common.status')}</th>
                  <th className="p-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w._id} className="border-t align-top">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px]">{w._id.slice(-10)}</code>
                        <CopyButton value={w._id} />
                      </div>
                    </td>
                    <td className="p-3 font-bold">{formatBDT(w.amount)}</td>
                    <td className="p-3">{w.method === 'bkash' ? 'bKash' : 'Nagad'} · {w.accountNumber}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(w.createdAt)}</td>
                    <td className="p-3"><StatusBadge status={w.status} /></td>
                    <td className="p-3 text-xs text-slate-500">{w.adminNote || w.payoutReference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
