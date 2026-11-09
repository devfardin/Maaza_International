// src/redux/features/authSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// Auth slice — manages the logged-in user's state in Redux.
//
// STATE SHAPE:
//   user            — the user object returned from the backend (name, role, etc.)
//   token           — JWT access token used in API request headers
//   refreshToken    — JWT refresh token used to get a new access token
//   isAuthenticated — boolean, true when user is logged in
//
// HOW TO USE:
//   Dispatch setCredentials after a successful login/register API call.
//   Dispatch logout when the user clicks "Sign out".
//
// PERSISTENCE:
//   Tokens are saved to localStorage so the user stays logged in on page refresh.
//   On app load, initAuth() reads them back into Redux state.
// ─────────────────────────────────────────────────────────────────────────────

import { createSlice } from '@reduxjs/toolkit';

// Read tokens from localStorage on initial load (handles page refresh)
// Returns null safely if running on the server (SSR)
function loadFromStorage() {
  if (typeof window === 'undefined') return { token: null, refreshToken: null };
  return {
    token: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
  };
}

const { token, refreshToken } = loadFromStorage();

const initialState = {
  user: null,
  token,
  refreshToken,
  isAuthenticated: !!token, // true if a token already exists in storage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    // Called after a successful login or register API response
    // payload: { user, accessToken, refreshToken }
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;

      // Persist tokens so they survive page refresh
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },

    // Called when the user profile is fetched (to populate user object)
    // without changing the token — useful after page refresh
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    // Called on sign-out — clears all auth state and storage
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
