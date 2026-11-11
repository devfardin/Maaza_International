'use client';
import WithdrawalsPage from '@/components/dashboard/pages/WithdrawalsPage';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }
  return <WithdrawalsPage showPage={showPage} />;
}
