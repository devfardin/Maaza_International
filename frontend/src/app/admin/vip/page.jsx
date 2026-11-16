'use client';
// VIP levels, daily check-in bonus and weekly salary. Admins and super admins can view the table; only super admins edit it.
// VIP n is stored as membershipLevel n+1, so the "qualified referrals" column is what a
// member needs to reach that VIP level. Money is typed in BDT and sent as BDT.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetVipLevelsQuery, useUpdateVipLevelsMutation } from '@/redux/features/apiSlice';
import PageLoader from '@/components/shared/PageLoader';
import { notify, getErrorMessage } from '@/lib/toast';
import { roundMoney } from '@/lib/money';

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
const field = 'w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-500';

// Server values converted to form strings (money is already BDT)
function rowsFromServer(levels) {
  return LEVELS.map((level) => {
    const found = (levels || []).find((l) => l.level === level) || {};
    return {
      level,
      qualifiedReferrals: found.qualifiedReferrals ?? 0,
      minSpentBdt: String(found.minSpent ?? 0),
      dailyCheckinBonusBdt: String(found.dailyCheckinBonus ?? 0),
      weeklySalaryBdt: String(found.weeklySalary ?? 0),
    };
  });
}

export default function VipLevelsAdminPage() {
  const { data, isLoading } = useGetVipLevelsQuery();
  const [updateVip, { isLoading: saving }] = useUpdateVipLevelsMutation();
  // Only the user's edits are kept in state; the shown rows are server data + edits.
  const [edits, setEdits] = useState({}); // { [level]: { field: value } }
  // Admins can view the ladder; only a super admin can change it (the backend enforces this too)
  const canEdit = useSelector((s) => s.auth.user?.role) === 'super_admin';

  const serverRows = rowsFromServer(data?.data);
  const rows = serverRows.map((r) => ({ ...r, ...(edits[r.level] || {}) }));
  const dirty = Object.keys(edits).length > 0;

  const update = (level, key, value) => {
    if (!canEdit) return;
    setEdits((prev) => ({ ...prev, [level]: { ...(prev[level] || {}), [key]: value } }));
  };

  async function handleSave(e) {
    e.preventDefault();
    const levels = rows.map((r) => ({
      level: r.level,
      qualifiedReferrals: Math.max(0, Math.round(Number(r.qualifiedReferrals) || 0)),
      minSpent: roundMoney(r.minSpentBdt),
      dailyCheckinBonus: roundMoney(r.dailyCheckinBonusBdt),
      weeklySalary: roundMoney(r.weeklySalaryBdt),
    }));
    try {
      await updateVip({ levels }).unwrap();
      notify.success('VIP levels saved.');
      setEdits({});
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save VIP levels.'));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">VIP levels, check-in &amp; weekly salary</h1>
        {!canEdit && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600">
            View only — the VIP levels and check-in bonuses can be changed by a super admin.
          </p>
        )}
        <p className="text-sm text-slate-500 mt-1">
          Members reach a VIP level when they have enough qualified referrals (invitees who deposited and bought a product).
          Each day a VIP member can check in once and receive the bonus for their level, paid to the withdrawable balance.
          Weekly salary is paid every Monday in the 10:00 AM – 10:00 PM claim window (Bangladesh time). Set it to 0 for levels with no salary.
        </p>
      </div>

      {isLoading ? (
        <PageLoader label="Loading VIP levels…" />
      ) : (
        <form onSubmit={handleSave} className="bg-white border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">VIP level</th>
                <th className="text-left px-5 py-3">Qualified referrals</th>
                <th className="text-left px-5 py-3">Min. spend (৳)</th>
                <th className="text-left px-5 py-3">Daily check-in bonus (৳)</th>
                <th className="text-left px-5 py-3">Weekly salary (৳)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.level} className="border-b last:border-0">
                  <td className="px-5 py-3 font-extrabold">VIP {r.level}</td>
                  <td className="px-5 py-3">
                    <input readOnly={!canEdit} type="number" min="0" step="1" value={r.qualifiedReferrals}
                      onChange={(e) => update(r.level, 'qualifiedReferrals', e.target.value)} className={`${field} max-w-[140px]`} />
                  </td>
                  <td className="px-5 py-3">
                    <input readOnly={!canEdit} type="number" min="0" step="0.01" value={r.minSpentBdt}
                      onChange={(e) => update(r.level, 'minSpentBdt', e.target.value)} className={`${field} max-w-[160px]`} />
                  </td>
                  <td className="px-5 py-3">
                    <input readOnly={!canEdit} type="number" min="0" step="0.01" value={r.dailyCheckinBonusBdt}
                      onChange={(e) => update(r.level, 'dailyCheckinBonusBdt', e.target.value)} className={`${field} max-w-[160px]`} />
                  </td>
                  <td className="px-5 py-3">
                    <input readOnly={!canEdit} type="number" min="0" step="0.01" value={r.weeklySalaryBdt}
                      onChange={(e) => update(r.level, 'weeklySalaryBdt', e.target.value)} className={`${field} max-w-[160px]`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-3 p-4 border-t">
            <p className="text-xs text-slate-400">{dirty ? 'Unsaved changes' : 'All changes saved'}</p>
            {canEdit && (
              <button disabled={saving || !dirty} className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save VIP levels'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
