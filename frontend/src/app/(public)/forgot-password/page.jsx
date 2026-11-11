'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForgetPasswordMutation } from '@/redux/features/apiSlice';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [forget, { isLoading }] = useForgetPasswordMutation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await forget({ phone: phone.trim() }).unwrap();
      setDone(true);
    } catch (err) {
      setError(err?.data?.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] grid place-items-center p-4">
      <div className="w-full max-w-md bg-white border rounded-3xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold">Forgot password</h1>
        {done ? (
          <>
            <p className="text-sm text-slate-600 mt-3">
              If an account exists for <b>{phone}</b>, we have emailed a reset link to the address on file. The link expires in 10 minutes.
            </p>
            <Link href="/login" className="mt-6 block text-center bg-harvest-700 text-white rounded-xl py-3 text-sm font-bold">Back to login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">Enter your phone number and we&apos;ll email you a reset link.</p>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" placeholder="Phone number"
              className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-harvest-500" />
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3">{error}</p>}
            <button disabled={isLoading} className="w-full bg-harvest-700 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="block text-center text-xs font-bold text-slate-500">Back to login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
