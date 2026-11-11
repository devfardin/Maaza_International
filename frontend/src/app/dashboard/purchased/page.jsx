'use client';
import { useDashboard } from '@/context/DashboardContext';
import PurchasedPage from '@/components/dashboard/pages/PurchasedPage';

export default function Page() {
  const { showToast } = useDashboard();
  return <PurchasedPage showToast={showToast} />;
}
