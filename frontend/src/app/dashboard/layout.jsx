'use client';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import Sidebar   from '@/components/dashboard/Sidebar';
import Header    from '@/components/dashboard/Header';
import MobileNav from '@/components/dashboard/MobileNav';
import Modal     from '@/components/dashboard/Modal';
import Toast     from '@/components/dashboard/Toast';

// Inner layout — needs to be separate so it can call useDashboard()
function DashboardInner({ children }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { toastMsg, showToast, modal, closeModal } = useDashboard();

  // Derive active page name from URL
  // e.g. /dashboard/products → 'products', /dashboard → 'overview'
  const segment   = pathname.split('/')[2] || 'overview';

  // Navigate using Next.js router so URL updates
  function showPage(page) {
    const path = page === 'overview' ? '/dashboard' : `/dashboard/${page}`;
    router.push(path);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)] bg-[#f5f8f5]">

      {/* Sidebar — desktop only */}
      <Sidebar activePage={segment} showPage={showPage} showToast={showToast} />

      {/* Main content */}
      <main className="min-w-0">
        <Header showPage={showPage} showToast={showToast} />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 xl:px-9 py-5 sm:py-7 pb-28 lg:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav activePage={segment} showPage={showPage} />

      {/* Modal — shared across all pages via context */}
      <Modal open={modal.open} tag={modal.tag} title={modal.title} onClose={closeModal}>
        {modal.body}
      </Modal>

      {/* Toast notification */}
      <Toast message={toastMsg} />
    </div>
  );
}

// Outer layout — wraps everything in the context provider
export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <DashboardInner>{children}</DashboardInner>
    </DashboardProvider>
  );
}
