'use client';
// src/app/(public)/registration/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Registration page — creates a new user account via the backend API.
//
// FLOW:
//   1. User fills in name, phone, email, referral code, password.
//   2. We call POST /auth/register via RTK Query useRegisterMutation.
//   3. On success: save tokens to Redux + cookie, redirect to /dashboard.
//   4. On failure: show the error message from the server.
//
// REFERRAL CODE:
//   If the URL has ?refId=XXXX (e.g. from a referral link), the code is
//   auto-filled and locked so the user cannot change it.
//
// TO CHANGE THE API ENDPOINT:
//   Update the register endpoint in src/redux/features/apiSlice.js.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegisterMutation } from '@/redux/features/apiSlice';

// ── Reusable form field wrapper ───────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
    {children}
  </div>
);

// Shared input class string — apply to all text inputs for consistency
const inputCls = "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15";

const MaazaLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M12 21V10M12 14C5 14 4 8 4 4c7 0 10 3 8 10ZM12 17c0-6 4-9 8-9 0 6-2 9-8 9Z"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Registration form ─────────────────────────────────────────────────────────

function RegistrationForm() {
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState('');

  const router       = useRouter();
  const searchParams = useSearchParams();

  // Read referral code from URL query param (e.g. /registration?refId=ABC123)
  const refId = searchParams.get('refId') ?? '';

  // RTK Query register mutation
  const [register, { isLoading }] = useRegisterMutation();

  // Eye toggle button for password fields
  const EyeBtn = ({ show, toggle }) => (
    <button type="button" onClick={toggle}
      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600">
      {show ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      )}
    </button>
  );

  // Handle form submission — validates passwords match then calls the API
  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.target);
    const name     = formData.get('name');
    const phone    = formData.get('phone');
    const email    = formData.get('email');
    const referralCode = formData.get('ref');
    const password = formData.get('newpw');
    const confirm  = formData.get('confirm');

    // Backend expects: { fullName, phone, email?, passwordHash, referredBy? }
    // Note: the password field is named 'passwordHash' in the backend schema
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Call POST /users/create-user
      const result = await register({
        fullName: name,          // backend uses fullName, not name
        phone,
        email,                   // required by the backend Mongoose schema
        passwordHash: password,  // backend field is passwordHash, not password
        ...(referralCode && { referredBy: referralCode }), // backend uses referredBy
      }).unwrap();

      // Registration does not return tokens — the backend createUser
      // endpoint only creates the account and returns the user object.
      // Redirect to login so the user can sign in with their new credentials.
      router.push('/login?registered=1');

    } catch (err) {
      setError(err?.data?.message || 'Registration failed. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5]">
      <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── Left decorative panel (desktop only) ── */}
        <section className="relative hidden overflow-hidden bg-[#0d3d26] lg:flex lg:flex-col lg:justify-between p-14 xl:p-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-48 -left-32 h-[38rem] w-[38rem] rounded-full bg-[#1a6b3c]/50 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[20rem] rounded-full bg-lime-400/5 blur-3xl" />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-[#0d3d26] shadow-lg shadow-lime-400/30">
              <MaazaLogo />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">Maaza International</span>
          </div>

          <div className="relative z-10 max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-lime-200">
              <span className="h-2 w-2 rounded-full bg-lime-400 shadow-sm shadow-lime-400/60" />
              Join thousands of members today
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.15] text-white xl:text-6xl">
              Start your<br />
              <span className="bg-gradient-to-r from-lime-300 to-emerald-300 bg-clip-text text-transparent">
                journey.
              </span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/60">
              Create your free account and get access to all Maaza International tools in one place.
            </p>
            <ul className="mt-8 space-y-3">
              {['Track your products and activity', 'Secure, private member account', 'Referral rewards & bonuses'].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime-400/20 text-lime-300">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-white/30">© 2026 Maaza International · Member portal</p>
        </section>

        {/* ── Right form panel ── */}
        <section className="flex min-h-screen flex-col bg-[#f5f8f5]">

          {/* Mobile top banner */}
          <div className="relative overflow-hidden bg-[#0d3d26] px-6 pb-10 pt-8 lg:hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-lime-400/10 blur-2xl" />
            <p className="relative z-10 mt-4 text-2xl font-extrabold text-white">Create account 🌱</p>
            <p className="relative z-10 mt-1 text-sm text-white/60">Join Maaza International and start your journey</p>
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:px-10 xl:px-16">
            <div className="w-full">

              {/* Desktop heading */}
              <div className="mb-8 hidden lg:block">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600">Member portal</p>
                <h2 className="text-3xl font-extrabold text-slate-900">Create account</h2>
                <p className="mt-2 text-sm text-slate-500">Join Maaza International and start managing your journey.</p>
              </div>

              {/* Tab switcher */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-300">
                <Link href="/login"
                  className="rounded-xl px-4 py-3.5 text-center text-sm font-semibold text-slate-600 transition hover:text-slate-700">
                  Sign In
                </Link>
                <span className="rounded-xl bg-[#0d3d26] px-4 py-3.5 text-center text-sm font-bold text-white shadow-md">
                  Create Account
                </span>
              </div>

              {/* Form card */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                <form onSubmit={handleRegister} className="space-y-4">

                  {/* Name + Phone — side by side on sm+ screens */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name">
                      <input name="name" required autoComplete="name" placeholder="Your full name" className={inputCls} />
                    </Field>
                    <Field label="Phone number">
                      <input name="phone" required autoComplete="tel" type="tel" placeholder="+880 1XXXXXXXXX" className={inputCls} />
                    </Field>
                  </div>

                  {/* Email — required by the backend Mongoose schema */}
                  <Field label="Email address">
                    <input name="email" required type="email" autoComplete="email" placeholder="you@example.com" className={inputCls} />
                  </Field>

                  {/* Referral code — auto-filled and locked if ?refId= is in URL */}
                  <Field label="Referral code" hint={refId ? 'auto-filled' : 'optional'}>
                    <div className="relative">
                      <input
                        name="ref"
                        readOnly={!!refId}
                        defaultValue={refId || ''}
                        placeholder="Enter referral code"
                        className={`${inputCls} pl-10 ${refId ? 'cursor-not-allowed bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : ''}`}
                      />
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm">🎁</span>
                    </div>
                  </Field>

                  {/* Password + Confirm — side by side on sm+ screens */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Create password">
                      <div className="relative">
                        <input name="newpw" required minLength="8" type={showPw ? 'text' : 'password'}
                          autoComplete="new-password" placeholder="Min. 8 characters"
                          className={`${inputCls} pr-11`} />
                        <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)} />
                      </div>
                    </Field>
                    <Field label="Confirm password">
                      <div className="relative">
                        <input name="confirm" required minLength="8" type={showConfirm ? 'text' : 'password'}
                          autoComplete="new-password" placeholder="Repeat password"
                          className={`${inputCls} pr-11`} />
                        <EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
                      </div>
                    </Field>
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
                    <input required type="checkbox" className="mt-0.5 h-4 w-4 rounded accent-emerald-600 shrink-0" />
                    <span className="text-sm leading-5 text-slate-500">
                      I agree to the{' '}
                      <Link href="/terms" className="font-semibold text-emerald-700 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="font-semibold text-emerald-700 hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>

                  {/* Error message from server or client validation */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Submit button — disabled and shows loading text while API call runs */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0d3d26] text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0a3020] active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating account…' : 'Create Account'}
                    {!isLoading && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-emerald-700 hover:underline">Sign in</Link>
                </p>
              </div>

              <p className="mt-5 text-center text-xs text-slate-400">
                🔒 Your data is encrypted and stays private
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function RegistrationPage() {
  return (
    <Suspense>
      <RegistrationForm />
    </Suspense>
  );
}
