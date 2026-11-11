'use client';
import BankPage from '@/components/dashboard/pages/BankPage';
import { useDashboard } from '@/context/DashboardContext';

export default function Page() {
  const { showToast } = useDashboard();
  return <BankPage showToast={showToast} />;
}
