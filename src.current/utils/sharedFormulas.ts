// SHARED FORMULA UTILITIES
// Single source of truth — replaces duplicates in FinalSettlementFormula.ts and MaternityFormula.ts
//
// INTENTIONAL DIVISOR DIFFERENCE (not a bug):
//   CALENDAR_MONTH_DAYS = 30  — Final Settlement (calendar days, BLA termination provisions)
//   WORKING_DAYS_PER_MONTH = 26 — Maternity Benefit (working days, BLA maternity provisions)
//
// The two modules intentionally use different legal bases for computing daily wage.

export const CALENDAR_MONTH_DAYS = 30;
export const WORKING_DAYS_PER_MONTH = 26;

// ── Basic salary & overtime ──────────────────────────────────────────────────
// CONSOLIDATED (audit): 'basic = (gross - allowances) / 1.5' and the 208-hour/
// 2x overtime formula previously had THREE independent copies —
// FinalSettlementFormula.ts, employeePersonalFile/employee.types.ts, and
// components/workerGuideline/CalculatorHub.tsx (x2) — all using the same
// numbers, plus a FOURTH, WRONG copy in incrementBill/dataType.ts that
// hardcoded a fixed "- 2450" instead of subtracting the real allowance sum.
//
// The divisor/hours/multiplier are exposed as parameters with today's values
// as defaults specifically so a future factory with a different CBA/policy
// can pass its own values without anyone needing to edit this function or
// risk changing every other factory's numbers.
export const DEFAULT_BASIC_DIVISOR = 1.5;
export const DEFAULT_HOUSE_RENT_PERCENTAGE = 0.5;
export const DEFAULT_OT_HOURS_PER_MONTH = 208;
// Standard 30-day month used for simple monthly→daily rate conversions
// (e.g. Miscellaneous Bill's Holiday/Festival Holiday payable amount).
// Distinct from SALARY_MONTHLY_DAYS() below, which returns the ACTUAL
// day count of a specific calendar month — this is the flat convention
// used when there's no specific month context (a bill's date isn't
// "which month's salary", just an event date).
export const DEFAULT_MONTHLY_DAYS = 30;
export const DEFAULT_OT_MULTIPLIER = 2;

// Default food/medical/transport allowances — used ONLY as a fallback when
// a caller doesn't have real allowance data (passes 0/undefined). Any
// caller with real figures (food+medical+transport actually known) should
// keep passing that real sum — this fallback exists so "no data available"
// doesn't silently become "zero allowances" (which understates Basic).
export const DEFAULT_FOOD_ALLOWANCE      = 1250;
export const DEFAULT_MEDICAL_ALLOWANCE   = 750;
export const DEFAULT_TRANSPORT_ALLOWANCE = 450;
export const DEFAULT_TOTAL_ALLOWANCES    = DEFAULT_FOOD_ALLOWANCE + DEFAULT_MEDICAL_ALLOWANCE + DEFAULT_TRANSPORT_ALLOWANCE; // 2450

/**
 * Derives basic salary from gross salary and allowances.
 * basic = (gross - (food + medical + transport)) / divisor
 * divisor defaults to 1.5 (Basic + House Rent(50% of basic) = 1.5x basic,
 * the standard split most Bangladesh RMG factories use).
 *
 * allowances fallback: if a caller doesn't have real allowance data and
 * passes 0 (or omits it), this uses DEFAULT_TOTAL_ALLOWANCES (2450 =
 * 1250+750+450) instead of silently treating "unknown" as "zero" — a
 * caller WITH real figures should keep passing that actual sum, which is
 * used as-is (this fallback only kicks in when allowances is falsy).
 */
export function calculateBasicFromGross(
  gross: number,
  allowances: number,
  divisor: number = DEFAULT_BASIC_DIVISOR,
): number {
  if (gross <= 0) return 0;
  const effectiveAllowances = allowances || DEFAULT_TOTAL_ALLOWANCES;
  return (gross - effectiveAllowances) / divisor;
}

/**
 * Hourly overtime rate from basic salary.
 * rate = (basic / hoursPerMonth) * multiplier — defaults to 208 hours
 * (26 days x 8 hours) and 2x, per the Bangladesh Labour Act.
 */
export function calculateHourlyOvertimeRate(
  basic: number,
  hoursPerMonth: number = DEFAULT_OT_HOURS_PER_MONTH,
  multiplier: number = DEFAULT_OT_MULTIPLIER,
): number {
  if (basic <= 0) return 0;
  return (basic / hoursPerMonth) * multiplier;
}

/**
 * Earned leave amount — a simple days × দৈনিক মজুরি calculation.
 * CONSOLIDATED: previously existed as two independent copies —
 * FinalSettlementFormula.ts's calculateEarnedLeave(elQty, dailyGross) and
 * (about to be) MaternityFormula.ts's own version — same formula, same
 * two parameters, computed separately in each module. Both now delegate
 * to this one implementation.
 */
export function calculateEarnedLeaveAmount(days: number, dailyGross: number): number {
  return days * dailyGross;
}

export const SALARY_MONTH_DAYS: Record<string, number | ((year: number) => number)> = {
  "জানুয়ারি":  31,
  "ফেব্রুয়ারি": (year: number) =>
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
  "মার্চ":      31,
  "এপ্রিল":     30,
  "মে":         31,
  "জুন":        30,
  "জুলাই":      31,
  "আগস্ট":      31,
  "সেপ্টেম্বর": 30,
  "অক্টোবর":   31,
  "নভেম্বর":   30,
  "ডিসেম্বর":  31,
};

export function SALARY_MONTHLY_DAYS(month: string, year: number): number {
  const value = SALARY_MONTH_DAYS[month];
  if (!value) return 30;
  return typeof value === "function" ? value(year) : value;
}

/**
 * Calculates service duration between two ISO date strings.
 * Defensive: returns all-zero on partial, invalid, or reversed dates.
 * Replaces calculateServiceDuration() in FinalSettlementFormula.ts
 * and MaternityFormula.calculateServiceDuration() in MaternityFormula.ts
 *
 * @param startDate - Joining date (YYYY-MM-DD)
 * @param endDate   - Last attendance / delivery date (YYYY-MM-DD)
 */
export function calculateServiceDuration(
  startDate: string,
  endDate: string,
): { years: number; months: number; days: number } {
  if (!startDate || !endDate) return { years: 0, months: 0, days: 0 };
  const sp = startDate.split("-");
  const ep = endDate.split("-");
  if (sp.length !== 3 || sp.some(p => !p) || ep.length !== 3 || ep.some(p => !p)) {
    return { years: 0, months: 0, days: 0 };
  }
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { years: 0, months: 0, days: 0 };
  }
  let years  = end.getFullYear() - start.getFullYear();
  let months = end.getMonth()    - start.getMonth();
  let days   = end.getDate()     - start.getDate();
  if (days < 0) { months--; const p = new Date(end.getFullYear(), end.getMonth(), 0); days += p.getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days };
}

export const STATIC_DATAA = {

  bengaliMonths: [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ],
  en_years: Array.from(
    { length: 2026 - 2019 + 1 },
    (_, i) => String(2019+ i)
  ),
  // benefitInstallments: [
  //   { value: 'প্রথম কিস্তি', label: 'প্রথম কিস্তি' },
  //   { value: 'দ্বিতীয় কিস্তি', label: 'দ্বিতীয় কিস্তি' },
  // ],
  benefitTypes: [
    { value: 'দিন', label: 'দিন' },
    { value: 'টাকা', label: 'টাকা' },
  ],
};

// ── Regulatory-bundle-aware wrappers ─────────────────────────────────────────
// ADDITIVE ONLY — every function above this point, and its existing default
// parameter values, is UNCHANGED. These wrappers are a NEW, OPTIONAL way to
// call the same underlying functions using a resolved RegulatoryBundle
// (RMG/EPZ, see src/regulatory/regulatoryBundles.ts) instead of the
// hardcoded RMG defaults — existing call sites that don't use these
// wrappers keep behaving exactly as before.
//
// A bundle field being `null` (i.e. not yet verified for that industry —
// currently true for most EPZ fields) makes these throw rather than
// silently falling back to a guessed number or the RMG figure. Calling
// code should catch this and prompt for configuration, not swallow it.
import type { RegulatoryBundle } from '../regulatory/regulatoryBundles';

function requireField(bundle: RegulatoryBundle, field: keyof RegulatoryBundle): number {
  const value = bundle[field];
  if (value === null || value === undefined || typeof value !== 'number') {
    throw new Error(
      `Regulatory bundle "${bundle.id}" has no verified value for "${String(field)}" — ` +
      `this needs to be confirmed with a labour-law professional before it can be used ` +
      `for calculations. See regulatoryBundles.ts's verificationNote for what's still missing.`
    );
  }
  return value;
}

/** Bundle-aware version of calculateBasicFromGross(). */
export function calculateBasicFromGrossForBundle(
  gross: number,
  allowances: number,
  bundle: RegulatoryBundle,
): number {
  const divisor = requireField(bundle, 'basicDivisor');
  return calculateBasicFromGross(gross, allowances, divisor);
}

/** Bundle-aware version of calculateHourlyOvertimeRate(). */
export function calculateHourlyOvertimeRateForBundle(
  basic: number,
  bundle: RegulatoryBundle,
): number {
  const hours = requireField(bundle, 'otHoursPerMonth');
  const multiplier = requireField(bundle, 'otMultiplier');
  return calculateHourlyOvertimeRate(basic, hours, multiplier);
}

/**
 * Resolves the default food+medical+transport allowance sum for a bundle —
 * for use where calculateBasicFromGrossForBundle's caller doesn't have a
 * real allowance figure and needs the bundle's own fallback instead of the
 * RMG-hardcoded DEFAULT_TOTAL_ALLOWANCES.
 */
export function getDefaultAllowanceSumForBundle(bundle: RegulatoryBundle): number {
  const food      = requireField(bundle, 'foodAllowance');
  const medical    = requireField(bundle, 'medicalAllowance');
  const transport  = requireField(bundle, 'transportAllowance');
  return food + medical + transport;
}