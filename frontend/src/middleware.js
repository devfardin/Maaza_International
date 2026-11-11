// src/middleware.js
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — decides which interface a visitor may see.
//
//   /dashboard/*  → role "user"                (members)
//   /admin/*      → role "admin" | "super_admin"
//   /login, /registration, /forgot-password → only for logged-out visitors
//
// It reads the `accessToken` and `role` cookies set at login (see lib/authCookies.js).
// The cookies only steer navigation; every API call is re-authorised by the backend.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

const authRoutes = ['/login', '/registration', '/forgot-password'];

const homeFor = (role) => (role === 'admin' || role === 'super_admin' ? '/admin' : '/dashboard');

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;
  const role  = request.cookies.get('role')?.value;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const inDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  const inAdmin     = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthPage  = authRoutes.some((r) => pathname.startsWith(r));

  // 1. Logged out → login
  if ((inDashboard || inAdmin) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Wrong interface for the role → send to the right one
  if (token && inAdmin && !isAdmin)   return NextResponse.redirect(new URL('/dashboard', request.url));
  if (token && inDashboard && isAdmin) return NextResponse.redirect(new URL('/admin', request.url));

  // 3. Already logged in → skip the auth pages
  if (token && isAuthPage) return NextResponse.redirect(new URL(homeFor(role), request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|public/).*)'],
};
