'use client';

// Referrals page — shows referral stats, link copy and membership progress

export default function ReferralsPage({ showToast }) {
  function copyLink() {
            navigator.clipboard?.writeText('https://maazainternational.com/join/FA1024')
      .then(() => showToast('Referral link copied.'))
      .catch(() => showToast('Referral link selected.'));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Referral center</h1>
        <p className="text-sm text-slate-500 mt-1">Track invitations and membership progress.</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Invited members',     value: '12'      },
          { label: 'Qualified referrals', value: '5'       },
          { label: 'Referral bonus',      value: '৳120'   },
          { label: 'Membership',          value: 'Level 2' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border rounded-2xl p-4">
            <small className="text-xs text-slate-500">{label}</small>
            <b className="block text-2xl mt-2">{value}</b>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        {/* Referral link copy box */}
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-extrabold">Your referral link</h2>
          <p className="text-sm text-slate-500 mt-2">Share your personal invitation link with friends.</p>
          <div className="flex gap-2 mt-4">
            <input
              readOnly
              value="https://maazainternational.com/join/FA1024"
              className="min-w-0 flex-1 border rounded-xl px-3 py-3 text-xs bg-slate-50"
            />
            <button onClick={copyLink} className="rounded-xl bg-harvest-700 text-white px-4 text-xs font-bold">
              Copy link
            </button>
          </div>
        </div>

        {/* Membership progress bar */}
        <div className="bg-white border rounded-2xl p-5">
          <h2 className="font-extrabold">Membership progress</h2>
          <p className="text-sm text-slate-500 mt-2">Level 2 · Bronze</p>
          {/* 5 out of 10 = 50% width */}
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-5">
            <div className="h-full w-1/2 bg-harvest-500 rounded-full" />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>5 qualified members</span>
            <b>10 for next level</b>
          </div>
        </div>
      </div>
    </div>
  );
}
