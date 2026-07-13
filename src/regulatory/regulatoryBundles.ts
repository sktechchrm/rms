// ─────────────────────────────────────────────────────────────────────────────
// regulatoryBundles.ts — "which labour-law regime applies to this factory"
// Path: src/regulatory/regulatoryBundles.ts
//
// Every wage-law-derived constant identified in the calculation checklist
// (sharedFormulas.ts's 5 root constants, Final Settlement's termination/
// gratuity day-rate table, Maternity's leave/eligibility constants) lives
// here as DATA, not hardcoded inside calculation functions — so adding a
// new industry/regime later means adding a new bundle object, not editing
// formulas scattered across the codebase.
//
// Selected PER FACTORY at "registration" time (i.e. in that factory's own
// config file under src/factories/, e.g. MgShirtex.ts) via the
// `regulatoryBundle` field on FactoryConfig — not a live per-user toggle.
//
// ── HONESTY ABOUT WHAT'S VERIFIED AND WHAT ISN'T ──────────────────────────
// RMG_BUNDLE: every figure here was already in active use elsewhere in this
// codebase, cross-checked against the 2023 RMG minimum-wage gazette and the
// Bangladesh Labour Act 2006 sections cited in FinalSettlementFormula.ts
// and MaternityBenefitTypes.ts throughout this project's development.
//
// EPZ_BUNDLE: built from a web search specifically for this feature. Only
// the fields explicitly confirmed there are filled in (overtime multiplier,
// weekly-hours cap, maternity leave duration matching BLA's 8+8 week
// structure). Everything else — EPZ's own gratuity/termination
// compensation day-rates, EPZ Minimum Wage Board figures, EPZ allowance
// breakdown — was NOT found with enough confidence to state as fact, and
// is left as `null` with `needsVerification: true`. DO NOT silently
// replace these nulls with guessed numbers or copies of the RMG figures —
// get them from a labour-law professional or the official EPZ Minimum Wage
// Board gazette first. A calculation reading a null field should refuse to
// compute and prompt for configuration, not fall back silently.
// ─────────────────────────────────────────────────────────────────────────────

export type IndustryBundleId = 'RMG' | 'EPZ';

export interface RegulatoryBundle {
  id: IndustryBundleId;
  label: string;
  labelBn: string;
  legalBasis: string;
  verified: boolean;
  verificationNote: string;

  // ── Wage-component constants (sharedFormulas.ts's 5 root constants) ─────
  /** gross → basic conversion: basic = (gross - allowances) / basicDivisor */
  basicDivisor: number | null;
  /** house rent as a fraction of basic (e.g. 0.5 = 50%) */
  houseRentPercentage: number | null;
  foodAllowance: number | null;
  medicalAllowance: number | null;
  transportAllowance: number | null;
  /** standard monthly overtime-rate hours (e.g. 208 = 26 days x 8 hours) */
  otHoursPerMonth: number | null;
  otMultiplier: number | null;
  /** daily-wage divisor used for calendar-day-based calculations (Final Settlement) */
  calendarMonthDays: number | null;
  /** daily-wage divisor used for working-day-based calculations (Maternity, Employee File) */
  workingDaysPerMonth: number | null;
  /** maximum ordinary weekly working hours */
  maxWeeklyHours: number | null;
  /** maximum average weekly hours including overtime, averaged over a year */
  maxAvgWeeklyHoursWithOT: number | null;

  // ── Final Settlement — termination/gratuity day-rate table ──────────────
  gratuityDaysUpToThreshold: number | null;
  gratuityDaysAboveThreshold: number | null;
  gratuityYearsThreshold: number | null;
  resignationDaysAt3Years: number | null;
  resignationDaysBetween3And10Years: number | null;
  resignationDaysAt10PlusYears: number | null;
  thirtyDayCompensationDaysPerYear: number | null;
  fifteenDayCompensationDaysPerYear: number | null;
  layOffBasicRateFraction: number | null;
  deathCompensationNormalDaysPerYear: number | null;
  deathCompensationAccidentDaysPerYear: number | null;

  // ── Maternity Benefit ─────────────────────────────────────────────────────
  maternityLeaveDaysTotal: number | null;
  maternityPreDeliveryDays: number | null;
  maternityEligibilityMonths: number | null;
  maternityEligibilityAliveChildrenMax: number | null;
}

// ── RMG (Non-EPZ) — Bangladesh Labour Act 2006, as amended ─────────────────
export const RMG_BUNDLE: RegulatoryBundle = {
  id: 'RMG',
  label: 'RMG (Non-EPZ)',
  labelBn: 'আরএমজি (নন-ইপিজেড)',
  legalBasis: 'Bangladesh Labour Act, 2006 (as amended) — mainland/DIFE-covered factories',
  verified: true,
  verificationNote: 'All figures already in active use elsewhere in this codebase; cross-checked against the 2023 RMG minimum-wage gazette and the specific BLA sections cited in FinalSettlementFormula.ts / MaternityBenefitTypes.ts.',

  basicDivisor: 1.5,
  houseRentPercentage: 0.5,
  foodAllowance: 1250,
  medicalAllowance: 750,
  transportAllowance: 450,
  otHoursPerMonth: 208,
  otMultiplier: 2,
  calendarMonthDays: 30,
  workingDaysPerMonth: 26,
  maxWeeklyHours: 48,
  maxAvgWeeklyHoursWithOT: 56,

  gratuityDaysUpToThreshold: 30,
  gratuityDaysAboveThreshold: 45,
  gratuityYearsThreshold: 10,
  resignationDaysAt3Years: 7,
  resignationDaysBetween3And10Years: 15,
  resignationDaysAt10PlusYears: 30,
  thirtyDayCompensationDaysPerYear: 30,
  fifteenDayCompensationDaysPerYear: 15,
  layOffBasicRateFraction: 0.5,
  deathCompensationNormalDaysPerYear: 30,
  deathCompensationAccidentDaysPerYear: 45,

  maternityLeaveDaysTotal: 120,
  maternityPreDeliveryDays: 60,
  maternityEligibilityMonths: 6,
  maternityEligibilityAliveChildrenMax: 1,
};

// ── EPZ — Bangladesh EPZ Labour Act, 2019 (Act No. II of 2019) ─────────────
export const EPZ_BUNDLE: RegulatoryBundle = {
  id: 'EPZ',
  label: 'EPZ',
  labelBn: 'ইপিজেড',
  legalBasis: 'Bangladesh EPZ Labour Act, 2019 + Bangladesh EPZ Labour Rules, 2022 — BEPZA-administered zones',
  verified: false,
  verificationNote: 'PARTIALLY VERIFIED ONLY. Confirmed via web search: overtime multiplier (2x, same as BLA — EPZ Act s.40 vs BLA s.102 explicitly compared as parallel provisions), weekly hours cap (48/56avg, same as BLA), maternity leave structure (8 weeks pre + 8 weeks post, per EPZ Act Chapter 3). NOT FOUND with enough confidence to state as fact: EPZ-specific gratuity/termination compensation day-rates, EPZ Minimum Wage Board figures (a SEPARATE board from the general Minimum Wage Board — confirmed to exist, figures not found), EPZ allowance breakdown. These are left null deliberately — do not fill with guesses or RMG copies. Consult a labour-law professional or the official EPZ Minimum Wage Board gazette before using this bundle for live payroll.',

  basicDivisor: null,
  houseRentPercentage: null,
  foodAllowance: null,
  medicalAllowance: null,
  transportAllowance: null,
  otHoursPerMonth: 208, // same 26-day/8-hour basis implied by the same OT provision structure
  otMultiplier: 2,      // confirmed — EPZ Act s.40 mirrors BLA s.102's 2x rate
  calendarMonthDays: 30,     // standard calendar convention, not law-specific either way
  workingDaysPerMonth: null, // NOT confirmed for EPZ specifically
  maxWeeklyHours: 48,           // confirmed
  maxAvgWeeklyHoursWithOT: 56,  // confirmed

  gratuityDaysUpToThreshold: null,
  gratuityDaysAboveThreshold: null,
  gratuityYearsThreshold: null,
  resignationDaysAt3Years: null,
  resignationDaysBetween3And10Years: null,
  resignationDaysAt10PlusYears: null,
  thirtyDayCompensationDaysPerYear: null,
  fifteenDayCompensationDaysPerYear: null,
  layOffBasicRateFraction: null,
  deathCompensationNormalDaysPerYear: null,
  deathCompensationAccidentDaysPerYear: null,

  // 8 weeks pre + 8 weeks post = 112 days — NOTE this is 8 days short of
  // RMG's 120-day figure (60+60). Flagging rather than silently rounding:
  // confirm whether "8 weeks" in the source material is being used loosely
  // or is a genuine, intentional difference from BLA's 120-day RMG figure
  // before relying on this for live payroll.
  maternityLeaveDaysTotal: 112,
  maternityPreDeliveryDays: 56,
  maternityEligibilityMonths: null,
  maternityEligibilityAliveChildrenMax: null,
};

export const REGULATORY_BUNDLES: Record<IndustryBundleId, RegulatoryBundle> = {
  RMG: RMG_BUNDLE,
  EPZ: EPZ_BUNDLE,
};

export const REGULATORY_BUNDLE_OPTIONS: { value: IndustryBundleId; label: string }[] = [
  { value: 'RMG', label: RMG_BUNDLE.label },
  { value: 'EPZ', label: EPZ_BUNDLE.label },
];

export function getRegulatoryBundle(id: IndustryBundleId): RegulatoryBundle {
  return REGULATORY_BUNDLES[id] ?? RMG_BUNDLE;
}

/**
 * Fields that are null for the given bundle — i.e. not yet verified for
 * that industry. A UI surfacing this bundle should warn about exactly
 * these fields rather than silently computing with a fallback.
 */
export function getUnverifiedFields(bundle: RegulatoryBundle): string[] {
  return Object.entries(bundle)
    .filter(([key, value]) => value === null && key !== 'verificationNote')
    .map(([key]) => key);
}
