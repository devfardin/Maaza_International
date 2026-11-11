'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader  from '@/components/admin/AdminHeader';
import { useGetProfileQuery } from '@/redux/features/apiSlice';
import { clearAuthCookies } from '@/lib/authCookies';
import { setUser, logout } from '@/redux/features/authSlice';
import PageLoader from '@/components/shared/PageLoader';

function AdminInner({ children }) {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { token, user } = useSelector((s) => s.auth);

  const { data: profileData, isError } = useGetProfileQuery(undefined, { skip: !token });

  useEffect(() => {
    if (profileData?.data) dispatch(setUser(profileData.data));
  }, [profileData, dispatch]);

  // No token → go to login
  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Regular user → go to dashboard
  useEffect(() => {
    if (user && user.role === 'user') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Token invalid → logout
  useEffect(() => {
    if (isError) {
      dispatch(logout());
      clearAuthCookies();
      router.replace('/login');
    }
  }, [isError, dispatch, router]);

  function handleLogout() {
    dispatch(logout());
    clearAuthCookies();
    router.replace('/login');
  }

  // Wait for the profile (role comes from the server) before showing anything
  if (!token || !user || user.role === 'user') {
    return <PageLoader label="Preparing your admin panel…" className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <AdminSidebar
        userName={user?.fullName || 'Admin'}
        userRole={user?.role || 'admin'}
      />
      <main className="min-w-0">
        <AdminHeader
          userRole={user?.role || 'admin'}
          userName={user?.fullName || 'Admin'}
          onLogout={handleLogout}
        />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-9 py-5 sm:py-7 pb-28 lg:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <Suspense>
      <AdminInner>{children}</AdminInner>
    </Suspense>
  );
}
