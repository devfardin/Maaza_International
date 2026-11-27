'use client';
// ─────────────────────────────────────────────────────────────────────────────
// PagePopup — shows the super admin's popups for the dashboard page the member is on.
//   • Layout: header image (fixed) · body (description + body image, the ONLY part that
//     scrolls) · footer button (fixed).
//   • Each popup is shown once per browser session; closing it (or clicking its button)
//     hides it for the rest of the session.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import { useGetActivePopupsQuery } from '@/redux/features/apiSlice';
import SafeHtml from '@/components/shared/SafeHtml';

const STORAGE_KEY = 'dismissedPopups';

function readDismissed() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function PagePopup({ page }) {
  const { data } = useGetActivePopupsQuery(page, { skip: !page });
  // Popups closed in this browser session (sessionStorage only exists in the browser)
  const [dismissed, setDismissed] = useState(() => (typeof window === 'undefined' ? [] : readDismissed()));

  const popups = data?.data ?? [];
  const current = popups.find((p) => !dismissed.includes(p._id));
  if (!current) return null;

  function dismiss() {
    const next = [...dismissed, current._id];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDismissed(next);
  }

  const isExternal = /^https?:\/\//i.test(current.buttonLink);
  const hasBody = current.description || current.bodyImage;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-0 sm:p-5" onClick={dismiss}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md max-h-[90dvh] flex-col overflow-hidden rounded-xl bg-white shadow-xl m-1"
      >
        {/* Header image — fixed at the top */}
        <div className="relative shrink-0">
          {current.headerImage ? (
            <img src={current.headerImage} alt="" className="block max-h-48 w-full object-cover" />
          ) : (
            <div className="h-16 w-full bg-gradient-to-r from-harvest-700 to-harvest-500" />
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-lg text-white"
          >
            ×
          </button>
        </div>

        {/* Body — the only part that scrolls */}
        {hasBody && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {current.description && <SafeHtml html={current.description} className="text-sm leading-relaxed text-slate-700" />}
            {current.bodyImage && (
              <img src={current.bodyImage} alt="" className={`block w-full rounded-2xl object-contain ${current.description ? 'mt-4' : ''}`} />
            )}
          </div>
        )}

        {/* Footer — fixed at the bottom */}
        {current.buttonText && current.buttonLink && (
          <div className="shrink-0 border-t bg-white px-5 py-4 sm:px-6">
            {isExternal ? (
              <a
                href={current.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="block w-full rounded-xl bg-harvest-700 py-3 text-center text-sm font-extrabold text-white"
              >
                {current.buttonText}
              </a>
            ) : (
              <Link
                href={current.buttonLink}
                onClick={dismiss}
                className="block w-full rounded-xl bg-harvest-700 py-3 text-center text-sm font-extrabold text-white"
              >
                {current.buttonText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
