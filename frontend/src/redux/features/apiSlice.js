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

// Cache invalidation tags — add a new tag whenever you add a new resource type
export const ALL_TAG_TYPES = [
  'User', 'Products', 'Categories', 'Wallet', 'Transactions',
  'Tasks', 'Purchases', 'DepositRequests', 'PaymentMethods',
  'PaymentAccounts', 'CommunityPosts', 'Referrals', 'Activity', 'AdminProducts',
  'Withdrawals', 'Notifications', 'AdminActivity', 'VipLevels', 'DailyCheckin',
  'News', 'AdminNews', 'Salary', 'Locations',
];

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,

  tagTypes: ALL_TAG_TYPES,

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

    // ── NEWS & UPDATES ────────────────────────────────────────────────────────
    // GET /news  (members, published posts without the body)
    getNews: builder.query({
      query: () => '/news',
      providesTags: ['News'],
    }),

    // GET /news/:id  (one post incl. HTML + CSS body)
    getNewsById: builder.query({
      query: (id) => `/news/${id}`,
      providesTags: ['News'],
    }),

    // GET /news/admin/all  (admin + super admin, drafts included)
    getAdminNews: builder.query({
      query: () => '/news/admin/all',
      providesTags: ['AdminNews'],
    }),

    // POST /news/create-news  (admin) — multipart: optional file + data(JSON)
    createNews: builder.mutation({
      query: ({ file, data }) => {
        const form = new FormData();
        if (file) form.append('file', file);
        form.append('data', JSON.stringify(data));
        return { url: '/news/create-news', method: 'POST', body: form };
      },
      invalidatesTags: ['AdminNews', 'News'],
    }),

    // PUT /news/:id  (admin) — optional new cover image + data(JSON)
    updateNews: builder.mutation({
      query: ({ id, file, data }) => {
        const form = new FormData();
        if (file) form.append('file', file);
        form.append('data', JSON.stringify(data));
        return { url: `/news/${id}`, method: 'PUT', body: form };
      },
      invalidatesTags: ['AdminNews', 'News'],
    }),

    // DELETE /news/:id  (admin) — soft delete
    deleteNews: builder.mutation({
      query: (id) => ({ url: `/news/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminNews', 'News'],
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

    // GET /product-purchases/income-summary  → { todayIncome, totalEarned } in BDT
    getIncomeSummary: builder.query({
      query: () => '/product-purchases/income-summary',
      providesTags: ['Purchases', 'Transactions'],
    }),

    // GET /product-purchases/:purchaseId  (authenticated user)
    getSinglePurchase: builder.query({
      query: (purchaseId) => `/product-purchases/${purchaseId}`,
      providesTags: ['Purchases'],
    }),

    // POST /product-purchases/:purchaseId/claim  (authenticated user)
    // Claims daily income for a purchase — credits balance wallet
    // Also credits referral commissions (level A and B) automatically
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
    // amount is in BDT (min 200, up to 2 decimals).
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
    // Returns ACTIVE payment methods only: { _id, name, code, image, description, accountNumber, accountType, instructions, isActive }
    getPaymentMethods: builder.query({
      query: () => '/payment-methods',
      providesTags: ['PaymentMethods'],
    }),

    // GET /payment-methods/admin/all  (admin + super_admin) — includes inactive methods
    getAdminPaymentMethods: builder.query({
      query: () => '/payment-methods/admin/all',
      providesTags: ['PaymentMethods'],
    }),

    // POST /payment-methods/create-payment-method  (super_admin) — multipart: file + data(JSON)
    createPaymentMethod: builder.mutation({
      query: ({ file, data }) => {
        const form = new FormData();
        if (file) form.append('file', file);
        form.append('data', JSON.stringify(data));
        return { url: '/payment-methods/create-payment-method', method: 'POST', body: form };
      },
      invalidatesTags: ['PaymentMethods'],
    }),

    // PUT /payment-methods/:id  (super_admin) — multipart: optional file + data(JSON, partial)
    updatePaymentMethod: builder.mutation({
      query: ({ id, file, data }) => {
        const form = new FormData();
        if (file) form.append('file', file);
        form.append('data', JSON.stringify(data));
        return { url: `/payment-methods/${id}`, method: 'PUT', body: form };
      },
      invalidatesTags: ['PaymentMethods'],
    }),

    // PATCH /payment-methods/toggle-status/:id  (super_admin)
    togglePaymentMethodStatus: builder.mutation({
      query: (id) => ({ url: `/payment-methods/toggle-status/${id}`, method: 'PATCH' }),
      invalidatesTags: ['PaymentMethods'],
    }),

    // DELETE /payment-methods/:id  (super_admin)
    deletePaymentMethod: builder.mutation({
      query: (id) => ({ url: `/payment-methods/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PaymentMethods'],
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

    // PATCH /payment-accounts/:id  — body: { accountNumber?, accountHolderName?, status?: 'active'|'inactive' }
    updateMyPaymentAccount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PaymentAccounts'],
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

    // ── VIP LEVELS & DAILY CHECK-IN ───────────────────────────────────────────
    // GET /vip-levels  (any logged-in user)
    // Returns [{ level: 1..8, qualifiedReferrals, minSpent (BDT), dailyCheckinBonus (BDT) }]
    getVipLevels: builder.query({
      query: () => '/vip-levels',
      providesTags: ['VipLevels'],
    }),

    // PUT /vip-levels  (admin + super_admin) — body { levels: [...8 objects] } replaces all
    updateVipLevels: builder.mutation({
      query: (body) => ({ url: '/vip-levels', method: 'PUT', body }),
      invalidatesTags: ['VipLevels', 'DailyCheckin'],
    }),

    // GET /daily-checkin/status  (user)
    // → { vipLevel (0 = no VIP), qualifiedReferrals, checkedInToday, bonusAmount (BDT), lastCheckinAt }
    getDailyCheckinStatus: builder.query({
      query: () => '/daily-checkin/status',
      providesTags: ['DailyCheckin'],
    }),

    // POST /daily-checkin  (user) → { amount (BDT), vipLevel, balanceAfter }
    // 400 "already checked in today" when repeated
    dailyCheckin: builder.mutation({
      query: () => ({ url: '/daily-checkin', method: 'POST' }),
      invalidatesTags: ['DailyCheckin', 'Wallet', 'Transactions'],
    }),

    // ── WEEKLY SALARY ─────────────────────────────────────────────────────────
    // GET /salary/status  (user) → { window: { state: 'open'|'upcoming', weekKey, opensAt, closesAt, claimHours },
    //   vipLevel, weeklySalary (BDT), eligible, claimedThisWeek, claimedAmount, canClaim, missedLastWindow,
    //   lastClaim, schedule: [{ vipLevel, weeklySalary, qualifiedReferrals, minSpent }], referral }
    getSalaryStatus: builder.query({
      query: () => '/salary/status',
      providesTags: ['Salary'],
    }),

    // POST /salary/claim  (user) → { amount (BDT), vipLevel, weekKey, balanceAfter }
    claimSalary: builder.mutation({
      query: () => ({ url: '/salary/claim', method: 'POST' }),
      invalidatesTags: ['Salary', 'Wallet', 'Transactions'],
    }),

    // ── MEMBER LOCATIONS ──────────────────────────────────────────────────────
    // GET /locations/districts  (any logged-in user) → [{ name, division }]
    getDistricts: builder.query({
      query: () => '/locations/districts',
      providesTags: ['Locations'],
    }),

    // GET /locations/summary  (admin + super_admin)
    // → { totalMembers, withLocation, withoutLocation, districts: [{ name, division, lat, lng, count }], divisions: [{ name, count }] }
    getLocationSummary: builder.query({
      query: () => '/locations/summary',
      providesTags: ['Locations'],
    }),

    // ── TASKS ─────────────────────────────────────────────────────────────────
    // GET /tasks  (public)
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),

    // POST /tasks/create-task  (admin / super admin) — body: title, description, instructions, specialNote, image, rewardAmount (৳), rewardType, startsAt, endsAt
    createTask: builder.mutation({
      query: (body) => ({ url: '/tasks/create-task', method: 'POST', body }),
      invalidatesTags: ['Tasks'],
    }),

    // POST /tasks/upload-image  (admin) — multipart field "file"; returns { url }
    uploadTaskImage: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/tasks/upload-image', method: 'POST', body };
      },
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

    // GET /community-posts/mine — my posts in any state (pending included)
    getMyCommunityPosts: builder.query({
      query: () => '/community-posts/mine',
      providesTags: ['CommunityPosts'],
    }),

    // GET /community-posts/pending — super admin approval queue
    getPendingCommunityPosts: builder.query({
      query: () => '/community-posts/pending',
      providesTags: ['CommunityPosts'],
    }),

    // PATCH /community-posts/:id/status — super admin: { status: 'approved' | 'rejected' }
    decideCommunityPost: builder.mutation({
      query: ({ id, status }) => ({ url: `/community-posts/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['CommunityPosts'],
    }),

    // PATCH /products/:id/approval — super admin: { approvalStatus: 'approved' | 'rejected' }
    decideProductApproval: builder.mutation({
      query: ({ id, approvalStatus }) => ({ url: `/products/${id}/approval`, method: 'PATCH', body: { approvalStatus } }),
      invalidatesTags: ['Products', 'AdminProducts'],
    }),

    // POST /community-posts/upload-image — multipart field "file"; returns { url } (VIP 3+)
    uploadPostImage: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/community-posts/upload-image', method: 'POST', body };
      },
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

    // GET /referrals/my-team → members with relation (A/B/C), products and earnings from them
    getMyTeam: builder.query({
      query: () => '/referrals/my-team',
      providesTags: ['Referrals'],
    }),

    // POST /users/me/avatar — multipart field "file"
    uploadMyAvatar: builder.mutation({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/users/me/avatar', method: 'POST', body };
      },
      invalidatesTags: ['User'],
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
    // GET /deposit-requests?methodCode=<code>  (admin only) — methodCode is optional
    getAllDepositRequests: builder.query({
      query: (methodCode) => (methodCode ? `/deposit-requests?methodCode=${encodeURIComponent(methodCode)}` : '/deposit-requests'),
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

    // POST /wallets/:id/exchange  (super_admin only) — move money between a member's wallets
    exchangeUserWallets: builder.mutation({
      query: ({ id, from, to, amount }) => ({
        url: `/wallets/${id}/exchange`,
        method: 'POST',
        body: { from, to, amount },
      }),
      invalidatesTags: ['User', 'Wallet', 'Transactions'],
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
        if (file) form.append('file', file);
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

    // GET /admin-dashboard/member-wallets  (super_admin only)
    // → { members: [{ _id, fullName, phone, status, balanceWallet, rechargeWallet }], totals: { balanceWallet, rechargeWallet } }
    getMemberWallets: builder.query({
      query: () => '/admin-dashboard/member-wallets',
      providesTags: ['Wallet', 'User'],
    }),

    // GET /admin-dashboard/my-handled  (admin + super_admin)
    // → { today: summary, allTime: summary }, summary = { deposits: { accepted, rejected }, withdrawals: { paid, rejected }, totalRequests }
    getMyHandled: builder.query({
      query: () => '/admin-dashboard/my-handled',
      providesTags: ['DepositRequests', 'Withdrawals', 'Wallet'],
    }),

    // GET /admin-dashboard/stats  (admin) → { totalUsers, totalDeposits, totalWithdrawals, pendingDeposits, pendingWithdrawals, ... } in BDT
    getAdminDashboardStats: builder.query({
      query: () => '/admin-dashboard/stats',
      providesTags: ['Notifications', 'DepositRequests', 'Withdrawals', 'User', 'Transactions', 'Wallet'],
    }),

    // DELETE /categories/:id  (super admin only)
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

  }),
});

// ── Export all auto-generated hooks ──────────────────────────────────────────
export const {
  useGetNewsQuery,
  useGetNewsByIdQuery,
  useGetAdminNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
  useGetMyCommunityPostsQuery,
  useGetPendingCommunityPostsQuery,
  useDecideCommunityPostMutation,
  useDecideProductApprovalMutation,
  useCreateTaskMutation,
  useUploadTaskImageMutation,
  useGetAdminDashboardStatsQuery,
  useGetMemberWalletsQuery,
  useGetMyHandledQuery,
  useDeleteCategoryMutation,
  useUploadPostImageMutation,
  useGetIncomeSummaryQuery,
  useUpdateMyPaymentAccountMutation,
  useGetMyTeamQuery,
  useUploadMyAvatarMutation,
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
  useGetAdminPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useTogglePaymentMethodStatusMutation,
  useDeletePaymentMethodMutation,
  // VIP & daily check-in
  useGetVipLevelsQuery,
  useUpdateVipLevelsMutation,
  useGetDailyCheckinStatusQuery,
  useDailyCheckinMutation,
  // Weekly salary & member locations
  useGetSalaryStatusQuery,
  useClaimSalaryMutation,
  useGetDistrictsQuery,
  useGetLocationSummaryQuery,
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
  useExchangeUserWalletsMutation,
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
