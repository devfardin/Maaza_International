'use client';
import WithdrawPage from "@/components/dashboard/pages/WithdrawPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <WithdrawPage openProduct={openProduct} />;
}
