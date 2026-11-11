'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useChangePasswordMutation } from '@/redux/features/apiSlice';

export default function ProfilePage({ showPage, showToast }) {
  const user = useSelector((s) => s.auth.user);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confPw) return showToast('New passwords do not match.');
    if (newPw.length < 8)  return showToast('Password must be at least 8 characters.');
    try {
      await changePassword({ oldPassword: oldPw, newPassword: newPw }).unwrap();
      showToast('Password changed successfully.');
      setOldPw(''); setNewPw(''); setConfPw('');
    } catch (err) {
      showToast(err?.data?.message || 'Failed to change password.');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">My profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage personal information and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: avatar card */}
        <div className="bg-white border rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-harvest-100 text-harvest-700 grid place-items-center text-2xl font-extrabold mx-auto">
            {initials}
          </div>
          <h2 className="font-extrabold text-lg mt-4">{user?.fullName || '—'}</h2>
          <p className="text-sm text-slate-500 mt-1">{user?.email || '—'}</p>
          <p className="text-sm text-slate-500">{user?.phone || '—'}</p>
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-extrabold mt-3">
            Level {user?.membershipLevel || 1} · {user?.role || 'Member'}
          </span>
          <span className={`block mt-2 rounded-full px-3 py-1.5 text-xs font-bold ${
            user?.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {user?.status || 'active'}
          </span>
          <button onClick={() => showPage('bank')} className="block w-full text-left py-4 border-t mt-5 text-sm">
            ▤ &nbsp; Payout details →
          </button>
          <button onClick={() => showPage('referrals')} className="block w-full text-left py-2 text-sm">
            ♧ &nbsp; Referral center →
          </button>
        </div>

        {/* Right: account info + change password */}
        <div className="space-y-5">
          {/* Read-only account info */}
          <div className="bg-white border rounded-2xl p-5 sm:p-7">
            <h2 className="font-extrabold text-lg">Account information</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              {[
                { label: 'Full name',       value: user?.fullName },
                { label: 'Email address',   value: user?.email },
                { label: 'Phone number',    value: user?.phone },
                { label: 'Referral code',   value: user?.referralCode },
                { label: 'Membership level', value: `Level ${user?.membershipLevel || 1}` },
                { label: 'Account status',  value: user?.status },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                  <div className="w-full border rounded-xl px-3.5 py-3 text-sm bg-slate-50 text-slate-700">
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Change password form */}
          <div className="bg-white border rounded-2xl p-5 sm:p-7">
            <h2 className="font-extrabold text-lg">Change password</h2>
            <form onSubmit={handleChangePassword} className="grid sm:grid-cols-2 gap-4 mt-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold mb-2">Current password</label>
                <input
                  type="password" required value={oldPw} onChange={(e) => setOldPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full border rounded-xl px-3.5 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">New password</label>
                <input
                  type="password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full border rounded-xl px-3.5 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Confirm new password</label>
                <input
                  type="password" required minLength={8} value={confPw} onChange={(e) => setConfPw(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full border rounded-xl px-3.5 py-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit" disabled={isLoading}
                  className="rounded-xl bg-harvest-700 text-white px-5 py-3 text-sm font-bold disabled:opacity-60"
                >
                  {isLoading ? 'Saving…' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
