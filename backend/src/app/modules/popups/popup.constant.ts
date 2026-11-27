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

// How often a member sees a popup again after the first time
// once = only once ever · daily = once per Bangladesh calendar day · every_n_days = once every N days
// every_login = once per login (browser session)
export const POPUP_FREQUENCIES = ['once', 'daily', 'every_n_days', 'every_login'] as const;
export type TPopupFrequency = (typeof POPUP_FREQUENCIES)[number];
