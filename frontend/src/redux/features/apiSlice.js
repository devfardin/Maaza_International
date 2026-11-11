// src/redux/features/apiSlice.js
// ─────────────────────────────────────────────────────────────────────────────
// RTK Query — single source of truth for ALL backend API calls.
//
// BASE URL : NEXT_PUBLIC_API_URL  (e.g. http://localhost:5000/api/v1)
// AUTH     : "Bearer <jwt>" in the Authorization header (backend also accepts a raw token)
//
// HOW TO USE IN A COMPONENT:
//   import { useGetProductsQuery } from '@/redux/features/apiSlice';
//   const { data, isLoading, isError, refetch } = useGetProductsQuery();
//
// HOW TO ADD A NEW ENDPOINT:
//   Add a builder.query() or builder.mutation() inside endpoints below,
//   then export the generated hook at the bottom.
// ─────────────────────────────────────────────────────────────────────────────

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  credentials: 'include', // send the httpOnly refresh-token cookie
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,

  // Cache invalidation tags — add a new tag whenever you add a new resource type
  tagTypes: [
    'User', 'Products', 'Categories', 'Wallet', 'Transactions',
    'Tasks', 'Purchases', 'DepositRequests', 'PaymentMethods',
    'PaymentAccounts', 'CommunityPosts', 'Referrals', 'Activity', 'AdminProducts',
    'Withdrawals', 'Notifications', 'AdminActivity',
  ],

  endpoints: (builder) => ({

    // ── AUTH ──────────────────────────────────────────────────────────────────
    // POST /auth/login
    // Body: { phone, password }
    // Response: { data: { accessToken, refreshToken } }
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // POST /auth/refresh-token
    // Reads refreshToken from httpOnly cookie (set at login) — no body needed
    // Response: { data: { accessToken } }
    refreshToken: builder.mutation({
      query: () => ({ url: '/auth/refresh-token', method: 'POST' }),
    }),

    // POST /auth/change-password  (authenticated)
    // Body: { oldPassword, newPassword }
    changePassword: builder.mutation({
      query: (data) => ({ url: '/auth/change-password', method: 'POST', body: data }),
    }),

    // POST /auth/forget-password
    // Body: { phone }
    forgetPassword: builder.mutation({
      query: (data) => ({ url: '/auth/forget-password', method: 'POST', body: data }),
    }),

    // POST /auth/reset-password
    // Body: { phone, newPassword }  — token sent in Authorization header
    resetPassword: builder.mutation({
      query: ({ token, ...data }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
        headers: { Authorization: `Bearer ${token}` },
      }),
    }),

    // ── USERS ─────────────────────────────────────────────────────────────────
    // POST /users/create-user  (public — registration)
    // Body: { fullName, phone, email, passwordHash, referredBy? }
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/users/create-user',
        method: 'POST',
        body: userData,
      }),
    }),

    // GET /users/me  (authenticated)
    // Returns the full profile of the logged-in user (no passwordHash)
    // Populated: referredBy (the user who referred this user)
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    // PATCH /users/me  (authenticated)
    // Body: { fullName?, email?, phone? }  — referralCode, membership and status are NOT editable
    updateMyProfile: builder.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    // ── CATEGORIES ────────────────────────────────────────────────────────────
    // GET /categories  (public)
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    // ── PRODUCTS ──────────────────────────────────────────────────────────────
    // GET /products  (public)
    // Returns all active products with rewardPlan, bonuses, teamCommissions
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
    }),

    // GET /products/:id  (public)
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: ['Products'],
    }),

    // ── PRODUCT PURCHASES ─────────────────────────────────────────────────────
    // POST /product-purchases/purchase  (authenticated user)
    // Body: { productId, paymentSource: "recharge" | "balance" }
    // On success: deducts from wallet, creates purchase, records transaction
    // Welcome bonus (120 BDT) and referral bonus are handled by the backend
    purchaseProduct: builder.mutation({
      query: (data) => ({
        url: '/product-purchases/purchase',
        method: 'POST',
        body: data,
      }),
      // Refetch wallet, purchases, and transactions after a purchase
      invalidatesTags: ['Purchases', 'Wallet', 'Transactions'],
    }),

    // GET /product-purchases/my-purchases  (authenticated user)
    // Returns all purchases for the logged-in user, populated with product name/image
    getMyPurchases: builder.query({
      query: () => '/product-purchases/my-purchases',
      providesTags: ['Purchases'],
    }),

    // GET /product-purchases/:purchaseId  (authenticated user)
    getSinglePurchase: builder.query({
      query: (purchaseId) => `/product-purchases/${purchaseId}`,
      providesTags: ['Purchases'],
    }),

    // POST /product-purchases/:purchaseId/claim  (authenticated user)
    // Claims daily income for a purchase — credits balance wallet
    // Also credits referral commissions (level B and C) automatically
    claimDailyIncome: builder.mutation({
      query: (purchaseId) => ({
        url: `/product-purchases/${purchaseId}/claim`,
        method: 'POST',
      }),
      invalidatesTags: ['Wallet', 'Transactions', 'Purchases'],
    }),

    // GET /product-purchases/:purchaseId/claim-history  (authenticated user)
    getClaimHistory: builder.query({
      query: (purchaseId) => `/product-purchases/${purchaseId}/claim-history`,
    }),

    // ── WALLETS ───────────────────────────────────────────────────────────────
    // GET /wallets/:userId  (authenticated)
    // Returns { rechargeWallet: { balance, formattedBalance }, balanceWallet: {...} }
    // NOTE: userId must be the logged-in user's ID from Redux state
    getMyWallets: builder.query({
      query: (userId) => `/wallets/${userId}`,
      providesTags: ['Wallet'],
    }),

    // ── DEPOSIT REQUESTS (RECHARGE) ───────────────────────────────────────────
    // POST /deposit-requests/create-deposit-request  (authenticated user)
    // Body: { userId, amount, methodCode, senderNumber, transactionId }
    // amount is in BDT integer (min 200). Backend stores in poisha (×100).
    createDepositRequest: builder.mutation({
      query: (data) => ({
        url: '/deposit-requests/create-deposit-request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DepositRequests'],
    }),

    // GET /deposit-requests/user/:userId  (authenticated)
    // Returns all deposit requests submitted by this user
    getMyDepositRequests: builder.query({
      query: (userId) => `/deposit-requests/user/${userId}`,
      providesTags: ['DepositRequests'],
    }),

    // ── WITHDRAWALS (PAYOUTS) ─────────────────────────────────────────────────
    // POST /withdrawals/create-withdrawal  (user)
    // Body: { amount (whole BDT, min 100), paymentAccountId }
    // The amount is moved out of the balance wallet immediately; refunded if rejected.
    createWithdrawal: builder.mutation({
      query: (body) => ({ url: '/withdrawals/create-withdrawal', method: 'POST', body }),
      invalidatesTags: ['Withdrawals', 'Wallet', 'Transactions'],
    }),

    // GET /withdrawals/my  (user) — own withdrawal history, newest first
    getMyWithdrawals: builder.query({
      query: () => '/withdrawals/my',
      providesTags: ['Withdrawals'],
    }),

    // GET /withdrawals?status=pending  (admin)
    getAllWithdrawals: builder.query({
      query: (status) => (status ? `/withdrawals?status=${status}` : '/withdrawals'),
      providesTags: ['Withdrawals'],
    }),

    // PATCH /withdrawals/:id/status  (admin)
    // Body: { status: 'approved' | 'rejected', adminNote?, payoutReference? }
    updateWithdrawalStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/withdrawals/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Withdrawals', 'Wallet', 'Transactions', 'Notifications'],
    }),

    // ── NOTIFICATIONS (ADMIN BELL) ────────────────────────────────────────────
    // GET /notifications?limit=  (admin) → { items, unreadCount }
    getNotifications: builder.query({
      query: (limit = 20) => `/notifications?limit=${limit}`,
      providesTags: ['Notifications'],
    }),

    // PATCH /notifications/:id/read  (admin)
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    // PATCH /notifications/read-all  (admin)
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    // ── ADMIN ACTIVITY (SUPER ADMIN ONLY) ─────────────────────────────────────
    // GET /admin-activity?adminId=&action=&limit=
    getAdminActivity: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
        ).toString();
        return `/admin-activity${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminActivity'],
    }),

    // GET /admin-activity/summary  (super admin) — one row per admin
    getAdminActivitySummary: builder.query({
      query: () => '/admin-activity/summary',
      providesTags: ['AdminActivity'],
    }),

    // ── PAYMENT METHODS ───────────────────────────────────────────────────────
    // GET /payment-methods  (public)
    // Returns active payment methods (bKash, Nagad) with account numbers for deposit
    getPaymentMethods: builder.query({
      query: () => '/payment-methods',
      providesTags: ['PaymentMethods'],
    }),

    // ── PAYMENT ACCOUNTS (USER PAYOUT ACCOUNTS) ───────────────────────────────
        // GET /paymentaccounts  — not in backend routes, omitted

    // POST /paymentaccounts/create-payment-accounts  (authenticated)
    // Body: { userId, method: "bkash"|"nogod", accountNumber, accountHolderName }
    createPaymentAccount: builder.mutation({
      query: (data) => ({
        url: '/payment-accounts/create-payment-accounts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PaymentAccounts'],
    }),

    // GET /payment-accounts/my-accounts  (authenticated)
    // Returns all payout accounts saved by the logged-in user
    getMyPaymentAccounts: builder.query({
      query: () => '/payment-accounts/my-accounts',
      providesTags: ['PaymentAccounts'],
    }),

    // ── TRANSACTIONS ──────────────────────────────────────────────────────────
    // GET /transactions/user/:userId  (authenticated)
    // Returns full transaction history for the user, newest first
    getUserTransactions: builder.query({
      query: (userId) => `/transactions/user/${userId}`,
      providesTags: ['Transactions'],
    }),

    // GET /transactions/user/:userId/filter?type=deposit  (authenticated)
    // Filter by type: deposit | withdrawal | product_purchase | profit | commission
    getUserTransactionsByType: builder.query({
      query: ({ userId, type }) => `/transactions/user/${userId}/filter?type=${type}`,
      providesTags: ['Transactions'],
    }),

    // ── TASKS ─────────────────────────────────────────────────────────────────
    // GET /tasks  (public)
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),

    // GET /tasks/:id  (public)
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: ['Tasks'],
    }),

    // ── COMMUNITY POSTS ───────────────────────────────────────────────────────
    // GET /community-posts  (public)
    getCommunityPosts: builder.query({
      query: () => '/community-posts',
      providesTags: ['CommunityPosts'],
    }),

    // POST /community-posts/create-post  (authenticated)
    // Body: { content, ... }
    createCommunityPost: builder.mutation({
      query: (data) => ({
        url: '/community-posts/create-post',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CommunityPosts'],
    }),

    // PATCH /community-posts/:postId/like  (authenticated)
    likePost: builder.mutation({
      query: (postId) => ({
        url: `/community-posts/${postId}/like`,
        method: 'PATCH',
      }),
      invalidatesTags: ['CommunityPosts'],
    }),

    // GET /referrals/my-referrals  (authenticated)
    // Returns { total, valid, invalid, referrals[] }
    getMyReferrals: builder.query({
      query: () => '/referrals/my-referrals',
      providesTags: ['Referrals'],
    }),

    // ── ADMIN ──────────────────────────────────────────────────────────────────────────────
    // GET /users  (admin only)
    getAllUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),

    // GET /transactions  (admin only)
    getAllTransactions: builder.query({
      query: () => '/transactions',
      providesTags: ['Transactions'],
    }),

    // GET /deposit-requests  (admin only)
    getAllDepositRequests: builder.query({
      query: () => '/deposit-requests',
      providesTags: ['DepositRequests'],
    }),

    // PATCH /deposit-requests/:id/status  (admin only)
    updateDepositStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/deposit-requests/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['DepositRequests', 'Transactions', 'Wallet'],
    }),

    // PATCH /users/change-status/:id  (admin only)
    changeUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/users/change-status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['User'],
    }),

    // ── ADMIN: USERS ──────────────────────────────────────────────────────────
    // POST /users/create-admin  (super_admin only)
    createAdmin: builder.mutation({
      query: (body) => ({ url: '/users/create-admin', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),

    // PATCH /users/:id  (admin; role changes super_admin only)
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),

    // DELETE /users/:id  (admin — soft delete)
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

    // GET /activity-logs?userId=&event=&limit=  (admin)
    // Registration / login tracking: IP, device type, browser, OS
    getActivityLogs: builder.query({
      query: (params = {}) => {
        const qs = new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
        ).toString();
        return `/activity-logs${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Activity'],
    }),

    // ── ADMIN: PRODUCTS ───────────────────────────────────────────────────────
    // GET /products/admin/all  (admin) — includes inactive & out-of-stock
    getAdminProducts: builder.query({
      query: () => '/products/admin/all',
      providesTags: ['AdminProducts'],
    }),

    // POST /products/create-product  (admin) — multipart: file + data(JSON)
    createProduct: builder.mutation({
      query: ({ file, data }) => {
        const form = new FormData();
        form.append('file', file);
        form.append('data', JSON.stringify(data));
        return { url: '/products/create-product', method: 'POST', body: form };
      },
      invalidatesTags: ['AdminProducts', 'Products', 'Categories'],
    }),

    // PUT /products/:id  (admin) — price, stock, status, rewards …
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AdminProducts', 'Products'],
    }),

    // PATCH /products/:id  (admin) — soft delete
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'PATCH' }),
      invalidatesTags: ['AdminProducts', 'Products', 'Categories'],
    }),

    // POST /categories/create-category  (admin)
    createCategory: builder.mutation({
      query: (body) => ({ url: '/categories/create-category', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),

  }),
});

// ── Export all auto-generated hooks ──────────────────────────────────────────
export const {
  // Auth
  useLoginMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useForgetPasswordMutation,
  useResetPasswordMutation,
  // Users
  useCreateUserMutation,
  useGetMeQuery,
  // Categories
  useGetCategoriesQuery,
  // Products
  useGetProductsQuery,
  useGetProductByIdQuery,
  // Purchases
  usePurchaseProductMutation,
  useGetMyPurchasesQuery,
  useGetSinglePurchaseQuery,
  useClaimDailyIncomeMutation,
  useGetClaimHistoryQuery,
  // Wallets
  useGetMyWalletsQuery,
  // Profile
  useUpdateMyProfileMutation,
  // Withdrawals
  useCreateWithdrawalMutation,
  useGetMyWithdrawalsQuery,
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  // Admin activity
  useGetAdminActivityQuery,
  useGetAdminActivitySummaryQuery,
  // Deposit requests
  useCreateDepositRequestMutation,
  useGetMyDepositRequestsQuery,
  // Payment methods
  useGetPaymentMethodsQuery,
  // Payment accounts
  useCreatePaymentAccountMutation,
  useGetMyPaymentAccountsQuery,
  // Transactions
  useGetUserTransactionsQuery,
  useGetUserTransactionsByTypeQuery,
  // Tasks
  useGetTasksQuery,
  useGetTaskByIdQuery,
  // Community
  useGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useLikePostMutation,
  // Referrals
  useGetMyReferralsQuery,
  // Admin
  useGetAllUsersQuery,
  useGetAllTransactionsQuery,
  useGetAllDepositRequestsQuery,
  useUpdateDepositStatusMutation,
  useChangeUserStatusMutation,
  useCreateAdminMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetActivityLogsQuery,
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateCategoryMutation,
} = apiSlice;

// Aliases for components that use alternate hook names
export const useRegisterMutation = () => useCreateUserMutation();
export const useGetProfileQuery  = useGetMeQuery;
