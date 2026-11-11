'use client';
import WithdrawPage from '@/components/dashboard/pages/WithdrawPage';
import { useDashboard } from '@/context/DashboardContext';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { showToast } = useDashboard();
  const router = useRouter();
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }
  return <WithdrawPage showPage={showPage} showToast={showToast} />;
}
