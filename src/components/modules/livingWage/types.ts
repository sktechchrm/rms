// ─────────────────────────────────────────────────────────────────────────────
// Living Wage (Anker Methodology) — types, survey derivation, calculation, wage gap
// Path: src/components/modules/livingWage/types.ts
//
// ANKER STRUCTURE:
//   Family cost = Food + Housing & utilities + Non-food-non-housing (healthcare, education,
//                 transport, clothing, communication, other) + contingency margin (~5%)
//   Net living wage   = total family cost ÷ full-time-equivalent earners per family
//   Gross living wage = net ÷ (1 − payroll deduction %)
//
// SURVEY-DRIVEN CALCULATION: with method 'calculator' and useSurveyData on, every input comes
// from the Individual Surveys (mean / median / trimmed mean). Per-person costs are scaled to the
// model family size:  cost = statistic( household cost ÷ household size ) × model family size.
// Housing and utilities stay household costs (not scaled).
//
// WAGE GAP DATA: gapDataset 'employees' (Employee Personal File) or 'workers' (custom list in
// the 'workers' sheet — same field names: fullName, cardNo, designation, department, grossSalary).
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export type LivingWageMethod = 'benchmark' | 'calculator';
export const METHOD_OPTIONS: { value: LivingWageMethod; label: string }[] = [
  { value: 'benchmark',  label: 'Published Benchmark (quick entry)' },
  { value: 'calculator', label: 'Full Calculator (from survey data)' },
];
export const LOCATION_OPTIONS = ['Dhaka City', 'Satellite Cities (Gazipur/Ashulia/Narayanganj)', 'Chittagong', 'Custom / Other'];

export type GapDataset = 'employees' | 'workers';
export const GAP_DATASET_OPTIONS: { value: GapDataset; label: string }[] = [
  { value: 'employees', label: 'Employees (Employee Personal File)' },
  { value: 'workers',   label: 'Workers (custom list)' },
];
export const datasetLabel = (d: GapDataset) => (d === 'workers' ? 'Workers list (custom data)' : 'Employee Personal File');

export type Priority = 'High' | 'Medium' | 'Low';
export type ActionStatus = 'Not Started' | 'In Progress' | 'Completed';
export const PRIORITY_OPTIONS: Priority[] = ['High', 'Medium', 'Low'];
export const ACTION_STATUS_OPTIONS: ActionStatus[] = ['Not Started', 'In Progress', 'Completed'];

export type SurveyStatistic = 'mean' | 'median' | 'trimmed';
export const STATISTIC_OPTIONS: { value: SurveyStatistic; label: string }[] = [
  { value: 'mean',    label: 'Mean (average)' },
  { value: 'median',  label: 'Median' },
  { value: 'trimmed', label: 'Trimmed mean (drop lowest and highest 10%)' },
];
export const statisticLabel = (s: SurveyStatistic) => STATISTIC_OPTIONS.find(o => o.value === s)?.label.split(' (')[0] ?? s;

/** The nine cost components — the SAME list drives the survey table, the calculator, the form and the print. */
export const COST_COMPONENTS = [
  { key: 'food',          entry: 'reportedFoodExpense',          field: 'foodCost',           label: 'Food',             perCapita: true },
  { key: 'housing',       entry: 'reportedHousingExpense',       field: 'housingCost',        label: 'Housing (rent)',   perCapita: false },
  { key: 'utilities',     entry: 'reportedUtilitiesExpense',     field: 'utilitiesCost',      label: 'Utilities',        perCapita: false },
  { key: 'healthcare',    entry: 'reportedHealthcareExpense',    field: 'healthcareCost',     label: 'Healthcare',       perCapita: true },
  { key: 'education',     entry: 'reportedEducationExpense',     field: 'educationCost',      label: 'Education',        perCapita: true },
  { key: 'transport',     entry: 'reportedTransportExpense',     field: 'transportCost',      label: 'Transport',        perCapita: true },
  { key: 'clothing',      entry: 'reportedClothingExpense',      field: 'clothingCost',       label: 'Clothing',         perCapita: true },
  { key: 'communication', entry: 'reportedCommunicationExpense', field: 'communicationCost',  label: 'Communication',    perCapita: true },
  { key: 'other',         entry: 'reportedOtherExpense',         field: 'otherEssentialCost', label: 'Other essentials', perCapita: true },
] as const;
export type ComponentKey = typeof COST_COMPONENTS[number]['key'];

// ─── Small helpers ───────────────────────────────────────────────────────────

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
export function toIsoDate(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
}
export function parseAmount(v: unknown): number | null {
  const s = String(v ?? '').replace(/,/g, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export const fmt = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(2);
export const money = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function statOf(values: number[], kind: SurveyStatistic): number {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  if (kind === 'median') { const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }
  let arr = v;
  if (kind === 'trimmed' && v.length >= 10) { const k = Math.floor(v.length * 0.1); arr = v.slice(k, v.length - k); }
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

// ─── Workflow pieces ─────────────────────────────────────────────────────────

export interface ManagementReview {
  reviewDate: string; reviewedBy: string; reviewedByDesignation: string;
  summaryOfFindings: string; recommendation: string; priorityLevel: Priority;
  managementComments: string; approvedBy: string; approvedByDesignation: string;
}
export function blankManagementReview(): ManagementReview {
  return { reviewDate: todayIso(), reviewedBy: '', reviewedByDesignation: '', summaryOfFindings: '', recommendation: '', priorityLevel: 'Medium', managementComments: '', approvedBy: '', approvedByDesignation: '' };
}

export interface CorrectiveActionItem { slNo: number; actionItem: string; responsiblePerson: string; targetDate: string; status: ActionStatus; remarks: string; }
export const blankCorrectiveAction = (slNo: number): CorrectiveActionItem => ({ slNo, actionItem: '', responsiblePerson: '', targetDate: '', status: 'Not Started', remarks: '' });
export const actionOverdue = (a: CorrectiveActionItem) => Boolean(a.targetDate) && a.targetDate.slice(0, 10) < todayIso() && a.status !== 'Completed';

export const SUGGESTED_ACTIONS = [
  'Revise the wage structure so the lowest gross wage reaches the living wage',
  'Phase the increase for employees below the living wage (set steps and dates)',
  'Consult workers and the workers\u2019 committee / union on the plan',
  'Review the living wage estimate every year and after major price changes',
  'Repeat the worker survey in 12 months and compare results',
];

export interface CommitmentStatement { statement: string; committedBy: string; committedByDesignation: string; commitmentDate: string; }
export const blankCommitment = (): CommitmentStatement => ({ statement: '', committedBy: '', committedByDesignation: '', commitmentDate: todayIso() });

// ─── Survey ──────────────────────────────────────────────────────────────────

export interface IndividualSurveyEntry {
  slNo: number; workerName: string; workerId: string; surveyDate: string;
  actualFamilySize: string; actualEarnersInFamily: string;
  reportedFoodExpense: string; reportedHousingExpense: string; reportedUtilitiesExpense: string; reportedHealthcareExpense: string;
  reportedEducationExpense: string; reportedTransportExpense: string; reportedClothingExpense: string;
  reportedCommunicationExpense: string; reportedOtherExpense: string;
  surveyorName: string;
}
export function blankSurveyEntry(slNo: number): IndividualSurveyEntry {
  return {
    slNo, workerName: '', workerId: '', surveyDate: todayIso(), actualFamilySize: '', actualEarnersInFamily: '',
    reportedFoodExpense: '', reportedHousingExpense: '', reportedUtilitiesExpense: '', reportedHealthcareExpense: '',
    reportedEducationExpense: '', reportedTransportExpense: '', reportedClothingExpense: '', reportedCommunicationExpense: '',
    reportedOtherExpense: '', surveyorName: '',
  };
}

export function duplicateCounts(surveys: IndividualSurveyEntry[]): Map<string, number> {
  const m = new Map<string, number>();
  surveys.forEach(s => { const id = s.workerId.trim(); if (id) m.set(id, (m.get(id) ?? 0) + 1); });
  return m;
}
export function surveyIssues(s: IndividualSurveyEntry, dupCount: number): string[] {
  const size = parseAmount(s.actualFamilySize);
  const earn = parseAmount(s.actualEarnersInFamily);
  const out: string[] = [];
  if (!size || size <= 0) out.push('Family size missing');
  if (earn === null || earn <= 0) out.push('Earners missing');
  else if (size && earn > size) out.push('Earners exceed family size');
  if (parseAmount(s.reportedFoodExpense) === null) out.push('Food expense missing');
  if (parseAmount(s.reportedHousingExpense) === null) out.push('Housing expense missing');
  if (s.workerId.trim() && dupCount > 1) out.push('Duplicate worker ID');
  return out;
}

export interface Derived {
  total: number; n: number; familySize: number; workers: number; workersN: number;
  costs: Record<ComponentKey, { value: number; raw: number; n: number }>;
}
export function deriveFromSurveys(surveys: IndividualSurveyEntry[], statistic: SurveyStatistic, normalize: boolean): Derived {
  const valid = surveys.filter(s => (parseAmount(s.actualFamilySize) ?? 0) > 0);
  const familySize = statOf(valid.map(s => parseAmount(s.actualFamilySize) as number), statistic);
  const earners = valid.map(s => parseAmount(s.actualEarnersInFamily)).filter((v): v is number => v !== null && v > 0);
  const costs = {} as Derived['costs'];
  COST_COMPONENTS.forEach(c => {
    const pairs = valid
      .map(s => ({ v: parseAmount(s[c.entry]), size: parseAmount(s.actualFamilySize) as number }))
      .filter(p => p.v !== null) as { v: number; size: number }[];
    const raw = statOf(pairs.map(p => p.v), statistic);
    const value = c.perCapita && normalize ? statOf(pairs.map(p => p.v / p.size), statistic) * familySize : raw;
    costs[c.key] = { value, raw, n: pairs.length };
  });
  return { total: surveys.length, n: valid.length, familySize, workers: statOf(earners, statistic), workersN: earners.length, costs };
}

// ─── Data ────────────────────────────────────────────────────────────────────

export interface LivingWageData {
  method: LivingWageMethod;
  location: string; studyYear: string; sourceReference: string; benchmarkAmount: string;

  foodCost: string; housingCost: string; utilitiesCost: string; healthcareCost: string; educationCost: string;
  transportCost: string; clothingCost: string; communicationCost: string; otherEssentialCost: string;
  contingencyMarginPercent: string; familySize: string; workersPerFamily: string; payrollDeductionPercent: string;

  useSurveyData: boolean;
  surveyStatistic: SurveyStatistic;
  normalizePerCapita: boolean;
  /** Whose wages the gap analysis compares with the living wage. */
  gapDataset: GapDataset;

  surveys: IndividualSurveyEntry[];
  managementReview: ManagementReview;
  correctiveActions: CorrectiveActionItem[];
  commitment: CommitmentStatement;

  date: string; factoryName: string; factoryAddress: string;
}

export function blankLivingWageData(): LivingWageData {
  return {
    method: 'benchmark', location: 'Dhaka City', studyYear: String(new Date().getFullYear()), sourceReference: '', benchmarkAmount: '',
    foodCost: '', housingCost: '', utilitiesCost: '', healthcareCost: '', educationCost: '', transportCost: '',
    clothingCost: '', communicationCost: '', otherEssentialCost: '', contingencyMarginPercent: '5',
    familySize: '4', workersPerFamily: '1.58', payrollDeductionPercent: '0',
    useSurveyData: true, surveyStatistic: 'mean', normalizePerCapita: true, gapDataset: 'employees',
    surveys: [], managementReview: blankManagementReview(), correctiveActions: [], commitment: blankCommitment(),
    date: todayIso(), factoryName: '', factoryAddress: '',
  };
}

// ─── Calculation ─────────────────────────────────────────────────────────────

export interface CalcInputs {
  costs: Record<ComponentKey, number>; counts: Record<ComponentKey, number>;
  familySize: number; workers: number; contingencyPct: number; deductionPct: number; fromSurvey: boolean; n: number;
}
export interface Computation {
  inputs: CalcInputs; derived: Derived;
  food: number; housingTotal: number; nfnh: number; subtotal: number; margin: number; totalFamilyCost: number;
  net: number; gross: number; amount: number;
}

export function computeLivingWage(data: LivingWageData): Computation {
  const derived = deriveFromSurveys(data.surveys, data.surveyStatistic, data.normalizePerCapita);
  const fromSurvey = data.method === 'calculator' && data.useSurveyData;
  const costs = {} as Record<ComponentKey, number>;
  const counts = {} as Record<ComponentKey, number>;
  COST_COMPONENTS.forEach(c => {
    costs[c.key]  = fromSurvey ? derived.costs[c.key].value : (parseAmount(data[c.field]) ?? 0);
    counts[c.key] = fromSurvey ? derived.costs[c.key].n : 0;
  });
  const inputs: CalcInputs = {
    costs, counts,
    familySize: fromSurvey ? derived.familySize : (parseAmount(data.familySize) ?? 0),
    workers:    fromSurvey ? derived.workers    : (parseAmount(data.workersPerFamily) ?? 0),
    contingencyPct: parseAmount(data.contingencyMarginPercent) ?? 0,
    deductionPct:   parseAmount(data.payrollDeductionPercent) ?? 0,
    fromSurvey, n: fromSurvey ? derived.n : 0,
  };
  const housingTotal = costs.housing + costs.utilities;
  const nfnh = costs.healthcare + costs.education + costs.transport + costs.clothing + costs.communication + costs.other;
  const subtotal = costs.food + housingTotal + nfnh;
  const margin = subtotal * (inputs.contingencyPct / 100);
  const totalFamilyCost = subtotal + margin;
  const net = inputs.workers > 0 ? totalFamilyCost / inputs.workers : 0;
  const gross = inputs.deductionPct >= 100 ? net : net / (1 - inputs.deductionPct / 100);
  const amount = data.method === 'benchmark' ? (parseAmount(data.benchmarkAmount) ?? 0) : gross;
  return { inputs, derived, food: costs.food, housingTotal, nfnh, subtotal, margin, totalFamilyCost, net, gross, amount };
}
export const getLivingWageAmount = (d: LivingWageData) => computeLivingWage(d).amount;

// ─── Wage gap ────────────────────────────────────────────────────────────────

export interface WageGapResult { actualWage: number; livingWage: number; gapAmount: number; gapPercent: number; meetsLivingWage: boolean; }
export function calculateWageGap(actualWage: number, livingWage: number): WageGapResult {
  const gapAmount = livingWage - actualWage;
  return { actualWage, livingWage, gapAmount, gapPercent: livingWage > 0 ? (gapAmount / livingWage) * 100 : 0, meetsLivingWage: actualWage >= livingWage };
}

export interface GapEntry { emp: DbRecord; gap: WageGapResult; }
export const BLANK_VALUE = '(Blank)';
const rec = (e: DbRecord) => e as unknown as Record<string, unknown>;
export const empName = (e: DbRecord) => String(rec(e).fullName ?? rec(e).fullNameBengali ?? '') || '—';

export function buildGapEntries(employees: DbRecord[], livingWage: number): GapEntry[] {
  return employees.filter(e => Number(rec(e).grossSalary) > 0).map(emp => ({ emp, gap: calculateWageGap(Number(rec(emp).grossSalary) || 0, livingWage) }));
}

export type GapSortField = 'name' | 'salary' | 'gap' | 'cardNo' |'';
export interface GapFilters {
  search: string; status: string[]; columns: Record<string, string[]>;
  sort: { field: GapSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_GAP_FILTERS: GapFilters = { search: '', status: [], columns: {}, sort: { field: '', dir: 'asc' } };
export function countActiveGapFilters(f: GapFilters): number {
  return [f.search.trim(), f.status.length > 0].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}
export const hasActiveGapFilters = (f: GapFilters) => countActiveGapFilters(f) > 0;
export const gapColumnValue = (e: GapEntry, field: string) => String(rec(e.emp)[field] ?? '').trim() || BLANK_VALUE;

export function filterGapEntries(entries: GapEntry[], f: GapFilters): GapEntry[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = entries.filter(e => {
    if (f.status.length && !f.status.includes(e.gap.meetsLivingWage ? 'meets' : 'below')) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(gapColumnValue(e, field))) return false;
    if (words.length) {
      const r = rec(e.emp);
      const hay = [r.fullName, r.fullNameBengali, r.designation, r.department, r.cardNo, r.idNo].map(v => String(v ?? '').toLowerCase()).join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return result;
  const m = dir === 'asc' ? 1 : -1;
  const card = (e: GapEntry) => String(rec(e.emp).cardNo ?? '').trim();
  return [...result].sort((a, b) => {
    if (field === 'salary') return m * (a.gap.actualWage - b.gap.actualWage);
    if (field === 'gap') return m * (a.gap.gapPercent - b.gap.gapPercent);
    if (field === 'cardNo') {
      const ca = card(a), cb = card(b);
      if (!ca && !cb) return 0;
      if (!ca) return 1;                         // empty card numbers always last
      if (!cb) return -1;
      return m * ca.localeCompare(cb, undefined, { numeric: true, sensitivity: 'base' });   // 2 before 10
    }
    return m * empName(a.emp).localeCompare(empName(b.emp), undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function gapStats(entries: GapEntry[]) {
  const n = entries.length;
  const below = entries.filter(e => !e.gap.meetsLivingWage);
  const shortfallTotal = below.reduce((s, e) => s + e.gap.gapAmount, 0);
  return {
    n, below: below.length,
    avgActual: n ? entries.reduce((s, e) => s + e.gap.actualWage, 0) / n : 0,
    median: statOf(entries.map(e => e.gap.actualWage), 'median'),
    avgGapPct: n ? entries.reduce((s, e) => s + e.gap.gapPercent, 0) / n : 0,
    shortfallTotal, avgShortfall: below.length ? shortfallTotal / below.length : 0,
  };
}

export function departmentSummary(entries: GapEntry[]) {
  const map = new Map<string, GapEntry[]>();
  entries.forEach(e => { const d = gapColumnValue(e, 'department'); map.set(d, [...(map.get(d) ?? []), e]); });
  return Array.from(map.entries()).map(([department, list]) => {
    const s = gapStats(list);
    return { department, count: s.n, avgGross: s.avgActual, below: s.below, avgGapPct: s.avgGapPct };
  }).sort((a, b) => a.department.localeCompare(b.department));
}

export function describeGap(entries: GapEntry[], livingWage: number) {
  const s = gapStats(entries);
  if (!s.n) return { text: 'No wage data available yet.', recommendation: '', priority: 'Medium' as Priority };
  const pct = (s.below / s.n) * 100;
  return {
    text: `Living wage set at Tk ${money(livingWage)}/month. ${s.below} of ${s.n} (${pct.toFixed(1)}%) are below it; the average gap is ${s.avgGapPct.toFixed(1)}%.`,
    recommendation: s.below
      ? `Raise the lowest gross wage to at least Tk ${money(livingWage)}. ${s.below} people need an adjustment (average Tk ${money(s.avgShortfall)} each); the extra monthly payroll is about Tk ${money(s.shortfallTotal)}.`
      : 'Everyone meets the living wage. Keep reviewing it every year.',
    priority: (pct >= 50 ? 'High' : pct >= 20 ? 'Medium' : 'Low') as Priority,
  };
}

// ─── Loading saved records ───────────────────────────────────────────────────

function json<T>(raw: unknown, fallback: T): T {
  try { const v = JSON.parse(String(raw ?? '')); return (v ?? fallback) as T; } catch { return fallback; }
}
export function parseSurveys(raw: unknown): IndividualSurveyEntry[] {
  const arr = json<Record<string, unknown>[]>(raw, []);
  if (!Array.isArray(arr)) return [];
  return arr.map((s, i) => {
    const b = blankSurveyEntry(i + 1);
    const out = { ...b } as IndividualSurveyEntry;
    (Object.keys(b) as (keyof IndividualSurveyEntry)[]).forEach(k => {
      if (k === 'slNo') out.slNo = Number(s.slNo ?? i + 1);
      else (out as unknown as Record<string, string>)[k] = String(s[k] ?? '');
    });
    return out;
  });
}
export function parseActions(raw: unknown): CorrectiveActionItem[] {
  const arr = json<Record<string, unknown>[]>(raw, []);
  if (!Array.isArray(arr)) return [];
  return arr.map((a, i) => ({
    slNo: Number(a.slNo ?? i + 1), actionItem: String(a.actionItem ?? ''), responsiblePerson: String(a.responsiblePerson ?? ''),
    targetDate: String(a.targetDate ?? ''), status: (a.status === 'In Progress' || a.status === 'Completed' ? a.status : 'Not Started') as ActionStatus,
    remarks: String(a.remarks ?? ''),
  }));
}
export const parseReview = (raw: unknown): ManagementReview => ({ ...blankManagementReview(), ...json<Partial<ManagementReview>>(raw, {}) });
export const parseCommitment = (raw: unknown): CommitmentStatement => ({ ...blankCommitment(), ...json<Partial<CommitmentStatement>>(raw, {}) });
export function parseSettings(raw: unknown, hasManualCosts: boolean) {
  const s = json<Partial<Pick<LivingWageData, 'useSurveyData' | 'surveyStatistic' | 'normalizePerCapita' | 'gapDataset'>>>(raw, {});
  return {
    useSurveyData: typeof s.useSurveyData === 'boolean' ? s.useSurveyData : !hasManualCosts,
    surveyStatistic: (s.surveyStatistic === 'median' || s.surveyStatistic === 'trimmed' ? s.surveyStatistic : 'mean') as SurveyStatistic,
    normalizePerCapita: typeof s.normalizePerCapita === 'boolean' ? s.normalizePerCapita : true,
    gapDataset: (s.gapDataset === 'workers' ? 'workers' : 'employees') as GapDataset,
  };
}