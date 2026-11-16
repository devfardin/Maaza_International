// ─────────────────────────────────────────────────────────────────────────────
// Weekly salary claim window.
// Every Monday from SALARY_CLAIM_START_HOUR to SALARY_CLAIM_END_HOUR in Bangladesh time.
// Bangladesh has no DST, so a fixed offset is exact. All math is done in "local" wall-clock
// milliseconds (a UTC Date that holds the Bangladesh clock reading) and converted back.
// ─────────────────────────────────────────────────────────────────────────────
import { SALARY_CLAIM_END_HOUR, SALARY_CLAIM_START_HOUR, SALARY_TIMEZONE_OFFSET_HOURS } from '../../config/constants';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const OFFSET_MS = SALARY_TIMEZONE_OFFSET_HOURS * HOUR_MS;

// Monday 00:00 (Bangladesh wall clock) of the week containing `ms`, as local-clock ms
const localMondayMs = (ms: number) => {
    const local = new Date(ms + OFFSET_MS);
    const daysSinceMonday = (local.getUTCDay() + 6) % 7; // Sunday = 0 → 6
    return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysSinceMonday);
};

// Local wall-clock (Monday midnight + hour) → real instant
const instantAt = (localMidnightMs: number, hour: number) => new Date(localMidnightMs + hour * HOUR_MS - OFFSET_MS);

// Week key = the Monday's date in Bangladesh time, 'YYYY-MM-DD'
const weekKeyOf = (localMidnight: number) => new Date(localMidnight).toISOString().slice(0, 10);

export type TSalaryWindow = {
    state: 'open' | 'upcoming';  // open = claims allowed right now
    weekKey: string;             // the Monday this window belongs to
    opensAt: Date;
    closesAt: Date;
    // the most recent window that has already closed (null on a brand-new system)
    lastWeekKey: string;
    lastClosedAt: Date;
};

// Which window matters right now: this week's if it has not closed yet, otherwise next Monday's
export const getSalaryWindow = (now: Date = new Date()): TSalaryWindow => {
    const ms = now.getTime();
    const monday = localMondayMs(ms);
    const thisOpen = instantAt(monday, SALARY_CLAIM_START_HOUR);
    const thisClose = instantAt(monday, SALARY_CLAIM_END_HOUR);
    const previousMonday = monday - 7 * DAY_MS;
    const previousClose = instantAt(previousMonday, SALARY_CLAIM_END_HOUR);

    if (ms < thisClose.getTime()) {
        return {
            state: ms >= thisOpen.getTime() ? 'open' : 'upcoming',
            weekKey: weekKeyOf(monday),
            opensAt: thisOpen,
            closesAt: thisClose,
            lastWeekKey: weekKeyOf(previousMonday),
            lastClosedAt: previousClose,
        };
    }

    const nextMonday = monday + 7 * DAY_MS;
    return {
        state: 'upcoming',
        weekKey: weekKeyOf(nextMonday),
        opensAt: instantAt(nextMonday, SALARY_CLAIM_START_HOUR),
        closesAt: instantAt(nextMonday, SALARY_CLAIM_END_HOUR),
        lastWeekKey: weekKeyOf(monday),
        lastClosedAt: thisClose,
    };
};
