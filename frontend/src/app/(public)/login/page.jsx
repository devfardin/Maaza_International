'use client';
// src/app/(public)/login/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Login page — authenticates the user against the backend API.
//
// FLOW:
//   1. User submits email + password.
//   2. We call POST /auth/login via RTK Query useLoginMutation.
//   3. On success: save tokens to Redux + cookie, redirect to /dashboard.
//   4. On failure: show the error message from the server.
//
// TO CHANGE THE REDIRECT AFTER LOGIN:
//   Change the router.push('/dashboard') call in handleLogin.
//
// TO CHANGE THE API ENDPOINT:
//   Update the login endpoint in src/redux/features/apiSlice.js.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/redux/features/apiSlice';
import { setCredentials, logout } from '@/redux/features/authSlice';
import { Suspense } from 'react';
import { setAuthCookies, isAdminRole, safeRedirect } from '@/lib/authCookies';
import { notify, getErrorMessage } from '@/lib/toast';

// ── Small reusable SVG components ─────────────────────────────────────────────

const MaazaLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M12 21V10M12 14C5 14 4 8 4 4c7 0 10 3 8 10ZM12 17c0-6 4-9 8-9 0 6-2 9-8 9Z"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── Main login form (wrapped in Suspense for useSearchParams) ─────────────────

function LoginForm() {
  const [showPw, setShowPw]   = useState(false);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const dispatch     = useDispatch();

  // RTK Query login mutation — provides { isLoading } for button state
  const [login, { isLoading }] = useLoginMutation();

  // Handle form submission — calls the backend login endpoint
  async function handleLogin(e) {
    e.preventDefault();
    

    const form     = e.target;
    // Backend expects { phone, password } — the input field is labelled
    // 'Email or phone' but the value is sent as 'phone' to match the server
    const phone    = form.email.value.trim();
    const password = form.password.value;

    try {
      // Clear any stale user from a previous session before setting new credentials
      dispatch(logout());

      // Call POST /auth/login — backend expects { phone, password }
      // Response shape: { success, message, data: { accessToken, refreshToken } }
      const result = await login({ phone, password }).unwrap();

      dispatch(setCredentials({
        user:         null,
        accessToken:  result.data?.accessToken,
        refreshToken: result.data?.refreshToken,
      }));

      // Cookies let middleware.js route each role to its own interface
      // (users → /dashboard, admin & super_admin → /admin).
      const role = result.data?.role;
      setAuthCookies(result.data?.accessToken, role);

      const defaultRedirect = isAdminRole(role) ? '/admin' : '/dashboard';
      const requested = safeRedirect(searchParams.get('redirect'), defaultRedirect);
      // never send a member into /admin (or an admin into /dashboard) via ?redirect=
      const redirect = isAdminRole(role) === requested.startsWith('/admin') || requested === '/' ? requested : defaultRedirect;
      router.replace(redirect);

    } catch (err) {
      // Show the error message returned by the server, or a generic fallback
      notify.error(getErrorMessage(err, 'Invalid phone number or password. Please try again.'));
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

          {/* Hero text */}
          <div className="relative z-10 max-w-lg">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-lime-200">
              <span className="h-2 w-2 rounded-full bg-lime-400 shadow-sm shadow-lime-400/60" />
              A better way to manage your journey
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.15] text-white xl:text-6xl">
              Grow with<br />
              <span className="bg-gradient-to-r from-lime-300 to-emerald-300 bg-clip-text text-transparent">
                confidence.
              </span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/60">
              Your products, activity, and account tools — thoughtfully brought together in one simple place.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[['3K+', 'Members'], ['99%', 'Uptime'], ['24/7', 'Support']].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm">
                  <p className="text-xl font-extrabold text-lime-300">{n}</p>
                  <p className="mt-0.5 text-xs text-white/50">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/30">© 2026 Maaza International · Member portal</p>
        </section>

        {/* ── Right form panel ── */}
        <section className="flex min-h-screen flex-col bg-[#f5f8f5]">

          {/* Mobile top banner */}
          <div className="relative overflow-hidden bg-[#0d3d26] px-6 pb-10 pt-8 lg:hidden">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-lime-400/10 blur-2xl" />
            <p className="relative z-10 mt-4 text-2xl font-extrabold text-white">Welcome back 👋</p>
            <p className="relative z-10 mt-1 text-sm text-white/60">Sign in to your Maaza International account</p>
          </div>

          {/* Form area */}
          <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:px-10 xl:px-16">
            <div className="w-full">

              {/* Desktop heading */}
              <div className="mb-8 hidden lg:block">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-600">Member portal</p>
                <h2 className="text-3xl font-extrabold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">Sign in to continue to your Maaza International dashboard.</p>
              </div>

              {/* Tab switcher — Sign In / Create Account */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-300">
                <span className="rounded-xl bg-[#0d3d26] px-4 py-3.5 text-center text-sm font-bold text-white shadow-md">
                  Sign In
                </span>
                <Link href="/registration"
                  className="rounded-xl px-4 py-3.5 text-center text-sm font-semibold text-slate-600 transition hover:text-slate-700">
                  Create Account
                </Link>
              </div>

              {/* Form card */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                <form onSubmit={handleLogin} className="space-y-5">

                  {/* Phone number field — backend login requires phone, not email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Phone number
                    </label>
                    <input
                      name="email"
                      required
                      autoComplete="tel"
                      placeholder="e.g. 01XXXXXXXXX"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                    />
                  </div>

                  {/* Password field with show/hide toggle */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Password</label>
                      <Link href="/forgot-password" className="text-xs font-semibold text-emerald-700 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        name="password"
                        required
                        autoComplete="current-password"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                      />
                      {/* Toggle password visibility */}
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600"
                      >
                        <EyeIcon open={showPw} />
                      </button>
                    </div>
                  </div>

                  {/* Error message from server */}

                  {/* Submit button — shows loading state while API call is in progress */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0d3d26] text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0a3020] active:scale-[.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                    {!isLoading && (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500">
                  New to Maaza International?{' '}
                  <Link href="/registration" className="font-bold text-emerald-700 hover:underline">
                    Create a free account
                  </Link>
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
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
