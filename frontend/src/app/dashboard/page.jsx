'use client';
import { useRouter } from 'next/navigation';
import { useTaskModal } from '@/hooks/useDashboardModals';
import OverviewPage from '@/components/dashboard/pages/OverviewPage';

export default function Page() {
  const router   = useRouter();
  const openTask = useTaskModal();

  // showPage converts page name → URL and navigates
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  return <OverviewPage showPage={showPage} openTask={openTask} />;
}
