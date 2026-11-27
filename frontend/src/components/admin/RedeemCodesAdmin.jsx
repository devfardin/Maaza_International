'use client';
// Redeem bonus codes. An admin creates a code with a bonus per prize, a number of prizes
// (= how many members can claim) and the VIP levels allowed to claim it. The budget is worked
// out when the code is created. Super admins also see who created each code and every member
// who claimed it, with their details.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetRedeemCodesQuery,
  useCreateRedeemCodeMutation,
  useSetRedeemCodeStatusMutation,
  useGetRedeemCodeClaimsQuery,
} from '@/redux/features/apiSlice';
import PageLoader from '@/components/shared/PageLoader';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import { notify, getErrorMessage } from '@/lib/toast';
import { roundMoney } from '@/lib/money';

const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
const label = 'mb-1 block text-xs font-bold text-slate-600';
const VIP_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

// Today in Bangladesh as YYYY-MM-DD (the date inputs use this format)
const todayBD = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const STATE_BADGE = {
  running:   ['Running', 'bg-emerald-50 text-emerald-700'],
  upcoming:  ['Not started', 'bg-sky-50 text-sky-700'],
  expired:   ['Expired', 'bg-slate-100 text-slate-500'],
  sold_out:  ['Sold out', 'bg-amber-50 text-amber-700'],
  off:       ['Off', 'bg-slate-100 text-slate-500'],
};

const dayText = (iso) => (iso ? formatDateTime(iso).split(',')[0] : '—');

function Sheet({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className={`bg-white w-full ${wide ? 'sm:max-w-5xl' : 'sm:max-w-xl'} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-xl`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-lg">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl border grid place-items-center">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Create form. The budget is calculated live, so the admin sees the total before saving.
function RedeemCodeForm({ onSave, onCancel, saving }) {
  const today = todayBD();
  const [f, setF] = useState({ code: '', startDate: today, endDate: '', amount: '', prizeCount: '', allowedVipLevels: [] });

  const amount = roundMoney(Number(f.amount) || 0);
  const prizes = Math.floor(Number(f.prizeCount) || 0);
  const total = roundMoney(amount * prizes);

  function toggleLevel(level) {
    setF((p) => ({
      ...p,
      allowedVipLevels: p.allowedVipLevels.includes(level)
        ? p.allowedVipLevels.filter((l) => l !== level)
        : [...p.allowedVipLevels, level].sort((a, b) => a - b),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!(amount > 0)) return notify.error('Enter the bonus amount for each prize.');
    if (!(prizes >= 1)) return notify.error('Enter how many prizes there are (how many people can claim).');
    if (f.allowedVipLevels.length === 0) return notify.error('Choose at least one VIP level.');
    if (!f.startDate) return notify.error('Choose the start date.');
    if (!f.endDate) return notify.error('Choose the end date.');
    if (f.endDate < f.startDate) return notify.error('The end date cannot be before the start date.');
    if (f.endDate < today) return notify.error('The end date cannot be in the past.');

    onSave({
      code: f.code.trim().toUpperCase(),
      startDate: f.startDate,
      endDate: f.endDate,
      amount,
      prizeCount: prizes,
      allowedVipLevels: f.allowedVipLevels,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={label}>Code</label>
        <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={32}
          placeholder="Leave empty to generate one" className={`${field} uppercase tracking-wider`} />
        <p className="mt-1 text-[11px] text-slate-400">4 to 32 letters, numbers or dashes. Members type this code to claim.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="redeem-start" className={label}>Start date</label>
          <input id="redeem-start" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })}
            className={field} />
          <p className="mt-1 text-[11px] text-slate-400">Members can claim from the start of this day (Bangladesh time).</p>
        </div>
        <div>
          <label htmlFor="redeem-end" className={label}>End date</label>
          <input id="redeem-end" type="date" min={f.startDate || today} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })}
            className={field} />
          <p className="mt-1 text-[11px] text-slate-400">The code stops working at the end of this day.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Bonus per prize (৳)</label>
          <input type="number" min={1} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })}
            placeholder="e.g. 100" className={field} />
          <p className="mt-1 text-[11px] text-slate-400">Added to the member&apos;s balance wallet.</p>
        </div>
        <div>
          <label className={label}>Number of prizes</label>
          <input type="number" min={1} step={1} value={f.prizeCount} onChange={(e) => setF({ ...f, prizeCount: e.target.value })}
            placeholder="e.g. 50" className={field} />
          <p className="mt-1 text-[11px] text-slate-400">How many people can claim this code.</p>
        </div>
      </div>

      <div>
        <label className={label}>Who can claim (VIP levels)</label>
        <div className="flex flex-wrap gap-2">
          {VIP_LEVELS.map((level) => {
            const on = f.allowedVipLevels.includes(level);
            return (
              <button key={level} type="button" onClick={() => toggleLevel(level)} aria-pressed={on}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${on ? 'border-blue-600 bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                VIP {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget, calculated live */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Bonus per prize</span><b>{formatBDT(amount)}</b></div>
        <div className="flex justify-between"><span className="text-slate-600">Number of prizes (people)</span><b>{prizes.toLocaleString()}</b></div>
        <div className="flex justify-between border-t border-blue-100 pt-2">
          <span className="font-bold">Total redeem budget</span>
          <b className="text-lg text-blue-700">{formatBDT(total)}</b>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border py-3 text-sm font-bold">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? 'Creating…' : 'Create code'}
        </button>
      </div>
    </form>
  );
}

// Who claimed the code. Every admin sees name, phone, VIP, amount and time.
// The super admin also sees the full member record and wallet balances.
function ClaimsSheet({ codeId, onClose, isSuper }) {
  const { data, isLoading } = useGetRedeemCodeClaimsQuery(codeId);
  const code = data?.data?.code;
  const claims = data?.data?.claims ?? [];

  return (
    <Sheet title={code ? `Claimed by · ${code.code}` : 'Claimed by'} onClose={onClose} wide>
      {isLoading && <PageLoader label="Loading claims…" />}

      {code && (
        <div className={`grid grid-cols-2 ${isSuper ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-5 text-sm`}>
          <div className="rounded-xl bg-slate-50 border p-3"><small className="text-xs text-slate-500">Bonus per prize</small><b className="block">{formatBDT(code.amount)}</b></div>
          <div className="rounded-xl bg-slate-50 border p-3"><small className="text-xs text-slate-500">Claimed</small><b className="block">{code.claimedCount} / {code.prizeCount} users</b></div>
          <div className="rounded-xl bg-slate-50 border p-3"><small className="text-xs text-slate-500">Left</small><b className="block">{code.remainingCount} users</b></div>
          {isSuper && <div className="rounded-xl bg-slate-50 border p-3"><small className="text-xs text-slate-500">Created by</small><b className="block truncate">{code.createdByName || '—'}</b></div>}
        </div>
      )}

      {!isLoading && claims.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">Nobody has claimed this code yet.</p>
      )}

      {claims.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 pr-3 font-bold">Member</th>
                <th className="py-2 pr-3 font-bold">Phone</th>
                <th className="py-2 pr-3 font-bold">VIP</th>
                {isSuper && <th className="py-2 pr-3 font-bold">Email</th>}
                {isSuper && <th className="py-2 pr-3 font-bold">Status</th>}
                {isSuper && <th className="py-2 pr-3 font-bold">District</th>}
                {isSuper && <th className="py-2 pr-3 font-bold">Joined</th>}
                {isSuper && <th className="py-2 pr-3 font-bold">Balance wallet</th>}
                {isSuper && <th className="py-2 pr-3 font-bold">Recharge wallet</th>}
                <th className="py-2 pr-3 font-bold">Claimed</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c._id} className="border-b last:border-0 align-top">
                  <td className="py-2.5 pr-3">
                    <b className="block">{c.user?.fullName || 'Deleted user'}</b>
                    {isSuper && <span className="text-[11px] text-slate-400">Ref: {c.user?.referralCode || '—'}</span>}
                  </td>
                  <td className="py-2.5 pr-3">{c.user?.phone || '—'}</td>
                  <td className="py-2.5 pr-3">VIP {c.vipLevel}</td>
                  {isSuper && <td className="py-2.5 pr-3 break-all">{c.user?.email || '—'}</td>}
                  {isSuper && <td className="py-2.5 pr-3 capitalize">{c.user?.status || '—'}</td>}
                  {isSuper && <td className="py-2.5 pr-3">{c.user?.district || '—'}</td>}
                  {isSuper && <td className="py-2.5 pr-3">{c.user?.createdAt ? formatDateTime(c.user.createdAt) : '—'}</td>}
                  {isSuper && <td className="py-2.5 pr-3">{formatBDT(c.wallets?.balanceWallet ?? 0)}</td>}
                  {isSuper && <td className="py-2.5 pr-3">{formatBDT(c.wallets?.rechargeWallet ?? 0)}</td>}
                  <td className="py-2.5 pr-3">
                    <b className="block text-emerald-700">+ {formatBDT(c.amount)}</b>
                    <span className="text-[11px] text-slate-400">{formatDateTime(c.claimedAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Sheet>
  );
}

export default function RedeemCodesAdmin() {
  const me = useSelector((s) => s.auth.user);
  const isSuper = me?.role === 'super_admin';

  const { data, isLoading } = useGetRedeemCodesQuery();
  const [createRedeemCode, { isLoading: creating }] = useCreateRedeemCodeMutation();
  const [setRedeemCodeStatus] = useSetRedeemCodeStatusMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [claimsCodeId, setClaimsCodeId] = useState(null);

  const codes = data?.data ?? [];

  async function handleCreate(payload) {
    try {
      const res = await createRedeemCode(payload).unwrap();
      notify.success(`Code ${res?.data?.code} created.`);
      setShowCreate(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not create the code.'));
    }
  }

  async function handleToggle(c) {
    try {
      await setRedeemCodeStatus({ id: c._id, isActive: !c.isActive }).unwrap();
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not change the code.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Redeem codes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create a bonus code for members. Each prize goes to the member&apos;s balance wallet. One claim per member per code.
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">
          + New code
        </button>
      </div>

      {isLoading && <PageLoader label="Loading codes…" />}

      {!isLoading && codes.length === 0 && (
        <div className="bg-white border rounded-2xl p-10 text-center text-sm text-slate-400">No redeem codes yet. Create the first one.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {codes.map((c) => (
          <div key={c._id} className="bg-white border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-extrabold tracking-wider break-all">{c.code}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {formatBDT(c.amount)} per prize · {c.prizeCount} prize{c.prizeCount === 1 ? '' : 's'}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${(STATE_BADGE[c.state] ?? STATE_BADGE.off)[1]}`}>
                {(STATE_BADGE[c.state] ?? STATE_BADGE.off)[0]}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-blue-50 p-3">
                <small className="block text-[11px] text-slate-500">Budget</small>
                <b className="text-sm">{formatBDT(c.totalBudget)}</b>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <small className="block text-[11px] text-slate-500">Claimed</small>
                <b className="text-sm">{c.claimedCount} users</b>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <small className="block text-[11px] text-slate-500">Left</small>
                <b className="text-sm">{c.remainingCount} users</b>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              <b>Valid:</b> {dayText(c.startsAt)} → {dayText(c.expiresAt)}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {c.allowedVipLevels.map((l) => (
                <span key={l} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-bold">VIP {l}</span>
              ))}
            </div>

            {isSuper && (
              <p className="text-xs text-slate-500">
                <b>Created by:</b> {c.createdByName || '—'} <span className="text-slate-400">({c.createdByRole === 'super_admin' ? 'super admin' : 'admin'})</span>
                {' · '}{formatDateTime(c.createdAt)}
              </p>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => setClaimsCodeId(c._id)} className="rounded-xl border px-3 py-2 text-xs font-bold">
                Claimed by ({c.claimedCount})
              </button>
              <button type="button" onClick={() => handleToggle(c)} className="rounded-xl border px-3 py-2 text-xs font-bold">
                {c.isActive ? 'Turn off' : 'Turn on'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Sheet title="New redeem code" onClose={() => setShowCreate(false)}>
          <RedeemCodeForm onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={creating} />
        </Sheet>
      )}

      {claimsCodeId && <ClaimsSheet codeId={claimsCodeId} isSuper={isSuper} onClose={() => setClaimsCodeId(null)} />}
    </div>
  );
}
