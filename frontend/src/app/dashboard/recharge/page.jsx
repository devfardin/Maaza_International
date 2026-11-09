'use client';
import RechargePage from "@/components/dashboard/pages/RechargePage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <RechargePage openProduct={openProduct} />;
}
