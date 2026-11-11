// Money helpers. The backend stores every amount in poisha (1 BDT = 100 poisha).
export const bdtFromPoisha = (poisha) => (Number(poisha) || 0) / 100;

export const formatBDT = (poisha, { decimals = 2 } = {}) =>
  `৳${bdtFromPoisha(poisha).toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

// Short date + time, e.g. "12 Nov 2026, 3:40 PM"
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
