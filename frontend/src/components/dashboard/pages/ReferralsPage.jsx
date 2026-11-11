'use client';
import { useSelector } from 'react-redux';
import { useGetMeQuery, useGetMyReferralsQuery } from '@/redux/features/apiSlice';

export default function ReferralsPage({ showToast }) {
  const user   = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: meData, isLoading } = useGetMeQuery(undefined, { skip: !userId });
  const { data: referralData, isLoading: referralLoading } = useGetMyReferralsQuery(undefined, { skip: !userId });

  const profile = meData?.data || user;

  const referralCode    = profile?.referralCode || '';
  const membershipLevel = profile?.membershipLevel ?? 1;
  const stats           = referralData?.data || { total: 0, valid: 0, invalid: 0, totalCommission: 0, referrals: [] };
  const membership      = stats.membership;
  const bdt             = (p) => `৳${((p || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const referralLink = referralCode && typeof window !== 'undefined'
    ? `${window.location.origin}/registration?refId=${referralCode}`
    : '';

  function copyLink() {
    if (!referralLink) return showToast('Referral link not available.');
    navigator.clipboard?.writeText(referralLink)
      .then(() => showToast('Referral link copied.'))
      .catch(() => showToast('Could not copy. Please copy manually.'));
  }

  function copyCode() {
    if (!referralCode) return;
    navigator.clipboard?.writeText(referralCode)
      .then(() => showToast('Referral code copied.'))
      .catch(() => {});
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs tracking-widest font-extrabold text-harvest-700">REFERRAL CENTER</p>
        <h1 className="text-xl font-extrabold mt-1">Invite &amp; Earn</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share your referral link. Earn bonuses when your referred members purchase products.
        </p>
      </div>

      {/* Referral link card */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-3">YOUR REFERRAL LINK</p>
        {isLoading ? (
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink || 'Loading…'}
                className="flex-1 rounded-xl border bg-slate-50 px-4 py-3 text-xs text-slate-700 outline-none"
              />
              <button onClick={copyLink} className="rounded-xl bg-harvest-700 text-white px-4 text-xs font-bold whitespace-nowrap">
                Copy link
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                readOnly
                value={referralCode || '—'}
                className="flex-1 rounded-xl border bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
              />
              <button onClick={copyCode} className="border rounded-xl px-4 text-xs font-bold">
                Copy code
              </button>
            </div>
          </>
        )}
      </div>

      {/* Referral stats */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-4">REFERRAL STATS</p>
        {referralLoading ? (
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">Registered</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">{stats.valid}</p>
              <p className="text-xs text-emerald-600 mt-1">Valid</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{stats.invalid}</p>
              <p className="text-xs text-amber-600 mt-1">Invalid</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-violet-700">{bdt(stats.totalCommission)}</p>
              <p className="text-xs text-violet-600 mt-1">Team earnings</p>
            </div>
          </div>
        )}

        {/* Referred users list */}
        {!referralLoading && stats.referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-slate-400 mb-2">REFERRED MEMBERS</p>
            {stats.referrals.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-harvest-100 text-harvest-700 grid place-items-center font-bold text-xs shrink-0">
                    {r.referredId?.fullName?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.referredId?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{r.referredId?.phone || ''}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  r.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            ))}
          </div>
        )}

        {!referralLoading && stats.referrals.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No referrals yet. Share your link to get started!</p>
        )}
      </div>

      {/* Membership level */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-3">MEMBERSHIP LEVEL</p>
        <p className="text-2xl font-extrabold">Level {membershipLevel}</p>
        {membership?.required ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-500">Requirements to reach <b>Level {membership.nextLevel}</b>:</p>
            {[
              { label: 'Valid referrals', now: membership.validReferrals, need: membership.required.validReferrals, fmt: (n) => n },
              { label: 'Your total purchases', now: membership.totalSpent, need: membership.required.totalSpent, fmt: bdt },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700">{m.label}</span>
                  <span className="text-slate-500">{m.fmt(Math.min(m.now, m.need))} / {m.fmt(m.need)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-harvest-500 rounded-full transition-all" style={{ width: `${Math.min(100, (m.now / m.need) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2">You have reached the highest membership level available.</p>
        )}
      </div>

      {/* Who referred you */}
      {profile?.referredBy && (
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-xs font-extrabold text-slate-500 mb-3">REFERRED BY</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-harvest-100 text-harvest-700 grid place-items-center font-bold text-sm">
              {profile.referredBy?.fullName?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <p className="text-sm font-bold">{profile.referredBy?.fullName || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{profile.referredBy?.phone || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-3">HOW REFERRAL REWARDS WORK</p>
        <div className="space-y-3 text-sm text-slate-600">
          {[
            'Share your link or code. Everyone who registers with it is counted as an invalid member until they deposit AND buy a product.',
            'Once they buy a product they become a valid member, and you (their inviter) receive that product\'s invitation bonus.',
            'Their inviter\'s inviter (Level B) earns 10% and the next one up (Level C) earns 5% of the daily income, every time that member claims — spread across the product\'s validity period.',
            'Upgrade from Level 1 to Level 2 with 5 valid referrals and ৳15,000 of your own purchases.',
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-harvest-700 font-bold mt-0.5 shrink-0">{i + 1}.</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Welcome bonus info */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <p className="text-xs font-extrabold text-amber-700 mb-2">WELCOME BONUS</p>
        <p className="text-sm text-slate-700">
          New members receive a one-time <b>৳120 welcome bonus</b> in their recharge wallet when their first deposit is approved.
        </p>
      </div>
    </div>
  );
}
