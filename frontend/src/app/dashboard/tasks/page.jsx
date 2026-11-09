'use client';
import TasksPage from "@/components/dashboard/pages/TasksPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <TasksPage openProduct={openProduct} />;
}
