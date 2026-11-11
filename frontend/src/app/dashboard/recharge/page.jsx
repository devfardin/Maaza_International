'use client';
import RechargePage from '@/components/dashboard/pages/RechargePage';
import { useDashboard } from '@/context/DashboardContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { showToast } = useDashboard();
  const router = useRouter();
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }
  return <RechargePage showPage={showPage} showToast={showToast} />;
}
