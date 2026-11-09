'use client';
import { useProductModal } from '@/hooks/useDashboardModals';
import ProductsPage from '@/components/dashboard/pages/ProductsPage';

export default function Page() {
  const openProduct = useProductModal();
  return <ProductsPage openProduct={openProduct} />;
}
