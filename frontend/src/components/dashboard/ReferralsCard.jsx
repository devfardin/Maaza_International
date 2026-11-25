'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMeQuery } from '@/redux/features/apiSlice';
import { notify } from '@/lib/toast';
import SocialShareButtons from '@/components/shared/SocialShareButtons';

function ShareOnSocial({ referralLink }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-harvest-700/10">
            <svg className="h-5 w-5 text-harvest-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-extrabold text-slate-700">Share on Social Media</p>
            <p className="text-xs text-slate-400">Send your referral link to friends in one tap.</p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <SocialShareButtons
            link={referralLink}
            text="Join me on Maaza International with my referral link."
          />
        </div>
      )}
    </div>
  );
}

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
      .catch(() => { });
  }

  return (
    <div className="space-y-3">
      {/* YOUR REFERRAL LINK */}
      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-bold text-sm text-slate-600">Refer a Friend & Earn Commissions!</h3>
        <p className="text-slate-500 text-sm mt-1 mb-4">
          Share your referral link and earn 10% commission on every purchase made by your referrals.
        </p>
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
            {/* <div className="flex gap-2 mt-3">
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
            </div> */}
          </>
        )}
      </div>

      {/* SHARE ON SOCIAL MEDIA */}
      <ShareOnSocial referralLink={referralLink} />
    </div>
  );
}
