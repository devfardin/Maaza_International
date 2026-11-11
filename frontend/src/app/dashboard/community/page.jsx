'use client';
import CommunityPage from '@/components/dashboard/pages/CommunityPage';
import { useDashboard } from '@/context/DashboardContext';

export default function Page() {
  const { showToast } = useDashboard();
  return <CommunityPage showToast={showToast} />;
}
