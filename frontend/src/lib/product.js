// src/lib/product.js
// ─────────────────────────────────────────────────────────────────────────────
// Product maths shared by the product details modal and the My Products page.
// All money is plain BDT (up to 2 decimals); the helpers return BDT rounded to paisa.
// ─────────────────────────────────────────────────────────────────────────────
import { floorMoney } from '@/lib/money';

const DAY_MS = 24 * 60 * 60 * 1000;

// Products added within this many days show the "NEW" badge
export const NEW_PRODUCT_DAYS = 14;

// Team commission (A and B) is a share of the buyer's daily income, so the calculation
// always uses the daily income: daily income × rate × validity days.
export function perDayBase(product) {
  return product?.rewardPlan?.dailyIncome || 0;
}

// Team commission for one level across the whole validity period
export function teamEarningFor(rule, product) {
  const days = Math.max(product?.rewardPlan?.validityDays || 1, 1);
  return floorMoney(perDayBase(product) * (rule.rate || 0) * days);
}

// "Every 1 day", "Every 2 days", ... (days only)
export function claimLabel(intervalDays) {
  const n = Number(intervalDays) || 1;
  return n === 1 ? 'Every 1 day' : `Every ${n} days`;
}

// Interval in hours for a product (rewardPlan) or a purchase (claimEveryHours).
export function claimEveryHoursOf(p) {
  if (p?.claimEveryHours) return Math.max(Number(p.claimEveryHours), 1);
  if (p?.claimUnit === 'hour') return Math.max(Number(p.claimIntervalHours) || 1, 1);
  const days = Number(p?.claimIntervalDays) || (p?.claimIntervalHours ? Number(p.claimIntervalHours) / 24 : 1);
  return Math.max(days, 1) * 24;
}

// "Every 1 hour", "Every 6 hours", "Every 1 day", "Every 2 days"
export function claimScheduleLabel(p) {
  const hours = claimEveryHoursOf(p);
  if (hours < 24) return hours === 1 ? 'Every 1 hour' : `Every ${hours} hours`;
  return claimLabel(hours / 24);
}

// Income for one claim (BDT): daily income pro-rated to the claim interval.
export function incomePerClaim(p, dailyIncome) {
  return floorMoney(((dailyIncome || 0) * claimEveryHoursOf(p)) / 24);
}

export function isNewProduct(product) {
  if (!product?.createdAt) return false;
  return Date.now() - new Date(product.createdAt).getTime() < NEW_PRODUCT_DAYS * DAY_MS;
}

// Percentage text: 0.12 → "12%", 0.105 → "10.5%"
export function ratePercent(rate) {
  return `${(Number(rate || 0) * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}
