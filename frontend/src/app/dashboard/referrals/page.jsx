'use client';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import ReferralsPage from '@/components/dashboard/pages/ReferralsPage';

export default function Page() {
  const router = useRouter();
  const { showToast } = useDashboard();

  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  return <ReferralsPage showPage={showPage} showToast={showToast} />;
}
