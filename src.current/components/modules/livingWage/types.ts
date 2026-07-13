// ─────────────────────────────────────────────────────────────────────────────
// Living Wage (Anker Methodology) — types
// Path: src/components/modules/livingWage/types.ts
//
// Based on the Anker Methodology (Richard & Martha Anker, Global Living Wage
// Coalition / Anker Research Institute) — the widely-used standard for
// estimating living wages in RMG/garment supply chains, including
// Bangladesh-specific benchmarks (Dhaka City, Satellite Cities around
// Gazipur/Ashulia/Narayanganj).
//
// Two entry methods, per explicit request:
//   'benchmark'  — enter a PUBLISHED Anker benchmark figure directly (fast;
//                  use when you just want to apply an official number, e.g.
//                  the Anker Research Institute's latest Dhaka City study).
//   'calculator' — build the living wage up from its cost components
//                  (food, housing, non-food-non-housing essentials,
//                  contingency margin), matching the Anker structure itself.
//
// This is ESTIMATION SUPPORT, not a substitute for an actual Anker
// Methodology study — the real methodology requires local primary data
// collection (worker home visits, market food-price surveys, etc.) by
// trained researchers. This module lets a factory apply a published
// benchmark OR build a rough estimate using the same structure, and
// compare either against actual wages — not run a certified Anker study.
// ─────────────────────────────────────────────────────────────────────────────

export type LivingWageMethod = 'benchmark' | 'calculator';

export const METHOD_OPTIONS: { value: LivingWageMethod; label: string }[] = [
  { value: 'benchmark',  label: 'Published Benchmark (quick entry)' },
  { value: 'calculator', label: 'Full Calculator (cost components)' },
];

export const LOCATION_OPTIONS = [
  'Dhaka City',
  'Satellite Cities (Gazipur/Ashulia/Narayanganj)',
  'Chittagong',
  'Custom / Other',
];

export const PRIORITY_OPTIONS: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
export const ACTION_STATUS_OPTIONS: ('Not Started' | 'In Progress' | 'Completed')[] = ['Not Started', 'In Progress', 'Completed'];

/** Step 4: Management Review & Recommendations */
export interface ManagementReview {
  reviewDate: string;
  reviewedBy: string;
  reviewedByDesignation: string;
  summaryOfFindings: string;
  recommendation: string;
  priorityLevel: 'High' | 'Medium' | 'Low';
  managementComments: string;
  approvedBy: string;
  approvedByDesignation: string;
}

export function blankManagementReview(): ManagementReview {
  return {
    reviewDate: new Date().toISOString().split('T')[0],
    reviewedBy: '', reviewedByDesignation: '',
    summaryOfFindings: '', recommendation: '',
    priorityLevel: 'Medium',
    managementComments: '',
    approvedBy: '', approvedByDesignation: '',
  };
}

/** Step 5a: one corrective action item (array, same pattern as
   Requisition/Misc Bill items). */
export interface CorrectiveActionItem {
  slNo: number;
  actionItem: string;
  responsiblePerson: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  remarks: string;
}

export function blankCorrectiveAction(slNo: number): CorrectiveActionItem {
  return { slNo, actionItem: '', responsiblePerson: '', targetDate: '', status: 'Not Started', remarks: '' };
}

/** Step 5b: the factory's formal commitment statement. */
export interface CommitmentStatement {
  statement: string;
  committedBy: string;
  committedByDesignation: string;
  commitmentDate: string;
}

export function blankCommitment(): CommitmentStatement {
  return { statement: '', committedBy: '', committedByDesignation: '', commitmentDate: new Date().toISOString().split('T')[0] };
}

export interface LivingWageData {
  method: LivingWageMethod;
  location: string;
  studyYear: string;
  sourceReference: string;

  // ── Benchmark mode ─────────────────────────────────────────────────────
  /** The published net or gross living wage figure being applied directly. */
  benchmarkAmount: string;

  // ── Calculator mode — Anker cost components (monthly, per family) ──────
  foodCost: string;
  housingCost: string;
  healthcareCost: string;
  educationCost: string;
  transportCost: string;
  clothingCost: string;
  communicationCost: string;
  otherEssentialCost: string;
  /** % added for unexpected events/emergencies — Anker studies typically use ~5%. */
  contingencyMarginPercent: string;
  /** Average family size used to model the household (Bangladesh Anker
     studies commonly use 4). */
  familySize: string;
  /** Average number of full-time-equivalent earners per family (Bangladesh
     Anker studies commonly use ~1.58 — not every family member works). */
  workersPerFamily: string;
  /** % of gross pay lost to mandatory payroll deductions/taxes — used to
     gross up the net living wage. */
  payrollDeductionPercent: string;

  // ── Physical Individual Survey (Anker's "local participation" component) ──
  // Anker methodology explicitly requires local worker input, not just
  // secondary/aggregate data — this records individual worker interviews
  // so the aggregate assumptions above (familySize, workersPerFamily) can
  // be cross-checked against what workers actually report.
  surveys: IndividualSurveyEntry[];

  // ── Step 4: Management Review & Recommendations ─────────────────────────
  managementReview: ManagementReview;

  // ── Step 5: Corrective Action & Commitment ──────────────────────────────
  correctiveActions: CorrectiveActionItem[];
  commitment: CommitmentStatement;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

/**
 * One physical/individual worker survey entry — a real interview with a
 * specific worker, recording their ACTUAL family circumstances, per the
 * Anker Methodology's requirement for local participation (worker home
 * visits and direct input), not just aggregate/secondary data.
 */
export interface IndividualSurveyEntry {
  slNo: number;
  workerName: string;
  workerId: string;
  surveyDate: string;
  actualFamilySize: string;
  actualEarnersInFamily: string;
  reportedFoodExpense: string;
  reportedHousingExpense: string;
  reportedOtherExpense: string;
  surveyorName: string;
  notes: string;
}

export function blankSurveyEntry(slNo: number): IndividualSurveyEntry {
  return {
    slNo, workerName: '', workerId: '', surveyDate: new Date().toISOString().split('T')[0],
    actualFamilySize: '', actualEarnersInFamily: '',
    reportedFoodExpense: '', reportedHousingExpense: '', reportedOtherExpense: '',
    surveyorName: '', notes: '',
  };
}

/** Averages reported by workers so far — for cross-checking against the
   calculator's familySize/workersPerFamily assumptions. */
export function summarizeSurveys(surveys: IndividualSurveyEntry[]) {
  const valid = surveys.filter(s => Number(s.actualFamilySize) > 0);
  if (valid.length === 0) {
    return { count: 0, avgFamilySize: 0, avgEarners: 0, avgFoodExpense: 0, avgHousingExpense: 0, avgOtherExpense: 0 };
  }
  const sum = (f: (s: IndividualSurveyEntry) => number) => valid.reduce((s, e) => s + f(e), 0);
  return {
    count: valid.length,
    avgFamilySize:     sum(s => Number(s.actualFamilySize)         || 0) / valid.length,
    avgEarners:        sum(s => Number(s.actualEarnersInFamily)    || 0) / valid.length,
    avgFoodExpense:    sum(s => Number(s.reportedFoodExpense)      || 0) / valid.length,
    avgHousingExpense: sum(s => Number(s.reportedHousingExpense)   || 0) / valid.length,
    avgOtherExpense:   sum(s => Number(s.reportedOtherExpense)     || 0) / valid.length,
  };
}

export function blankLivingWageData(): LivingWageData {
  return {
    method: 'benchmark',
    location: 'Dhaka City',
    studyYear: String(new Date().getFullYear()),
    sourceReference: '',
    benchmarkAmount: '',
    foodCost: '',
    housingCost: '',
    healthcareCost: '',
    educationCost: '',
    transportCost: '',
    clothingCost: '',
    communicationCost: '',
    otherEssentialCost: '',
    contingencyMarginPercent: '5',
    familySize: '4',
    workersPerFamily: '1.58',
    payrollDeductionPercent: '0',
    surveys: [],
    managementReview: blankManagementReview(),
    correctiveActions: [],
    commitment: blankCommitment(),
    date: new Date().toISOString().split('T')[0],
    factoryName: '',
    factoryAddress: '',
  };
}

export const INITIAL_LIVING_WAGE_STATE: LivingWageData = blankLivingWageData();

// ── Calculator-mode calculation chain (Anker structure) ───────────────────

/** Non-Food-Non-Housing essentials subtotal. */
export function calculateNFNHTotal(data: LivingWageData): number {
  return (
    (Number(data.healthcareCost)     || 0) +
    (Number(data.educationCost)      || 0) +
    (Number(data.transportCost)      || 0) +
    (Number(data.clothingCost)       || 0) +
    (Number(data.communicationCost)  || 0) +
    (Number(data.otherEssentialCost) || 0)
  );
}

/** Food + Housing + NFNH, before the contingency margin. */
export function calculateFamilyCostSubtotal(data: LivingWageData): number {
  const food    = Number(data.foodCost)    || 0;
  const housing = Number(data.housingCost) || 0;
  return food + housing + calculateNFNHTotal(data);
}

export function calculateContingencyMargin(data: LivingWageData): number {
  const subtotal = calculateFamilyCostSubtotal(data);
  const pct = Number(data.contingencyMarginPercent) || 0;
  return subtotal * (pct / 100);
}

/** Total monthly cost of a basic but decent life for the whole family. */
export function calculateTotalFamilyCost(data: LivingWageData): number {
  return calculateFamilyCostSubtotal(data) + calculateContingencyMargin(data);
}

/** Net living wage per worker = total family cost ÷ workers per family. */
export function calculateNetLivingWage(data: LivingWageData): number {
  const workers = Number(data.workersPerFamily) || 1;
  if (workers <= 0) return 0;
  return calculateTotalFamilyCost(data) / workers;
}

/** Gross living wage per worker — grosses up the net figure by the payroll
   deduction/tax rate, so it's comparable to a worker's GROSS salary. */
export function calculateGrossLivingWage(data: LivingWageData): number {
  const net = calculateNetLivingWage(data);
  const deductionPct = Number(data.payrollDeductionPercent) || 0;
  if (deductionPct >= 100) return net; // guard against divide-by-zero/negative
  return net / (1 - deductionPct / 100);
}

/** The single "living wage" figure to use for comparison — either the
   directly-entered benchmark, or the calculator's computed gross figure. */
export function getLivingWageAmount(data: LivingWageData): number {
  if (data.method === 'benchmark') return Number(data.benchmarkAmount) || 0;
  return calculateGrossLivingWage(data);
}

// ── Wage gap ────────────────────────────────────────────────────────────

export interface WageGapResult {
  actualWage: number;
  livingWage: number;
  gapAmount: number;   // livingWage - actualWage; positive = shortfall
  gapPercent: number;  // gapAmount / livingWage * 100
  meetsLivingWage: boolean;
}

export function calculateWageGap(actualWage: number, livingWage: number): WageGapResult {
  const gapAmount = livingWage - actualWage;
  const gapPercent = livingWage > 0 ? (gapAmount / livingWage) * 100 : 0;
  return {
    actualWage,
    livingWage,
    gapAmount,
    gapPercent,
    meetsLivingWage: actualWage >= livingWage,
  };
}
