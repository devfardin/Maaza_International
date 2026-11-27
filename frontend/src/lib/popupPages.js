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

// Membership levels: 1 = member, 2..9 = VIP 1..8 (see backend user.model.ts)
export const levelLabel = (n) => (n <= 1 ? 'Member' : `VIP ${n - 1}`);
export const LEVEL_OPTIONS = Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: levelLabel(i + 1) }));

// Short text for the admin card: who sees this popup
export function audienceSummary(a) {
  if (!a) return ['Everyone'];
  const parts = [];
  const min = a.minLevel ?? 1;
  const max = a.maxLevel ?? 9;
  if (min > 1 || max < 9) parts.push(min === max ? levelLabel(min) : `${levelLabel(min)} – ${levelLabel(max)}`);
  if (a.districts?.length) parts.push(a.districts.length <= 3 ? a.districts.join(', ') : `${a.districts.length} districts`);
  const day = (d) => String(d).slice(0, 10);
  if (a.joinedFrom || a.joinedTo) {
    const from = a.joinedFrom ? `from ${day(a.joinedFrom)}` : '';
    const to = a.joinedTo ? `to ${day(a.joinedTo)}` : '';
    parts.push(`Joined ${[from, to].filter(Boolean).join(' ')}`);
  }
  return parts.length ? parts : ['Everyone'];
}

// How often the member sees the popup again
export const FREQUENCY_OPTIONS = [
  { value: 'every_login', label: 'Every login', hint: 'Once each time the member logs in (new browser session)' },
  { value: 'daily', label: 'Once a day', hint: 'Set how many times per day, and how many visits to wait between shows' },
  { value: 'every_n_days', label: 'Every N days', hint: 'Show again only after the number of days you set has passed' },
  { value: 'once', label: 'Only once', hint: 'Once ever, then never again for that member' },
];

export const frequencyLabel = (value, intervalDays) => {
  if (value === 'every_n_days') return `Every ${intervalDays || 1} day${intervalDays === 1 ? '' : 's'}`;
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? 'Every login';
};

// Card text, e.g. "Every login · from visit 3 · max 5 per member"
export const showingSummary = (p) => {
  const parts = [];
  const from = p.minPageVisits ? `from visit ${p.minPageVisits}` : null;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (p.frequency === 'daily') {
    parts.push(`${plural(p.maxViewsPerDay || 1, 'time')} a day`);
    if (p.visitsBetweenShows) parts.push(`skip ${plural(p.visitsBetweenShows, 'visit')} between shows`);
    if (from) parts.push(from);
    if (p.maxViews) parts.push(`max ${plural(p.maxViews, 'time')} in total`);
  } else if (p.frequency === 'once') {
    parts.push('Only once');
    if (from) parts.push(from);
  } else if (p.frequency === 'every_n_days') {
    parts.push(`every ${plural(p.intervalDays || 1, 'day')}`);
    if (from) parts.push(from);
    if (p.maxViews) parts.push(`max ${plural(p.maxViews, 'time')} per member`);
  } else {
    parts.push('Every login');
    if (from) parts.push(from);
    if (p.maxViews) parts.push(`max ${plural(p.maxViews, 'time')} per member`);
  }
  return parts.join(' · ');
};
