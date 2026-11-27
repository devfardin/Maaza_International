'use client';
// The ONE full-screen loader. It covers the site from the first paint until the page has loaded
// AND the signed-in profile is known, so members and admins never see a second loader.
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Logo from '@/components/shared/Logo';

const MIN_SHOW_MS = 700;   // keep the brand on screen long enough to read, avoids a flicker
const MAX_WAIT_MS = 10000; // never block the screen longer than this, even if a request hangs

export default function InitialLoader() {
  const token = useSelector((s) => s.auth.token);
  const user = useSelector((s) => s.auth.user);

  const [minElapsed, setMinElapsed] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [visible, setVisible] = useState(true);

  // A signed-in visitor is ready once the profile is in Redux. Logged-out visitors don't need one.
  const authReady = !token || !!user;
  const ready = (minElapsed && pageLoaded && authReady) || timedOut;

  useEffect(() => {
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_SHOW_MS);
    const maxTimer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);

    const onLoad = () => setPageLoaded(true);
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const hide = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(hide);
  }, [ready]);

  // once ready, the overlay fades out (leaving) and is removed
  const leaving = ready;
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Maaza International"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-white via-harvest-50 to-harvest-100 transition-opacity duration-400 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center">
        <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-harvest-100">
          <Logo width={150} height="auto" />
        </div>

        <div className="mt-8 h-1 w-44 overflow-hidden rounded-full bg-harvest-100">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-harvest-500 to-harvest-700 animate-[loadbar_1.4s_ease-in-out_infinite]" />
        </div>

        <p className="mt-4 text-xs font-medium tracking-wide text-slate-500">Preparing your workspace…</p>
      </div>

      <style>{`@keyframes loadbar { 0% { transform: translateX(-120%);} 100% { transform: translateX(260%);} }`}</style>
    </div>
  );
}
