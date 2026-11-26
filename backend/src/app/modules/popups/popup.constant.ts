// Member dashboard pages a popup can be shown on. Keys match the dashboard URL
// segment: /dashboard/<key>. Keep in sync with frontend/src/lib/popupPages.js.
export const POPUP_PAGES = [
    'home',
    'me',
    'products',
    'purchased',
    'tasks',
    'salary',
    'community',
    'news',
    'recharge',
    'withdraw',
    'transactions',
    'bank',
    'referrals',
    'profile',
] as const;

export type TPopupPage = (typeof POPUP_PAGES)[number];
