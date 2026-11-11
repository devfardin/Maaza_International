'use client';
import { useRouter } from 'next/navigation';
import OverviewPage from '@/components/dashboard/pages/OverviewPage';

export default function Page() {
  const router = useRouter();

  // showPage converts a page name to a URL and navigates
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  return <OverviewPage showPage={showPage} />;
}
