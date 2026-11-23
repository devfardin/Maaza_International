'use client';
import { useSelector } from 'react-redux';
import { useGetMeQuery } from '@/redux/features/apiSlice';
import { notify } from '@/lib/toast';
import SocialShareButtons from '@/components/shared/SocialShareButtons';

export default function ReferralsCard() {
  const user = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: meData, isLoading } = useGetMeQuery(undefined, { skip: !userId });
  const profile = meData?.data || user;

  const referralCode = profile?.referralCode || '';
  const referralLink =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/registration?refId=${referralCode}`
      : '';

  function copyLink() {
    if (!referralLink) return notify.error('Referral link not available.');
    navigator.clipboard?.writeText(referralLink)
      .then(() => notify.success('Referral link copied.'))
      .catch(() => notify.error('Could not copy. Please copy manually.'));
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard?.writeText(referralCode)
      .then(() => notify.success('Referral code copied.'))
      .catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* YOUR REFERRAL LINK */}
      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-3">YOUR REFERRAL LINK</p>
        {isLoading ? (
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink || 'Loading…'}
                className="flex-1 rounded-md border bg-slate-50 px-4 py-3 text-xs text-slate-700 outline-none"
              />
              <button
                onClick={copyLink}
                className="rounded-md bg-harvest-700 text-white px-4 text-xs font-bold whitespace-nowrap"
              >
                Copy link
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                readOnly
                value={referralCode || '—'}
                className="flex-1 rounded-md border bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
              />
              <button
                onClick={copyCode}
                className="border rounded-md px-4 text-xs font-bold"
              >
                Copy code
              </button>
            </div>
          </>
        )}
      </div>

      {/* SHARE ON SOCIAL MEDIA */}
      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-1">SHARE ON SOCIAL MEDIA</p>
        <p className="text-xs text-slate-400 mb-4">Send your referral link to friends in one tap.</p>
        <SocialShareButtons
          link={referralLink}
          text="Join me on Maaza International with my referral link."
        />
      </div>
    </div>
  );
}
