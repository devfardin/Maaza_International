// src/redux/store.js
// ─────────────────────────────────────────────────────────────────────────────
// Redux store — single source of truth for all app state.
//
// SLICES:
//   auth — user, token, userId, isAuthenticated
//   api  — RTK Query cache for all backend data
//
// HOW TO READ STATE IN A COMPONENT:
//   const { user, userId } = useSelector(state => state.auth);
// ─────────────────────────────────────────────────────────────────────────────

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import { apiSlice } from './features/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  // RTK Query middleware handles cache lifetime, polling, and invalidation
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});
