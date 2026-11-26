// Member dashboard pages a popup can be shown on.
// Keys must match backend/src/app/modules/popups/popup.constant.ts (URL: /dashboard/<key>).
export const POPUP_PAGE_OPTIONS = [
  { key: 'home', label: 'Home' },
  { key: 'me', label: 'Me' },
  { key: 'products', label: 'Products' },
  { key: 'purchased', label: 'My products' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'salary', label: 'Salary' },
  { key: 'community', label: 'Community' },
  { key: 'news', label: 'News & updates' },
  { key: 'recharge', label: 'Recharge' },
  { key: 'withdraw', label: 'Withdrawals' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'bank', label: 'Bank / payout' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'profile', label: 'Profile' },
];

export const pageLabel = (key) => POPUP_PAGE_OPTIONS.find((p) => p.key === key)?.label ?? key;
