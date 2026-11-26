'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AutoLocation — runs silently when a member's dashboard opens (i.e. after login).
// It reads the browser position and asks the server to save the nearest district.
// Members do not choose their location; if the browser cannot or is not allowed to
// give a position, nothing is saved and nothing is shown.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useSaveMyLocationMutation } from '@/redux/features/apiSlice';
import { getBrowserPosition } from '@/lib/location';

export default function AutoLocation() {
  const [saveMyLocation] = useSaveMyLocationMutation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getBrowserPosition();
      if (!pos || cancelled) return;
      try {
        // invalidates the 'User' cache tag, so the dashboard refetches the profile
        await saveMyLocation(pos).unwrap();
      } catch {
        // outside Bangladesh or server unavailable: stay silent
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
