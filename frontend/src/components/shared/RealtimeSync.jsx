'use client';
// ─────────────────────────────────────────────────────────────────────────────
// RealtimeSync — keeps every logged-in screen live without a browser reload.
//
// The backend keeps one Server-Sent Events stream open per logged-in tab
// (GET /realtime/stream). When something changes (a deposit is approved, a
// commission is paid, a VIP level is reached...), the server sends a "sync"
// event listing the RTK Query tags that are now stale. We invalidate those tags,
// and every mounted query for them refetches on its own.
//
// Mounted once in AppProviders. It does nothing while logged out.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice, ALL_TAG_TYPES } from '@/redux/features/apiSlice';
import { notify } from '@/lib/toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const TAGS_ON_VIP_UPGRADE = ['User', 'Wallet', 'Transactions', 'Referrals', 'DailyCheckin'];

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });

// Reads the freshest access token. api.js refreshes it into localStorage on 401.
const currentToken = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

// Gets a new access token from the httpOnly refresh cookie. Returns null on failure.
async function refreshAccessToken() {
  try {
    const res = await fetch(`${API}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = await res.json();
    const token = body?.data?.accessToken;
    if (token) localStorage.setItem('accessToken', token);
    return token || null;
  } catch {
    return null;
  }
}

// Splits the SSE text stream into { event, data } messages. Comment lines (": ping") are ignored.
function parseBlock(block) {
  let event = 'message';
  const dataLines = [];
  for (const line of block.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
}

export default function RealtimeSync() {
  const dispatch = useDispatch();
  // Changing the redux token (login / logout) restarts the stream
  const token = useSelector((s) => s.auth.token);

  useEffect(() => {
    if (!token || !API) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let hasConnectedBefore = false;

    const handleMessage = ({ event, data }) => {
      if (event === 'sync') {
        const tags = data?.tags === 'all' ? ALL_TAG_TYPES : data?.tags;
        if (Array.isArray(tags) && tags.length) dispatch(apiSlice.util.invalidateTags(tags));
      } else if (event === 'vip-upgrade') {
        dispatch(apiSlice.util.invalidateTags(TAGS_ON_VIP_UPGRADE));
        notify.success(`Congratulations! You reached VIP ${data?.vipLevel}.`);
      }
    };

    // One connection attempt. Resolves when the stream ends, rejects on failure.
    async function streamOnce(accessToken) {
      const res = await fetch(`${API}/realtime/stream`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        cache: 'no-store',
        signal,
      });
      if (res.status === 401) {
        const err = new Error('unauthorized');
        err.status = 401;
        throw err;
      }
      if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

      // Anything that changed while we were disconnected is refreshed once
      if (hasConnectedBefore) dispatch(apiSlice.util.invalidateTags(ALL_TAG_TYPES));
      hasConnectedBefore = true;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });

        let end;
        while ((end = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const message = parseBlock(block);
          if (message) handleMessage(message);
        }
      }
    }

    // Keeps reconnecting with a growing delay until the component unmounts or the user logs out
    (async () => {
      let attempt = 0;
      while (!signal.aborted) {
        try {
          await streamOnce(currentToken() || token);
          attempt = 0; // the stream ended normally (server restart / proxy timeout)
        } catch (err) {
          if (signal.aborted) return;
          if (err?.status === 401) {
            const fresh = await refreshAccessToken();
            if (!fresh) return; // session is gone — the normal auth guards will send the user to login
          }
        }
        if (signal.aborted) return;
        const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
        attempt += 1;
        await sleep(delay, signal);
      }
    })();

    return () => controller.abort();
  }, [token, dispatch]);

  return null;
}
