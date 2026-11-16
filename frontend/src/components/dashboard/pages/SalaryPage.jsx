'use client';
// Weekly VIP salary. Every member can see the page and the schedule.
// Only members whose VIP level has a weekly salary get the claim button.
// Claims are open every Monday 10:00 AM – 10:00 PM (Bangladesh time); unclaimed salary is lost.
import Link from 'next/link';
import { useClaimSalaryMutation, useGetSalaryStatusQuery } from '@/redux/features/apiSlice';
import CountdownTimer from '@/components/shared/CountdownTimer';
import CopyButton from '@/components/shared/CopyButton';
import PageLoader from '@/components/shared/PageLoader';
import { notify, getErrorMessage } from '@/lib/toast';
import { vipLabel } from '@/lib/vip';

const fmt = (amount) => `৳ ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const whenText = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }) + ' (BD time)'
    : '—';

export default function SalaryPage() {
  const { data, isLoading, refetch } = useGetSalaryStatusQuery();
  const [claimSalary, { isLoading: claiming }] = useClaimSalaryMutation();
  const s = data?.data;

  if (isLoading || !s) return <PageLoader label="Loading salary…" />;

  const { window: win } = s;
  const isOpen = win.state === 'open';
  const countdownTarget = isOpen ? win.closesAt : win.opensAt;

  async function handleClaim() {
    try {
      const res = await claimSalary().unwrap();
      notify.success(`Salary claimed! ${fmt(res?.data?.amount)} added to your balance.`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not claim your salary right now.'));
    }
  }

  // ── Status card (what happens right now for this member)
  let tone = 'bg-white';
  let title = '';
  let message = '';
  let action = null;

  if (!s.eligible) {
    tone = 'bg-slate-50';
    title = 'Weekly salary not available on your level';
    message = 'Reach a VIP level with a weekly salary to start receiving it every Monday.';
  } else if (s.claimedThisWeek) {
    tone = 'bg-emerald-50';
    title = `✓ Salary claimed: ${fmt(s.claimedAmount)}`;
    message = isOpen
      ? 'You already claimed this week\'s salary. The next window opens next Monday.'
      : 'Your salary for this week is in your balance. The next window opens next Monday.';
  } else if (isOpen) {
    tone = 'bg-harvest-50';
    title = `Claim your ${fmt(s.weeklySalary)} salary now`;
    message = `The window is open. Claim before it closes, or this week's salary is lost.`;
    action = (
      <button
        onClick={handleClaim}
        disabled={claiming || !s.canClaim}
        className="w-full sm:w-auto sm:min-w-56 rounded-xl bg-harvest-700 text-white px-6 py-3.5 text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {claiming ? 'Claiming…' : `Claim ${fmt(s.weeklySalary)}`}
      </button>
    );
  } else {
    tone = 'bg-white';
    title = `Your next salary: ${fmt(s.weeklySalary)}`;
    message = `It can be claimed on Monday from ${win.claimHours} (Bangladesh time), when the window opens.`;
  }

  const showMissed = s.eligible && s.missedLastWindow && !isOpen;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-harvest-700">WEEKLY SALARY</p>
        <h1 className="text-2xl font-extrabold mt-1">Your weekly salary</h1>
        <p className="text-sm text-slate-500 mt-1">
          Salary is paid every Monday from {win.claimHours} (Bangladesh time). Claim it inside the window. If you do not claim it,
          that week&apos;s salary is not paid and you wait for the next Monday.
        </p>
      </div>

      {/* Status + countdown */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${tone}`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500">{vipLabel(s.vipLevel)}</p>
            <h2 className="font-extrabold text-lg mt-1">{title}</h2>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
            {showMissed && (
              <p className="text-xs text-amber-700 font-bold mt-3">
                The last window closed without a claim, so that salary was not paid.
              </p>
            )}
          </div>

          <div className="lg:text-right shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {isOpen ? 'Window closes in' : 'Window opens in'}
            </p>
            <div className="text-2xl mt-1">
              <CountdownTimer target={countdownTarget} onDone={() => refetch()} doneLabel={isOpen ? 'Closed' : 'Open now'} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isOpen ? `Closes ${whenText(win.closesAt)}` : `Opens ${whenText(win.opensAt)}`}
            </p>
          </div>
        </div>
        {action && <div className="mt-5">{action}</div>}
      </div>

      {/* Referral path for members who are not eligible */}
      {!s.eligible && s.referral && (
        <div className="rounded-2xl bg-white border p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-extrabold text-lg">How to get a weekly salary</h2>
            {s.referral.target ? (
              <p className="text-sm text-slate-600 mt-1">
                Reach <b>{vipLabel(s.referral.target.vipLevel)}</b> to receive{' '}
                <b>{fmt(s.referral.target.weeklySalary)}</b> every Monday. Invite people with your referral code. Each invitee
                counts once they deposit and buy a product.
              </p>
            ) : (
              <p className="text-sm text-slate-600 mt-1">No VIP level with a weekly salary is available yet.</p>
            )}
          </div>

          {s.referral.target && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">Valid referrals</p>
                <p className="font-extrabold mt-1">
                  {s.referral.validReferrals} / {s.referral.target.qualifiedReferrals}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {s.referral.target.referralsLeft > 0
                    ? `${s.referral.target.referralsLeft} more to go`
                    : 'Requirement met'}
                </p>
              </div>
              {s.referral.target.minSpent > 0 && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">Your purchases</p>
                  <p className="font-extrabold mt-1">
                    {fmt(s.referral.totalSpent)} / {fmt(s.referral.target.minSpent)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.referral.target.spentLeft > 0 ? `${fmt(s.referral.target.spentLeft)} more to spend` : 'Requirement met'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0 rounded-xl border px-4 py-3">
              <p className="text-xs font-bold text-slate-500">Your referral code</p>
              <p className="font-extrabold tracking-wide">{s.referral.referralCode || '—'}</p>
            </div>
            {s.referral.referralCode && <CopyButton value={s.referral.referralCode} label="Copy code" />}
            <Link href="/dashboard/referrals" className="rounded-xl border px-4 py-3 text-sm font-bold text-center hover:bg-slate-50">
              Referral center →
            </Link>
          </div>
        </div>
      )}

      {/* Schedule — visible to everyone */}
      <div className="bg-white border rounded-2xl overflow-x-auto">
        <div className="p-5 sm:p-6 pb-3">
          <h2 className="font-extrabold text-lg">Weekly salary by VIP level</h2>
          <p className="text-xs text-slate-500 mt-1">Paid each Monday to members at these levels.</p>
        </div>
        {s.schedule.length === 0 ? (
          <p className="px-5 sm:px-6 pb-6 text-sm text-slate-500">No weekly salary is set up yet.</p>
        ) : (
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-y bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">VIP level</th>
                <th className="text-left px-5 py-3">Weekly salary</th>
                <th className="text-left px-5 py-3">Valid referrals needed</th>
              </tr>
            </thead>
            <tbody>
              {s.schedule.map((row) => {
                const mine = row.vipLevel === s.vipLevel;
                return (
                  <tr key={row.vipLevel} className={`border-b last:border-0 ${mine ? 'bg-harvest-50 font-bold' : ''}`}>
                    <td className="px-5 py-3">
                      {vipLabel(row.vipLevel)}
                      {mine && <span className="ml-2 text-[10px] tracking-wide text-harvest-700">YOU</span>}
                    </td>
                    <td className="px-5 py-3">{fmt(row.weeklySalary)}</td>
                    <td className="px-5 py-3">{row.qualifiedReferrals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {s.lastClaim && (
        <p className="text-xs text-slate-500">
          Last salary: {fmt(s.lastClaim.amount)} (week of {s.lastClaim.weekKey}).
        </p>
      )}
    </div>
  );
}
