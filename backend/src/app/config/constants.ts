// Business rules — money values are in BDT (e.g. 120, 12.50)

// One-time bonus credited on the user's first approved deposit
export const WELCOME_BONUS = 120;

// Referral commission fallback (only used when a product has no teamCommissions)
export const DEFAULT_TEAM_COMMISSIONS = [
  { level: 'A', rate: 0.1, basis: 'daily-income' },
  { level: 'B', rate: 0.05, basis: 'daily-income' },
] as const;

// VIP ladder — seeded into the database on first use and then managed from the admin dashboard.
// membershipLevel IS the VIP level. Every new member starts at VIP 1 (BASE_VIP_LEVEL); VIP 1 needs nothing.
// qualifiedReferrals = valid referrals needed to reach the VIP level.
// dailyCheckinBonus is paid per daily check-in (BDT).
// Everyone starts at this VIP level when they register
export const BASE_VIP_LEVEL = 1;

export const DEFAULT_VIP_LEVELS = [
  { level: 1, qualifiedReferrals: 0, minSpent: 0, dailyCheckinBonus: 3 },
  { level: 2, qualifiedReferrals: 10, minSpent: 0, dailyCheckinBonus: 15 },
  { level: 3, qualifiedReferrals: 15, minSpent: 0, dailyCheckinBonus: 0 },
  { level: 4, qualifiedReferrals: 30, minSpent: 0, dailyCheckinBonus: 0 },
  { level: 5, qualifiedReferrals: 50, minSpent: 0, dailyCheckinBonus: 0 },
  { level: 6, qualifiedReferrals: 100, minSpent: 0, dailyCheckinBonus: 0 },
  { level: 7, qualifiedReferrals: 200, minSpent: 0, dailyCheckinBonus: 0 },
  { level: 8, qualifiedReferrals: 500, minSpent: 0, dailyCheckinBonus: 0 },
] as const;

export const MIN_DEPOSIT = 200;

// Withdrawals: minimum request, and the processing + tax fee taken from each withdrawal (percent of the amount)
export const MIN_WITHDRAWAL = 120;
export const WITHDRAWAL_FEE_PERCENT = 9.5;

// Community: members at this VIP level (or higher) can create posts
export const COMMUNITY_POST_MIN_VIP = 3;

// Default product claim cadence: the user can claim every 2 days.
export const DEFAULT_CLAIM_INTERVAL_DAYS = 2;

// ── Weekly salary ─────────────────────────────────────────────────────────────
// Seeded into the VIP ladder (weeklySalary per VIP level, BDT). Changed from the super admin dashboard.
export const DEFAULT_WEEKLY_SALARIES: Readonly<Record<number, number>> = {
  4: 3000,
  5: 6000,
  6: 13000,
  7: 26000,
  8: 52000,
};

// Claim window: every Monday, from 10:00 to 22:00 in Bangladesh time (Asia/Dhaka, UTC+6, no DST).
export const SALARY_TIMEZONE_OFFSET_HOURS = 6;
export const SALARY_CLAIM_START_HOUR = 10;
export const SALARY_CLAIM_END_HOUR = 22;
