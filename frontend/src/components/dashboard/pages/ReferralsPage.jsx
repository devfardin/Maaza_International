'use client';
import { useSelector } from 'react-redux';
import { useGetMeQuery, useGetMyReferralsQuery, useGetMyTeamQuery } from '@/redux/features/apiSlice';
import { vipLabel, vipLevelOf } from '@/lib/vip';
import SocialShareButtons from '@/components/shared/SocialShareButtons';

// Levels are seen from my position:
//  A = my direct invitees (they signed up with my code; I earn commission from their claims)
//  B = invitees of my direct invitees (I earn commission from their claims too)
const RELATION_STYLE = {
  A: 'bg-harvest-100 text-harvest-800',
  B: 'bg-violet-100 text-violet-700',
};

// 01XXXXXXXXX → 8801XXXXXXXXX (digits only, country code included) for wa.me links
const whatsappNumber = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return `88${digits}`;
  return digits;
};

const bdt = (amount) => `৳${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function ReferralsPage({ showToast }) {
  const user   = useSelector((s) => s.auth.user);
  const userId = user?._id;

  const { data: meData, isLoading } = useGetMeQuery(undefined, { skip: !userId });
  const { data: referralData, isLoading: referralLoading } = useGetMyReferralsQuery(undefined, { skip: !userId });
  const { data: teamData, isLoading: teamLoading } = useGetMyTeamQuery(undefined, { skip: !userId });
  const team = teamData?.data ?? [];

  const profile = meData?.data || user;

  const referralCode    = profile?.referralCode || '';
  const membershipLevel = profile?.membershipLevel ?? 1;
  const stats           = referralData?.data || { total: 0, valid: 0, invalid: 0, totalCommission: 0, referrals: [] };
  const membership      = stats.membership;

  const referralLink = referralCode && typeof window !== 'undefined'
    ? `${window.location.origin}/registration?refId=${referralCode}`
    : '';

  function copyLink() {
    if (!referralLink) return showToast('Referral link not available.', 'error');
    navigator.clipboard?.writeText(referralLink)
      .then(() => showToast('Referral link copied.'))
      .catch(() => showToast('Could not copy. Please copy manually.', 'error'));
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
              <button onClick={copyLink} className="rounded-md bg-harvest-700 text-white px-4 text-xs font-bold whitespace-nowrap">
                Copy link
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <input
                readOnly
                value={referralCode || '—'}
                className="flex-1 rounded-md border bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
              />
              <button onClick={copyCode} className="border rounded-md px-4 text-xs font-bold">
                Copy code
              </button>
            </div>
          </>
        )}
      </div>

      {/* Share on social media */}
      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-1">SHARE ON SOCIAL MEDIA</p>
        <p className="text-xs text-slate-400 mb-4">Send your referral link to friends in one tap.</p>
        <SocialShareButtons
          link={referralLink}
          text="Join me on Maaza International with my referral link."
        />
      </div>

      {/* Referral stats */}
      <div className="bg-white border rounded-xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-4">REFERRAL STATS</p>
        {referralLoading ? (
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="rounded-md bg-slate-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1">Registered</p>
            </div>
            <div className="rounded-md bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">{stats.valid}</p>
              <p className="text-xs text-emerald-600 mt-1">Valid</p>
            </div>
            <div className="rounded-md bg-amber-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-600">{stats.invalid}</p>
              <p className="text-xs text-amber-600 mt-1">Invalid</p>
            </div>
            <div className="rounded-md bg-violet-50 p-4 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-violet-700">{bdt(stats.totalCommission)}</p>
              <p className="text-xs text-violet-600 mt-1">Commission earned</p>
            </div>
          </div>
        )}

        {/* Signups by level: A = direct (my code), B = two levels down */}
        {!referralLoading && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl border border-harvest-100 bg-harvest-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-harvest-800">{stats.levelA ?? 0}</p>
              <p className="text-xs text-harvest-700 mt-1">Level A signups · direct</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-violet-700">{stats.levelB ?? 0}</p>
              <p className="text-xs text-violet-700 mt-1">Level B signups · 2nd level</p>
            </div>
          </div>
        )}

        {/* Team — members, relation (A/B/C), products and earnings */}
        {!teamLoading && team.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-slate-400">MY TEAM · {team.length} MEMBER{team.length === 1 ? '' : 'S'}</p>
            {team.map((m) => (
              <div key={m._id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {m.avatar ? (
                      <img src={m.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-harvest-100 text-xs font-bold text-harvest-700">
                        {m.fullName?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{m.fullName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{m.phone || ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${RELATION_STYLE[m.relation] || 'bg-slate-100 text-slate-600'}`}>
                      {m.relation === 'A' ? 'Level A · Direct' : m.relation === 'B' ? 'Level B · 2nd level' : `Level ${m.relation}`}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${m.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${whatsappNumber(m.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#25D366] py-2.5 text-center text-xs font-extrabold text-white hover:opacity-90"
                  >
                    WhatsApp
                  </a>
                  <a href={`tel:${m.phone}`} className="rounded-xl border py-2.5 text-center text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                    Call
                  </a>
                </div>

                {/* Products bought + what I earned from them */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-slate-500">PRODUCTS BOUGHT</p>
                    <p className="text-xs font-bold text-violet-700">You earned {bdt(m.earnedFromMe)}</p>
                  </div>
                  {m.products.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">No product bought yet.</p>
                  ) : (
                    <ul className="mt-2 divide-y">
                      {m.products.map((pr) => (
                        <li key={pr._id} className="flex items-center justify-between gap-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-700">{pr.productName}</p>
                            <p className="text-[10px] text-slate-400">
                              {bdt(pr.purchasePrice)} · {new Date(pr.purchasedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-xs font-extrabold text-violet-700">{bdt(pr.earnedFromMe)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!teamLoading && team.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">No referrals yet. Share your link to get started!</p>
        )}
      </div>

      {/* Membership level */}
      <div className="bg-white border rounded-2xl p-5">
        <p className="text-xs font-extrabold text-slate-500 mb-3">MEMBERSHIP LEVEL</p>
        <p className="text-2xl font-extrabold">{vipLabel(vipLevelOf(membershipLevel))}</p>
        {membership?.required ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-500">Requirements to reach <b>{vipLabel(vipLevelOf(membership.nextLevel))}</b>:</p>
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
            'When your direct invitee (Level A) makes their first purchase, you receive that product\'s invitation bonus, one time.',
            'Team commission is paid on every profit claim. You earn the Level A rate from your direct invitees\' claims, and the Level B rate from their invitees\' claims, as set on each product.',
            'Commission is added to your withdrawable balance.',
            'Everyone starts at VIP 1. Move up a VIP level with qualified referrals (members who deposited and bought a product) and minimum spending. Higher VIP levels unlock a larger daily check-in bonus.',
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
