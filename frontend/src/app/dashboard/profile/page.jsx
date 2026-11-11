'use client';
import ProfilePage from '@/components/dashboard/pages/ProfilePage';
import { useDashboard } from '@/context/DashboardContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { showToast } = useDashboard();
  const router = useRouter();
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }
  return <ProfilePage showPage={showPage} showToast={showToast} />;
}
