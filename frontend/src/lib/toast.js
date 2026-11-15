// src/lib/toast.js
// ─────────────────────────────────────────────────────────────────────────────
// Single place for every user-facing notification (sonner, top-right corner).
//
//   import { notify, getErrorMessage } from '@/lib/toast';
//   notify.success('Withdrawal submitted');
//   notify.error(getErrorMessage(err));           // readable message from the API
// ─────────────────────────────────────────────────────────────────────────────
import { toast } from 'sonner';

export const notify = {
  success: (message, opts) => toast.success(message, opts),
  error:   (message, opts) => toast.error(message, opts),
  info:    (message, opts) => toast.info(message, opts),
  warning: (message, opts) => toast.warning(message, opts),
};

// Turns an RTK Query / fetch error into one clear sentence for the user.
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  // Network problems (server down, no internet)
  if (err.status === 'FETCH_ERROR' || err.status === 'TIMEOUT_ERROR') {
    return 'Network error. Check your internet connection and try again.';
  }
  const data = err.data;

  // 401 from /auth/login means "wrong phone or password" — the server message says so.
  // Only fall back to the generic "session expired" text when the server gave no message.
  if (err.status === 401) {
    if (data?.message) return data.message;
    return 'Your session has expired. Please log in again.';
  }
  if (err.status === 403) return data?.message || 'You do not have permission to do that.';
  if (err.status === 404) return data?.message || 'The requested item could not be found.';
  if (err.status === 429) return data?.message || 'Too many attempts. Please wait a moment and try again.';

  // Validation errors carry a field-level list — show the first clear one
  const firstSource = Array.isArray(data?.errorSources) ? data.errorSources.find((e) => e?.message) : null;
  if (firstSource?.message && firstSource.message !== 'Someting want wrong') return firstSource.message;
  if (data?.message) return data.message;
  if (typeof err.message === 'string' && err.message) return err.message;
  return fallback;
}
