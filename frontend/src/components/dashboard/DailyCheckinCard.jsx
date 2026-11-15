'use client';
// Daily check-in: once per day a member can claim the bonus for their VIP level.
// The bonus goes to the withdrawable balance wallet.
import { useGetDailyCheckinStatusQuery, useDailyCheckinMutation } from '@/redux/features/apiSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { vipLabel } from '@/lib/vip';

const fmt = (amount) => `৳ ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function DailyCheckinCard() {
  const { data, isLoading } = useGetDailyCheckinStatusQuery();
  const [checkin, { isLoading: saving }] = useDailyCheckinMutation();
  const status = data?.data;

  async function handleCheckin() {
    try {
      const res = await checkin().unwrap();
      notify.success(`Checked in! ${fmt(res?.data?.amount)} added to your balance.`);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not check in right now.'));
    }
  }

  if (isLoading) return <div className="h-28 rounded-2xl bg-white border animate-pulse" />;

  const vipLevel = status?.vipLevel ?? 0;
  const done = !!status?.checkedInToday;

  return (
    <div className="rounded-2xl bg-white border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold tracking-widest text-harvest-700">DAILY CHECK-IN</p>
        <p className="font-extrabold mt-1">{vipLabel(vipLevel)} · today&apos;s bonus {fmt(status?.bonusAmount)}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {done ? 'You have checked in today. Come back tomorrow!' : 'Check in once a day to receive your bonus.'}
        </p>
      </div>
      <button
        onClick={handleCheckin}
        disabled={done || saving || !status}
        className="sm:w-40 rounded-xl bg-harvest-700 text-white py-3 text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Checking in…' : done ? '✓ Checked in' : 'Check in'}
      </button>
    </div>
  );
}
