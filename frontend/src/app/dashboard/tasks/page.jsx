'use client';
import TasksPage from '@/components/dashboard/pages/TasksPage';
import { useTaskModal } from '@/hooks/useDashboardModals';

export default function Page() {
  const openTask = useTaskModal();
  return <TasksPage openTask={openTask} />;
}
