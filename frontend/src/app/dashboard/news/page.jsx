'use client';
import NewsPage from "@/components/dashboard/pages/NewsPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <NewsPage openProduct={openProduct} />;
}
