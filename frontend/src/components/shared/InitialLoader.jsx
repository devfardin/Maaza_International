'use client';
// Full-screen branded loader shown while the website first loads.
import { useEffect, useState } from 'react';

export default function InitialLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let hideTimer;
    const finish = () => {
      // keep it up for a short moment so the brand is visible, then fade out
      hideTimer = setTimeout(() => {
        setLeaving(true);
        setTimeout(() => setVisible(false), 350);
      }, 450);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    return () => {
      window.removeEventListener('load', finish);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f5f8f5] transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-300 to-harvest-700 text-white text-3xl grid place-items-center shadow-lg animate-pulse">✦</span>
      <p className="mt-4 font-extrabold text-harvest-900">Maaza International</p>
      <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-harvest-100">
        <div className="h-full w-1/2 rounded-full bg-harvest-600 animate-[loadbar_1.2s_ease-in-out_infinite]" />
      </div>
      <style>{`@keyframes loadbar { 0% { transform: translateX(-100%);} 100% { transform: translateX(200%);} }`}</style>
    </div>
  );
}
