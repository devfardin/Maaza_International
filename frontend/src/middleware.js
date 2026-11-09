// src/middleware.js
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — runs on every request BEFORE the page renders.
// Used here to protect private routes from unauthenticated access.
//
// PROTECTED ROUTES:
//   /dashboard/*  — requires a logged-in user
//   /admin/*      — requires a logged-in user (role check done inside the page)
//
// HOW IT WORKS:
//   1. Reads the accessToken from the request cookies.
//   2. If the token is missing and the user is trying to access a protected
//      route, they are redirected to /login.
//   3. If the user is already logged in and visits /login or /registration,
//      they are redirected to /dashboard.
//
// NOTE:
//   This middleware reads cookies, NOT localStorage (localStorage is not
//   available in Edge middleware). So your login flow must also set the
//   accessToken as a cookie. See login/page.jsx for how this is done.
//
// TO ADD MORE PROTECTED ROUTES:
//   Add the path prefix to the `protectedRoutes` array below.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin'];

// Routes that logged-in users should not see (auth pages)
const authRoutes = ['/login', '/registration'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Read the access token from cookies
  // Your login handler must set this cookie: document.cookie = `accessToken=...`
  const token = request.cookies.get('accessToken')?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthPage  = authRoutes.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    // Pass the original URL so we can redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-authenticated users away from login/register pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Tell Next.js which paths this middleware should run on
// Excludes static files, images, and Next.js internals for performance
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
