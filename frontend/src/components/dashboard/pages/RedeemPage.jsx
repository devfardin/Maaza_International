'use client';
// Redeem bonus: a member types a code given by the company and the prize is added to the
// balance wallet (the one they withdraw from). Each member can claim a code only once, and only
// when their VIP level is one the code was made for.
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useClaimRedeemCodeMutation, useGetMyRedeemClaimsQuery } from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { formatBDT, formatDateTime } from '@/components/shared/money';
import { vipLabel, vipLevelOf } from '@/lib/vip';
import PageTitle from '../PageTitle';

const NOTICES = [
  'Enter the code exactly as it was given to you. Codes are not case-sensitive.',
  'Each code can be claimed only once per member.',
  'The bonus is added to your balance wallet, so you can withdraw it.',
  'Some codes are only for certain VIP levels. A code for another level will not work for your account.',
];

export default function RedeemPage() {
  const user = useSelector((s) => s.auth.user);
  const vip = vipLevelOf(user?.membershipLevel);

  const [code, setCode] = useState('');
  const [claimRedeemCode, { isLoading: claiming }] = useClaimRedeemCodeMutation();
  const { data: claimsData, isLoading: claimsLoading } = useGetMyRedeemClaimsQuery();
  const claims = claimsData?.data ?? [];

  async function handleSubmit(e) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return notify.error('Enter a redeem code first.');

    try {
      const res = await claimRedeemCode({ code: value }).unwrap();
      notify.success(`৳${Number(res?.data?.amount ?? 0).toFixed(2)} added to your balance wallet.`);
      setCode('');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not claim this code. Please try again.'));
    }
  }

  const inputCls = 'w-full rounded-xl border px-4 py-3.5 text-base sm:text-sm outline-none focus:border-harvest-500 uppercase tracking-wider';

  return (
    <div className="space-y-5">
      <PageTitle titleKey="Redeem bonus" />

      {/* Important notices */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-xs font-extrabold tracking-wider text-amber-700">IMPORTANT</p>
        <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
          {NOTICES.map((n) => (
            <li key={n} className="flex gap-2"><span>•</span><span>{n}</span></li>
          ))}
        </ul>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] gap-5 items-start">
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="rounded-xl bg-harvest-50 border p-4">
            <small className="text-xs text-slate-500">Your VIP level</small>
            <b className="block text-lg sm:text-xl mt-1.5">{vipLabel(vip)}</b>
          </div>

          <div>
            <label htmlFor="redeem-code" className="block text-sm font-bold mb-2">Redeem code</label>
            <input
              id="redeem-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={64}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className={inputCls}
            />
          </div>

          <button type="submit" disabled={claiming || !code.trim()}
            className="w-full rounded-xl bg-harvest-700 text-white py-4 font-extrabold disabled:opacity-60">
            {claiming ? 'Claiming…' : 'Claim bonus →'}
          </button>
        </form>

        {/* History */}
        <div className="bg-white border rounded-2xl p-5 h-fit">
          <h3 className="font-extrabold">My redeemed bonuses</h3>

          {claimsLoading ? (
            <div className="h-16 rounded-xl bg-slate-100 animate-pulse mt-3" />
          ) : claims.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">You have not claimed any code yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {claims.map((c) => (
                <li key={c._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block text-sm tracking-wider">{c.code}</b>
                    <span className="block text-[11px] text-slate-500">{vipLabel(c.vipLevel)}</span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(c.claimedAt)}</span>
                  </div>
                  <b className="text-sm text-harvest-700 shrink-0">+ {formatBDT(c.amount)}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
