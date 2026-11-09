// src/redux/features/apiSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// RTK Query base API — defines all backend endpoints in one place.
//
// HOW IT WORKS:
//   RTK Query auto-generates React hooks for every endpoint defined here.
//   It handles caching, loading states, error states, and re-fetching.
//
// HOW TO USE IN A COMPONENT:
//   import { useGetProfileQuery } from '@/redux/features/apiSlice';
//   const { data, isLoading, isError } = useGetProfileQuery();
//
// HOW TO ADD A NEW ENDPOINT:
//   Add a new entry inside `endpoints` builder below.
//   Use `query` for GET requests, `mutation` for POST/PATCH/DELETE.
//
// CACHE TAGS:
//   Tags allow RTK Query to automatically refetch related data after a mutation.
//   e.g. after a recharge mutation, the wallet query auto-refreshes.
// ─────────────────────────────────────────────────────────────────────────────

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base query — attaches JWT token from Redux state to every request
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  // Inject the access token from Redux state into every request header.
  // IMPORTANT: The backend auth middleware reads req.headers.authorization
  // directly and passes it to jwt.verify() WITHOUT stripping 'Bearer '.
  // So we send the raw token only — no 'Bearer ' prefix.
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      // Send raw token — backend does: jwt.verify(req.headers.authorization, secret)
      headers.set('Authorization', token);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,

  // Cache tags — used to invalidate and refetch data after mutations
  // Add new tags here when you add new resource types
  tagTypes: ['User', 'Products', 'Wallet', 'Transactions', 'Tasks', 'Referrals'],

  endpoints: (builder) => ({

    // ── AUTH ────────────────────────────────────────────────────────────────

    // POST /auth/login — returns { user, accessToken, refreshToken }
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // POST /users/create-user — creates a new user account
    // Backend route: POST /api/v1/users/create-user
    register: builder.mutation({
      query: (userData) => ({
        url: '/users/create-user',
        method: 'POST',
        body: userData,
      }),
    }),

    // NOTE: There is no /auth/logout endpoint on the backend.
    // Logout is handled purely on the frontend by clearing tokens.
    // This mutation is kept as a no-op placeholder so the dashboard
    // layout does not need to be changed if a logout endpoint is added later.
    logoutUser: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),

    // ── USER / PROFILE ──────────────────────────────────────────────────────

    // GET /users/me — fetch the logged-in user's full profile
    getProfile: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    // PATCH /users/me — update profile fields (name, phone, etc.)
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/users/me', method: 'PATCH', body: data }),
      invalidatesTags: ['User'], // refetch profile after update
    }),

    // ── PRODUCTS ────────────────────────────────────────────────────────────

    // GET /products — fetch all available products
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
    }),

    // GET /products/:id — fetch a single product by ID
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),

    // GET /products/purchased — fetch products the user has purchased
    getPurchasedProducts: builder.query({
      query: () => '/products/purchased',
      providesTags: ['Products'],
    }),

    // POST /products/:id/purchase — buy a product
    purchaseProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}/purchase`, method: 'POST' }),
      invalidatesTags: ['Products', 'Wallet', 'Transactions'],
    }),

    // ── WALLET ──────────────────────────────────────────────────────────────

    // GET /wallet — fetch wallet balance and summary
    getWallet: builder.query({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),

    // POST /wallet/recharge — submit a recharge request
    rechargeWallet: builder.mutation({
      query: (data) => ({ url: '/wallet/recharge', method: 'POST', body: data }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),

    // POST /wallet/withdraw — submit a withdrawal request
    withdrawWallet: builder.mutation({
      query: (data) => ({ url: '/wallet/withdraw', method: 'POST', body: data }),
      invalidatesTags: ['Wallet', 'Transactions'],
    }),

    // ── TRANSACTIONS ────────────────────────────────────────────────────────

    // GET /transactions — fetch full transaction history
    getTransactions: builder.query({
      query: () => '/transactions',
      providesTags: ['Transactions'],
    }),

    // ── TASKS ───────────────────────────────────────────────────────────────

    // GET /tasks — fetch all available tasks
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),

    // POST /tasks/:id/submit — submit a completed task for review
    submitTask: builder.mutation({
      query: (id) => ({ url: `/tasks/${id}/submit`, method: 'POST' }),
      invalidatesTags: ['Tasks'],
    }),

    // ── REFERRALS ───────────────────────────────────────────────────────────

    // GET /referrals — fetch referral stats and referred users list
    getReferrals: builder.query({
      query: () => '/referrals',
      providesTags: ['Referrals'],
    }),

    // ── PAYOUT / BANK ───────────────────────────────────────────────────────

    // GET /users/payout — fetch saved bKash/Nagad payout details
    getPayoutDetails: builder.query({
      query: () => '/users/payout',
      providesTags: ['User'],
    }),

    // POST /users/payout — save or update payout details
    savePayoutDetails: builder.mutation({
      query: (data) => ({ url: '/users/payout', method: 'POST', body: data }),
      invalidatesTags: ['User'],
    }),

  }),
});

// Export auto-generated hooks — import these directly in your components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutUserMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetPurchasedProductsQuery,
  usePurchaseProductMutation,
  useGetWalletQuery,
  useRechargeWalletMutation,
  useWithdrawWalletMutation,
  useGetTransactionsQuery,
  useGetTasksQuery,
  useSubmitTaskMutation,
  useGetReferralsQuery,
  useGetPayoutDetailsQuery,
  useSavePayoutDetailsMutation,
} = apiSlice;
