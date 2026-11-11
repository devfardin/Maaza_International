// src/redux/features/authSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// Auth slice — manages logged-in user state in Redux.
//
// STATE:
//   token           — raw JWT access token (sent as Authorization header)
//   refreshToken    — JWT refresh token (also stored as httpOnly cookie by backend)
//   userId          — decoded from JWT, used for wallet/transaction API queries
//   user            — full user object populated by GET /users/me after login
//   isAuthenticated — true when a valid token exists
//
// PERSISTENCE:
//   token and userId are saved to localStorage so the user stays logged in
//   across page refreshes. The user object is re-fetched from the API on mount.
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice } from '@reduxjs/toolkit';

// Decode JWT payload without a library — JWT is base64url encoded
// Returns the payload object or null if the token is invalid
function decodeJwt(token) {
  try {
    // JWT format: header.payload.signature — we only need the payload (index 1)
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Read persisted auth data from localStorage on initial app load
// Returns null safely when running on the server (SSR/middleware)
function loadFromStorage() {
  if (typeof window === 'undefined') return { token: null, userId: null };
  return {
    token:  localStorage.getItem('accessToken')  || null,
    userId: localStorage.getItem('userId')        || null,
  };
}

const { token, userId } = loadFromStorage();

const initialState = {
  user:            null,
  token,
  userId,
  isAuthenticated: !!token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    // Called after a successful login API response
    // payload: { accessToken, refreshToken }
    // Decodes the JWT to extract userId so we can call /wallets/:userId etc.
    setCredentials: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      const decoded = decodeJwt(accessToken);

      state.token           = accessToken;
      state.userId          = decoded?.userId || null;
      state.isAuthenticated = true;

      // Persist to localStorage for page-refresh survival
      localStorage.setItem('accessToken', accessToken);
      if (decoded?.userId) localStorage.setItem('userId', decoded.userId);

      // refreshToken is stored as httpOnly cookie by the backend at login.
      // We also keep it in localStorage as a fallback for the Axios interceptor.
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },

    // Called when GET /users/me returns the full user profile
    // Populates user.fullName, user.membershipLevel, user.referredBy, etc.
    setUser: (state, action) => {
      state.user            = action.payload;
      state.isAuthenticated = true;
      // Also ensure userId is set from the user object if not already decoded
      if (!state.userId && action.payload?._id) {
        state.userId = action.payload._id;
        localStorage.setItem('userId', action.payload._id);
      }
    },

    // Called on sign-out — clears all auth state and localStorage
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.userId          = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
