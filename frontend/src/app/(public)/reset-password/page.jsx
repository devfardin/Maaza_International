'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPasswordMutation } from '@/redux/features/apiSlice';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [reset, { isLoading }] = useResetPasswordMutation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    try {
      await reset({ token, phone: phone.trim(), newPassword: password }).unwrap();
      router.replace('/login?reset=1');
    } catch (err) {
      setError(err?.data?.message || 'This reset link is invalid or has expired.');
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-slate-600 mt-3">
        This reset link is missing its token. <Link href="/forgot-password" className="font-bold text-harvest-700">Request a new one</Link>.
      </p>
    );
  }

  const input = 'w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-harvest-500';
  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="Your phone number" className={input} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="New password (min 8 characters)" className={input} />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} placeholder="Confirm new password" className={input} />
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{error}</p>}
      <button disabled={isLoading} className="w-full bg-harvest-700 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
        {isLoading ? 'Saving…' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f5f8f5] grid place-items-center p-4">
      <div className="w-full max-w-md bg-white border rounded-3xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold">Reset password</h1>
        <Suspense><ResetForm /></Suspense>
      </div>
    </div>
  );
}
