// ─────────────────────────────────────────────────────────────────────────────
// businessDays.ts — business-day-aware date math (skips Friday + festival
// holidays), for deadline calculations like Disciplinary Action's
// investigation timeline.
// Path: src/utils/businessDays.ts
//
// Bangladesh's weekly holiday is Friday (day 5, 0=Sunday) — this is fixed
// and doesn't change. Festival holidays (Eid, Puja, etc.) shift every year
// and have NO reliable auto-source, so they're passed in as an explicit
// list (typically FactoryConfig.festivalHolidays) rather than hardcoded —
// starts empty, factory fills in actual dates as they become known.
// ─────────────────────────────────────────────────────────────────────────────

/** Bangladesh's weekly holiday — Friday. JS Date.getDay(): 0=Sun..6=Sat. */
const WEEKLY_HOLIDAY_DAY = 5;

function isYMD(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/** True if the given date (YYYY-MM-DD) is Friday or in the festival holiday list. */
export function isNonBusinessDay(dateStr: string, festivalHolidays: string[] = []): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  if (date.getDay() === WEEKLY_HOLIDAY_DAY) return true;
  return festivalHolidays.some(h => isYMD(h) && h === dateStr);
}

/**
 * Adds `days` CALENDAR days to `startDate`, then keeps advancing one day
 * at a time past any non-business day (Friday or festival holiday) until
 * landing on an actual business day. This matches "the deadline is N days
 * out, but if that lands on a holiday, push to the next working day" —
 * not "count only N business days" (a different, stricter calculation
 * that wasn't what was asked for).
 */
export function addDaysSkippingHolidays(startDate: string, days: number, festivalHolidays: string[] = []): string {
  if (!startDate) return '';
  const base = new Date(startDate);
  if (isNaN(base.getTime())) return '';
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  while (isNonBusinessDay(result.toISOString().split('T')[0], festivalHolidays)) {
    result.setDate(result.getDate() + 1);
  }
  return result.toISOString().split('T')[0];
}
