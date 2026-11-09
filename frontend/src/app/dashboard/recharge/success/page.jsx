'use client';
import SuccessPage from "@/components/dashboard/pages/SuccessPage";
import TasksPage from "@/components/dashboard/pages/TasksPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <SuccessPage openProduct={openProduct} />;
}
