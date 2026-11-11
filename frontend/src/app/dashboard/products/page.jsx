'use client';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import ProductsPage from '@/components/dashboard/pages/ProductsPage';

export default function Page() {
  const router = useRouter();
  const { showToast } = useDashboard();

  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  return <ProductsPage showPage={showPage} showToast={showToast} />;
}
