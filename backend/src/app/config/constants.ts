// Business rules — all money values are in poisha (1 BDT = 100 poisha)
export const BDT = 100;

// One-time bonus credited on the user's first approved deposit
export const WELCOME_BONUS = 120 * BDT;

// Referral commission fallback (only used when a product has no teamCommissions)
export const DEFAULT_TEAM_COMMISSIONS = [
  { level: 'B', rate: 0.1, basis: 'daily-income' },
  { level: 'C', rate: 0.05, basis: 'daily-income' },
] as const;

// Membership upgrade rules: to reach `level` a user needs
// `validReferrals` valid direct referrals AND `totalSpent` of own purchases.
export const MEMBERSHIP_RULES = [
  { level: 2, validReferrals: 5, totalSpent: 15000 * BDT },
] as const;

export const MIN_DEPOSIT = 200 * BDT;
