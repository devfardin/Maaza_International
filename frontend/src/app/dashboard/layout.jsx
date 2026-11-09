'use client';
// src/app/dashboard/layout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard layout — wraps all /dashboard/* pages with sidebar, header,
// mobile nav, modal, and toast. Also loads the user profile on mount.
//
// STRUCTURE:
//   DashboardLayout (outer) — provides DashboardContext
//     └── DashboardInner (inner) — reads context, renders chrome
//           └── {children} — the actual page content
//
// WHY TWO COMPONENTS:
//   DashboardInner needs to call useDashboard() which requires being inside
//   the DashboardProvider. So the provider must wrap it from the outside.
//
// USER PROFILE LOADING:
//   useGetProfileQuery() runs automatically when this layout mounts.
//   It fetches GET /users/me and stores the result in Redux via setUser().
//   All dashboard pages can then read user data from Redux state.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect }                          from 'react';
import { usePathname, useRouter }             from 'next/navigation';
import { useDispatch, useSelector }           from 'react-redux';
import { DashboardProvider, useDashboard }    from '@/context/DashboardContext';
import { useGetProfileQuery }                 from '@/redux/features/apiSlice';
import { setUser, logout }                    from '@/redux/features/authSlice';
import Sidebar                                from '@/components/dashboard/Sidebar';
import Header                                 from '@/components/dashboard/Header';
import MobileNav                              from '@/components/dashboard/MobileNav';
import Modal                                  from '@/components/dashboard/Modal';
import Toast                                  from '@/components/dashboard/Toast';

// ── Inner layout — must be inside DashboardProvider to use useDashboard() ─────
function DashboardInner({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const dispatch = useDispatch();

  // Read shared UI state from DashboardContext
  const { toastMsg, showToast, modal, closeModal } = useDashboard();

  // Read auth state from Redux — used to check if user is logged in
  const { token, user } = useSelector((state) => state.auth);

  // RTK Query — fetch the logged-in user's profile from GET /users/me
  // skip: true means don't run the query if there's no token
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !token,
  });

//  from the API, save it to Redux state
  // This populates user.name, user.role, user.wallet, etc. across all pages
  useEffect(() => {
    if (profileData?.data) {
      dispatch(setUser(profileData.data));
    }
  }, [profileData, dispatch]);

  // Derive the active page segment from the URL path
  // e.g. /dashboard/products → 'products', /dashboard → 'overview'
  const segment = pathname.split('/')[2] || 'overview';

  // Navigate to a dashboard sub-page using the Next.js router
  function showPage(page) {
    const path = page === 'overview' ? '/dashboard' : `/dashboard/${page}`;
    router.push(path);
  }

  // Sign the user out — clears Redux state, localStorage, and the cookie.
  // NOTE: The backend has no /auth/logout endpoint currently, so we skip
  // the server call and only clean up locally. Add the server call back
  // once a logout endpoint is added to the backend.
  async function handleLogout() {
    dispatch(logout());
    // Remove the accessToken cookie used by Next.js middleware
    document.cookie = 'accessToken=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)] bg-[#f5f8f5]">

      {/* Sidebar — desktop only, receives user data for the bottom user card */}
      <Sidebar
        activePage={segment}
        showPage={showPage}
        showToast={showToast}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <main className="min-w-0">
        {/* Header — receives user data for the avatar/name display */}
        <Header
          showPage={showPage}
          showToast={showToast}
          user={user}
          onLogout={handleLogout}
        />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-9 py-5 sm:py-7 pb-28 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav activePage={segment} showPage={showPage} />

      {/* Shared modal — controlled via DashboardContext openModal/closeModal */}
      <Modal open={modal.open} tag={modal.tag} title={modal.title} onClose={closeModal}>
        {modal.body}
      </Modal>

      {/* Toast notification — auto-hides after 2.6s */}
      <Toast message={toastMsg} />
    </div>
  );
}

// ── Outer layout — provides context, then renders the inner layout ─────────────
export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardInner>{children}</DashboardInner>
    </DashboardProvider>
  );
}
