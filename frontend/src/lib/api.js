// src/lib/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Central Axios instance used by every API call in the app.
//
// HOW IT WORKS:
//   1. Every outgoing request automatically attaches the JWT access token
//      from localStorage as a Bearer header.
//   2. If the server returns 401 (token expired), it tries to refresh the
//      token using the refresh endpoint, then retries the original request.
//   3. If refresh also fails, the user is logged out and redirected to /login.
//
// HOW TO USE:
//   import api from '@/lib/api';
//   const res = await api.get('/users/me');
//   const res = await api.post('/auth/login', { email, password });
//
// TO CHANGE THE BASE URL:
//   Update NEXT_PUBLIC_API_URL in your .env file.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// Create the Axios instance with the backend base URL from .env
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send cookies if your backend uses httpOnly refresh tokens
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Runs before every request — attaches the JWT access token if it exists
api.interceptors.request.use(
  (config) => {
    // Read the access token stored after login
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

    // Attach raw token — backend auth middleware does jwt.verify(req.headers.authorization)
    // directly without stripping 'Bearer ', so we must NOT add the prefix.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// Runs after every response — handles 401 token expiry automatically
api.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // mark so we don't loop

      try {
        // Backend refresh endpoint reads the refreshToken from the httpOnly
        // cookie it set at login — we do NOT send it in the body.
        // The cookie is sent automatically because withCredentials: true is set.
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          {},  // empty body — backend reads token from req.cookies.refreshToken
          { withCredentials: true }
        );

        // Save the new access token to localStorage and update the cookie
        localStorage.setItem('accessToken', data.data.accessToken);
        document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        // Retry the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);

      } catch {
        // Refresh also failed — clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'accessToken=; path=/; max-age=0';
        document.cookie = 'role=; path=/; max-age=0';
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
