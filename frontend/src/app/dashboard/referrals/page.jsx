'use client';
import ReferralsPage from "@/components/dashboard/pages/ReferralsPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <ReferralsPage openProduct={openProduct} />;
}
