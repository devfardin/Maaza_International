// src/redux/store.js
// ─────────────────────────────────────────────────────────────────────────────
// Redux store — the single source of truth for all app state.
//
// SLICES:
//   auth  — logged-in user, JWT tokens, isAuthenticated flag
//   api   — RTK Query cache for all backend data (products, wallet, tasks, etc.)
//
// HOW TO ADD A NEW SLICE:
//   1. Create src/redux/features/yourSlice.js
//   2. Import the reducer here and add it to the reducer map
//
// HOW TO ACCESS STATE IN A COMPONENT:
//   import { useSelector } from 'react-redux';
//   const user = useSelector(state => state.auth.user);
// ─────────────────────────────────────────────────────────────────────────────

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import { apiSlice } from './features/apiSlice';

export const store = configureStore({
  reducer: {
    // Auth state — user info and JWT tokens
    auth: authReducer,

    // RTK Query cache — all API data lives here under the 'api' key
    [apiSlice.reducerPath]: apiSlice.reducer,
  },

  // RTK Query middleware is required — handles cache lifetime, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
