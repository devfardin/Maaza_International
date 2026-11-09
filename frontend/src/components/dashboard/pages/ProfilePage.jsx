'use client';

// Profile page — user can view and edit their personal information

export default function ProfilePage({ showPage, showToast }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">My profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage personal information and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: avatar card */}
        <div className="bg-white border rounded-2xl p-6 text-center">
          {/* Avatar initials */}
          <div className="w-20 h-20 rounded-3xl bg-harvest-100 text-harvest-700 grid place-items-center text-2xl font-extrabold mx-auto">FA</div>
          <h2 className="font-extrabold text-lg mt-4">Fardin Ahmed</h2>
          <p className="text-sm text-slate-500 mt-1">fardin@example.com</p>
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-extrabold mt-3">Level 2 · Bronze</span>
          {/* Quick link to payout details */}
          <button
            onClick={() => showPage('bank')}
            className="block w-full text-left py-4 border-t mt-5 text-sm"
          >
            ▤ &nbsp; Payout details →
          </button>
        </div>

        {/* Right: editable form */}
        <div className="bg-white border rounded-2xl p-5 sm:p-7">
          <h2 className="font-extrabold text-lg">Personal information</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm font-bold mb-2">Full name</label>
              {/* defaultValue keeps the field editable without React state */}
              <input defaultValue="Fardin Ahmed" className="w-full border rounded-xl px-3.5 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Email address</label>
              <input defaultValue="fardin@example.com" className="w-full border rounded-xl px-3.5 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Phone number</label>
              <input defaultValue="+880 1XXXXXXXXX" className="w-full border rounded-xl px-3.5 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Country</label>
              <select className="w-full border rounded-xl px-3.5 py-3 text-sm">
                <option>Bangladesh</option>
              </select>
            </div>
          </div>
          {/* Save button — connect to backend API when ready */}
          <button
            onClick={() => showToast('Profile changes will save when the backend is connected.')}
            className="mt-5 rounded-xl bg-harvest-700 text-white px-5 py-3 text-sm font-bold"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
