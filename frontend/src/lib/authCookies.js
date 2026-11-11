// src/lib/authCookies.js
// Cookies read by src/middleware.js for route protection.
//   accessToken — presence = "logged in"
//   role        — used ONLY to send people to the right interface
// IMPORTANT: these are UX helpers. Real authorization is enforced by the backend
// on every API call (it re-checks the role in the database), so tampering with
// these cookies cannot expose data.

const WEEK = 60 * 60 * 24 * 7;

export function setAuthCookies(accessToken, role) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `accessToken=${accessToken}; path=/; max-age=${WEEK}; SameSite=Lax${secure}`;
  document.cookie = `role=${role || 'user'}; path=/; max-age=${WEEK}; SameSite=Lax${secure}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0';
  document.cookie = 'role=; path=/; max-age=0';
}

export function isAdminRole(role) {
  return role === 'admin' || role === 'super_admin';
}

// Only allow same-site relative redirects (prevents open-redirect via ?redirect=)
export function safeRedirect(target, fallback) {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
    return target;
  }
  return fallback;
}
