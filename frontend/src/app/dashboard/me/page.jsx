'use client';

import MePage from '@/components/dashboard/pages/MePage';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  // Converts a page name to a URL and navigates — same pattern as all other dashboard pages
  function showPage(page) {
    router.push(page === 'overview' ? '/dashboard' : `/dashboard/${page}`);
  }

  return <MePage showPage={showPage} />;
}
