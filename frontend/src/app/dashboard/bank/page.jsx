'use client';
import BankPage from "@/components/dashboard/pages/BankPage";
import TasksPage from "@/components/dashboard/pages/TasksPage";
import { useProductModal } from "@/hooks/useDashboardModals";

export default function Page() {
  const openProduct = useProductModal();
  return <BankPage openProduct={openProduct} />;
}
