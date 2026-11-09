'use client';
import CommunityPage from "@/components/dashboard/pages/CommunityPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <CommunityPage openProduct={openProduct} />;
}
