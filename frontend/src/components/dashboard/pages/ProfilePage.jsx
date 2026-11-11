'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useChangePasswordMutation, useUpdateMyProfileMutation } from '@/redux/features/apiSlice';
import { setUser } from '@/redux/features/authSlice';
import { notify, getErrorMessage } from '@/lib/toast';
import { useI18n } from '@/lib/i18n';
import CopyButton from '@/components/shared/CopyButton';
import StatusBadge from '@/components/shared/StatusBadge';

const PHONE_RE = /^\+?[0-9]{11}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfilePage({ showPage }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  const [oldPw, setOldPw]   = useState('');
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConfPw] = useState('');

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  function startEdit() {
    setForm({ fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (fullName.length < 2) return notify.error('Full name must be at least 2 characters.');
    if (!EMAIL_RE.test(email)) return notify.error('Please enter a valid email address.');
    if (!PHONE_RE.test(phone)) return notify.error('Phone number must be 11 digits (you can start with +).');

    // Only send what actually changed
    const body = {};
    if (fullName !== user.fullName) body.fullName = fullName;
    if (email !== user.email) body.email = email;
    if (phone !== user.phone) body.phone = phone;

    if (Object.keys(body).length === 0) {
      setEditing(false);
      return notify.info('No changes to save.');
    }

    try {
      const res = await updateProfile(body).unwrap();
      if (res?.data) dispatch(setUser(res.data));
      setEditing(false);
      notify.success('Profile updated successfully.');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update your profile.'));
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confPw) return notify.error('New passwords do not match.');
    if (newPw.length < 8) return notify.error('Password must be at least 8 characters.');
    try {
      await changePassword({ oldPassword: oldPw, newPassword: newPw }).unwrap();
      notify.success('Password changed successfully.');
      setOldPw(''); setNewPw(''); setConfPw('');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not change your password.'));
    }
  }

  const inputCls = 'w-full border rounded-xl px-3.5 py-3 text-base sm:text-sm outline-none focus:border-harvest-500 disabled:bg-slate-50 disabled:text-slate-500';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('profile.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">Update your name, email and phone number.</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Left: summary card */}
        <div className="bg-white border rounded-2xl p-6 text-center h-fit">
          <div className="w-20 h-20 rounded-3xl bg-harvest-100 text-harvest-700 grid place-items-center text-2xl font-extrabold mx-auto">
            {initials}
          </div>
          <h2 className="font-extrabold text-lg mt-4 break-words">{user?.fullName || '—'}</h2>
          <p className="text-sm text-slate-500 mt-1 break-all">{user?.email || '—'}</p>
          <p className="text-sm text-slate-500">{user?.phone || '—'}</p>
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-extrabold mt-3">
            Level {user?.membershipLevel || 1}
          </span>
          <div className="mt-2"><StatusBadge status={user?.status === 'active' ? 'active' : 'cancelled'} /></div>
          <button onClick={() => showPage('bank')} className="block w-full text-left py-4 border-t mt-5 text-sm">
            ▤ &nbsp; Payout details →
          </button>
          <button onClick={() => showPage('referrals')} className="block w-full text-left py-2 text-sm">
            ♧ &nbsp; Referral center →
          </button>
        </div>

        <div className="space-y-5 min-w-0">
          {/* Account information */}
          <form onSubmit={handleSaveProfile} className="bg-white border rounded-2xl p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-lg">Account information</h2>
                <p className="text-xs text-slate-500 mt-1">Fields with a 🔒 are managed by the platform and cannot be edited.</p>
              </div>
              {!editing ? (
                <button type="button" onClick={startEdit} className="shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold hover:bg-slate-50">
                  ✎ {t('profile.edit')}
                </button>
              ) : null}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <Field label="Full name" htmlFor="pf-name">
                <input id="pf-name" className={inputCls} disabled={!editing} value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} maxLength={50} />
              </Field>
              <Field label="Email address" htmlFor="pf-email">
                <input id="pf-email" type="email" className={inputCls} disabled={!editing} value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone number" htmlFor="pf-phone">
                <input id="pf-phone" type="tel" inputMode="tel" className={inputCls} disabled={!editing} value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>

              {/* Locked fields */}
              <Field label="🔒 Referral code">
                <div className="flex items-center gap-2">
                  <div className="flex-1 border rounded-xl px-3.5 py-3 text-sm bg-slate-50 text-slate-700 font-semibold">{user?.referralCode || '—'}</div>
                  {user?.referralCode && <CopyButton value={user.referralCode} />}
                </div>
              </Field>
              <Field label="🔒 Membership level">
                <div className="border rounded-xl px-3.5 py-3 text-sm bg-slate-50 text-slate-700">Level {user?.membershipLevel || 1}</div>
              </Field>
              <Field label="🔒 Account status">
                <div className="border rounded-xl px-3.5 py-3 text-sm bg-slate-50 text-slate-700 capitalize">{user?.status || 'active'}</div>
              </Field>
            </div>

            {editing && (
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button type="button" onClick={cancelEdit} className="rounded-xl border py-3 text-sm font-bold">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-harvest-700 text-white py-3 text-sm font-bold disabled:opacity-60">
                  {saving ? 'Saving…' : t('common.save')}
                </button>
              </div>
            )}
          </form>

          {/* Change password */}
          <div className="bg-white border rounded-2xl p-5 sm:p-7">
            <h2 className="font-extrabold text-lg">Change password</h2>
            <form onSubmit={handleChangePassword} className="grid sm:grid-cols-2 gap-4 mt-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold mb-2" htmlFor="pw-old">Current password</label>
                <input id="pw-old" type="password" required value={oldPw} onChange={(e) => setOldPw(e.target.value)}
                  placeholder="Enter current password" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" htmlFor="pw-new">New password</label>
                <input id="pw-new" type="password" required minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" htmlFor="pw-confirm">Confirm new password</label>
                <input id="pw-confirm" type="password" required minLength={8} value={confPw} onChange={(e) => setConfPw(e.target.value)}
                  placeholder="Repeat new password" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={changingPw}
                  className="w-full sm:w-auto rounded-xl bg-harvest-700 text-white px-5 py-3 text-sm font-bold disabled:opacity-60">
                  {changingPw ? 'Saving…' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
