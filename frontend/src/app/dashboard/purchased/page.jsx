'use client';
import { useProductModal } from '@/hooks/useDashboardModals';
import PurchasedPage from '@/components/dashboard/pages/PurchasedPage';

export default function Page() {
  const openProduct = useProductModal();
  return <PurchasedPage openProduct={openProduct} />;
}
