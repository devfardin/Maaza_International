'use client';
// ─────────────────────────────────────────────────────────────────────────────
// PagePopup — shows the super admin's popups for the dashboard page the member is on.
//   • Layout: header image (fixed) · body (description + body image, the ONLY part that
//     scrolls) · footer button (fixed).
//   • The server decides whether a popup is due (audience, frequency, daily limit, visit rules).
//   • "Every login" popups stay closed for the rest of the browser session.
//   • Other popups stay closed until the member's next visit to a page; the server then decides again.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGetActivePopupsQuery, useMarkPopupSeenMutation } from '@/redux/features/apiSlice';
import SafeHtml from '@/components/shared/SafeHtml';

const SESSION_KEY = 'dismissedPopups';

function readList(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

export default function PagePopup({ page }) {
  // Refetch on every page change: each request counts as one visit to this page (for "from the Nth visit").
  // currentData (not data) so a previous page's popups are never shown while the new page loads.
  const { currentData } = useGetActivePopupsQuery(page, { skip: !page, refetchOnMountOrArgChange: true });
  const [markSeen] = useMarkPopupSeenMutation();

  // "Every login" popups closed in this browser session (sessionStorage only exists in the browser)
  const [sessionClosed, setSessionClosed] = useState(() => (typeof window === 'undefined' ? [] : readList(SESSION_KEY)));
  // Other popups closed until the member's next page visit (resets when the page changes)
  const [visitClosed, setVisitClosed] = useState([]);
  const [visitPage, setVisitPage] = useState(page);

  // The popup on screen, pinned so a refetch never removes it while it is open — only closing does.
  // Each new display gets a new object, so every display is reported to the server once.
  const [shown, setShown] = useState(null);
  const [displayCount, setDisplayCount] = useState(0);

  // New page: forget the visit-level closes and the popup on screen (a new visit decides again)
  if (visitPage !== page) {
    setVisitPage(page);
    setVisitClosed([]);
    setShown(null);
  }

  const popups = currentData?.data ?? [];
  const isClosed = (p) => (p.frequency === 'every_login' ? sessionClosed : visitClosed).includes(p._id);
  const next = popups.find((p) => !isClosed(p));

  // Nothing on screen: bring up the next eligible popup (stored during render, not in an effect)
  if (!shown && next) {
    setDisplayCount(displayCount + 1);
    setShown({ popup: next, n: displayCount + 1 });
  }

  // Count this display on the server (drives "once", "daily" limits, visit rules and max views)
  useEffect(() => {
    if (shown) markSeen({ id: shown.popup._id, page });
  }, [shown, markSeen, page]);

  const current = shown?.popup;
  if (!current) return null;

  function dismiss() {
    if (current.frequency === 'every_login') {
      const list = [...sessionClosed, current._id];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
      setSessionClosed(list);
    } else {
      setVisitClosed([...visitClosed, current._id]);
    }
    setShown(null); // the next render brings up the next matching popup
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
        className="flex w-full max-w-lg max-h-[70dvh] flex-col overflow-hidden rounded-xl bg-white shadow-xl m-1"
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
            {current.description && <SafeHtml html={current.description} className="text-sm leading-relaxed text-slate-700" />}
            {current.bodyImage && (
              <img src={current.bodyImage} alt="" className={`block w-full rounded-md object-contain ${current.description ? 'mt-4' : ''}`} />
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
                className="block w-full rounded-md bg-harvest-700 py-3 text-center text-sm font-extrabold text-white"
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
