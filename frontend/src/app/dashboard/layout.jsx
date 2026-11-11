'use client';
// src/app/dashboard/layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard layout — shell for all /dashboard/* pages.
// Fetches the logged-in user's profile on mount and stores it in Redux.
// Passes user data down to Sidebar and Header for display.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, Suspense }             from 'react';
import { usePathname, useRouter }          from 'next/navigation';
import { useDispatch, useSelector }        from 'react-redux';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { useGetMeQuery }                   from '@/redux/features/apiSlice';
import { clearAuthCookies } from '@/lib/authCookies';
import { setUser, logout }                 from '@/redux/features/authSlice';
import Sidebar                             from '@/components/dashboard/Sidebar';
import Header                              from '@/components/dashboard/Header';
import MobileNav                           from '@/components/dashboard/MobileNav';
import Modal                               from '@/components/dashboard/Modal';

// ── Inner layout — must be inside DashboardProvider ───────────────────────────
function DashboardInner({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();

  const { modal, closeModal } = useDashboard();

  // Read auth state — token needed to gate the profile query
  const { token, user } = useSelector((state) => state.auth);

  // GET /users/me — runs automatically when token exists
  // skip prevents the query from running before the user is logged in
  const { data: meData, isError: meError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // When profile data arrives, save it to Redux so all pages can read it
  useEffect(() => {
    if (meData?.data) {
      dispatch(setUser(meData.data));
    }
  }, [meData, dispatch]);

  // Admins / super admins have their own interface
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      router.replace('/admin');
    }
  }, [user, router]);

  // If the profile fetch returns 401, the token is invalid — force logout
  useEffect(() => {
    if (meError) {
      dispatch(logout());
      clearAuthCookies();
      router.push('/login');
    }
  }, [meError, dispatch, router]);

  // Derive active page from URL: /dashboard/products → 'products'
  const segment = pathname.split('/')[2] || 'overview';

  // Navigate to a dashboard sub-page
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  // Clear all auth state and redirect to login
  function handleLogout() {
    dispatch(logout());
    clearAuthCookies();
    router.push('/login');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)] bg-[#f5f8f5]">

      {/* Sidebar — desktop only */}
      <Sidebar
        activePage={segment}
        showPage={showPage}
        user={user}
        onLogout={handleLogout}
      />

      <main className="min-w-0">
        {/* Header — top bar with search, notifications, user avatar */}
        <Header
          showPage={showPage}
          user={user}
          onLogout={handleLogout}
        />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-9 py-5 sm:py-7 pb-28 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav activePage={segment} showPage={showPage} />

      {/* Shared modal — opened via DashboardContext.openModal() */}
      <Modal open={modal.open} tag={modal.tag} title={modal.title} onClose={closeModal}>
        {modal.body}
      </Modal>

    </div>
  );
}

// ── Outer layout — provides DashboardContext ──────────────────────────────────
export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <Suspense>
        <DashboardInner>{children}</DashboardInner>
      </Suspense>
    </DashboardProvider>
  );
}
