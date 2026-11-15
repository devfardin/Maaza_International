import { roundMoney } from '@/lib/money';

// Money helpers. The backend sends amounts as plain BDT (up to 2 decimals).
// Format a BDT amount for display, e.g. 12 → "৳12.00", 14025.54 → "৳14,025.54"
export const formatBDT = (amount, { decimals = 2 } = {}) =>
  `৳${roundMoney(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

// Short date + time, e.g. "12 Nov 2026, 3:40 PM"
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
