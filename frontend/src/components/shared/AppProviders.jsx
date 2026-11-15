'use client';
// Global providers + chrome shared by every zone (public, dashboard, admin).
import { Toaster } from 'sonner';
import ReduxProvider from '@/redux/ReduxProvider';
import { I18nProvider } from '@/lib/i18n';
import InitialLoader from '@/components/shared/InitialLoader';
import RealtimeSync from '@/components/shared/RealtimeSync';

export default function AppProviders({ children }) {
  return (
    <ReduxProvider>
      {/* Live refresh: pushes data changes to open screens while logged in */}
      <RealtimeSync />
      <I18nProvider>
        {children}
        {/* Top-right toast notifications for success / error messages */}
        <Toaster position="top-right" richColors closeButton expand visibleToasts={4} />
        <InitialLoader />
      </I18nProvider>
    </ReduxProvider>
  );
}
