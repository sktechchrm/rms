// ─────────────────────────────────────────────────────────────────────────────
// settlementModel.ts — Final Settlement: blank state, record ↔ form, ONE pure calculation,
// saved-row list engine (filters / sort / summary) and validation.
// Path: src/components/modules/finalSettlement/settlementModel.ts
//
// computeSettlement(form) derives every figure from the inputs (no effects, nothing stored twice):
//   service duration → total days → benefit years → wage split → last-month pay / overtime →
//   earned leave → compensation OR gratuity → lay-off / notice (only for the types that use them) →
//   total payable (A) − total deductions (B) = net payable.
// resolveSettlement(form, calc) fills the derived strings back so PaymentBill works unchanged.
//
// UPDATE: service duration now counts the last attendance day as a worked day (inclusive),
//         and two payment due dates are derived from the last attendance date:
//           salaryDueDate = last attendance + 7 working days (Friday = weekly holiday)
//           otherDueDate  = last attendance + 30 calendar days
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import { STATIC_DATA } from './FinalSettlementDataTypes';
import { toDateInput } from '../../../utils/dateUtils';
import {
  calculateServiceDuration, calculateTotalDays, calculateBenefitYears, calculateWageComponents, calculateServiceCompensation,
  calculateDeathCompensation, calculateEarnedLeave, calculateNoticePay, calculateNoticeDeduction, calculateLastMonthSalary,
  calculateHourlyOvertimeRate, getServiceCompensationDaysPerYear, getDeathCompensationDaysPerYear, calculateLayOffCompensation,
  calculateGratuity, getGratuityDaysPerYear, isGratuityEligible,
} from './FinalSettlementFormula';

// ─── Options / helpers ───────────────────────────────────────────────────────

export const TERMINATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'ইস্তফা (২৭)', label: 'ইস্তফা (২৭)' },
  { value: 'অনুপস্থিতির কারণে ইস্তফা (২৭)', label: 'অনুপস্থিতির কারণে ইস্তফা (২৭)' },
  { value: 'অবসর (২৮)', label: 'অবসর (২৮)' },
  { value: 'চাকুরীরত থাকা অবস্থায় মৃত্যু (১৯)', label: 'চাকুরীরত থাকা অবস্থায় স্বাভাবিক মৃত্যু (১৯)' },
  { value: 'কর্মরত অবস্থায়/কর্মকালীন দূর্ঘটনার কারণে মৃত্যু (১৯)', label: 'কর্মরত অবস্থায় দুর্ঘটনাজনিত মৃত্যু (১৯)' },
  { value: 'ডিসচার্জ (২২)', label: 'ডিসচার্জ (২২)' },
  { value: 'বরখাস্ত (২৩)', label: 'বরখাস্ত (২৩)' },
  { value: 'বরখাস্ত (২৩.৪: খ/ছ)', label: 'বরখাস্ত (২৩.৪: খ/ছ)' },
  { value: 'অপসারন (২৩.৩)', label: 'অপসারন (২৩.৩)' },
  { value: 'চাকুরী অবসান (২৬)', label: 'চাকুরী অবসান (২৬)' },
  { value: 'ছাঁটাই (২০)', label: 'ছাঁটাই (২০)' },
  { value: 'লে-অফ (১৬)', label: 'লে-অফ (১৬)' },
];
export const NOTICE_PAY_TYPES = ['চাকুরী অবসান (২৬)', 'ছাঁটাই (২০)'];
export const NOTICE_DEDUCTION_TYPES = ['ইস্তফা (২৭)', 'অনুপস্থিতির কারণে ইস্তফা (২৭)'];
export const LAYOFF_TYPE = 'লে-অফ (১৬)';
export const isDeathType = (t: string) => t.includes('মৃত্যু');
export const MONTH_NAMES = STATIC_DATA.bengaliMonths;
/** 2019 … next year (the old list stopped at 2026). */
export const yearOptions = () => Array.from({ length: Math.max(2, new Date().getFullYear() - 2019 + 2) }, (_, i) => String(2019 + i));

export type PayStatus = '' | 'Pending' | 'Paid';
export const normStatus = (v: unknown): PayStatus => (v === 'Paid' ? 'Paid' : v === 'Pending' ? 'Pending' : '');
export const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  Paid:    { bg: '#dcfce7', color: '#166534', label: 'Paid' },
  None:    { bg: '#f1f5f9', color: '#64748b', label: 'Not tracked' },
};

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
export const money = (x: number) => (Number.isFinite(x) ? x : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n = (v: unknown): number => { const x = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(x) ? x : 0; };

// ─── Due-date helpers (UTC-based, so the local time zone can never shift a date) ─────────

const isoOk = (iso: string) => /^\d{4}-\d{2}-\d{2}/.test(iso ?? '');
const shiftIso = (iso: string, days: number): string => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** Add calendar days to an ISO date (YYYY-MM-DD). Returns '' for an invalid date. */
export const addCalendarDays = (iso: string, days: number): string => (isoOk(iso) ? shiftIso(iso, days) : '');

/** Add working days, skipping the weekly holiday (0 = Sun … 5 = Fri). Returns '' for an invalid date. */
export function addWorkingDays(iso: string, count: number, weeklyHoliday = 5): string {
  if (!isoOk(iso)) return '';
  let cur = iso.slice(0, 10), left = count;
  while (left > 0) {
    cur = shiftIso(cur, 1);
    if (new Date(`${cur}T00:00:00Z`).getUTCDay() !== weeklyHoliday) left--;
  }
  return cur;
}

export const SALARY_DUE_WORKING_DAYS = 7;   // salary: within 7 working days of the last work day
export const OTHER_DUE_CALENDAR_DAYS = 30;  // everything else: within 30 days of the last work day

export function blankSettlement(): EmployeeFormData {
  return {
    employeeName: '', cardNo: '', designation: '', section: '', joiningDate: '', lastAttendance: '', settlementDate: todayIso(), terminationType: '',
    serviceYears: '', benefitYears: '', serviceMonths: '', serviceDays: '', totalDays: '', absentDays: '',
    basicWage: '', houseRent: '', foodAllowance: '1250', medicalAllowance: '750', transportAllowance: '450', totalMonthlyWage: '', dailyBasic: '', dailyGross: '',
    elQty: '', noticePayDay: '', noticeDeductionDay: '', earnedLeave: '', serviceCompensation: '', deathCompensation: '',
    layOffDays: '', layOffCompensation: '', gratuityAmount: '', gratuityDaysPerYear: '', paymentMethod: 'compensation',
    noticePay: '', others: '', advanceDeduction: '', noticeDeduction: '', otherDeduction: '', totalDeductions: '',
    companyName: '', companyAddress: '', companyNameEn: '', companyAddressEn: '',
    payableDay: '', payableHours: '', lastMonthName: '', lastMonthYear: '', lastMonthSalary: '', lastMonthOvertime: '',
    serviceCompDaysPerYear: '', DeathCompensationDaysPerYear: '', otherBenefits: '', deductionForAdvance: '', deductionParticularsB: '',
    paymentStatus: 'Pending', paymentDate: '',
  };
}

/** Saved sheet row → form inputs (derived figures are recalculated, not loaded). */
export function recordToFormData(rec: Record<string, unknown>, prev: EmployeeFormData): EmployeeFormData {
  const s = (k: string) => String(rec[k] ?? '');
  const dt = (k: string) => (rec[k] ? toDateInput(rec[k]) || '' : '');
  return {
    ...prev,
    employeeName: s('employeeName'), cardNo: s('cardNo'), designation: s('designation'), section: s('section'),
    joiningDate: dt('joiningDate'), lastAttendance: dt('lastAttendance'), settlementDate: dt('settlementDate') || prev.settlementDate,
    terminationType: s('terminationType'), absentDays: s('absentDays'),
    totalMonthlyWage: s('totalWage'), foodAllowance: s('foodAllowance') || prev.foodAllowance,
    medicalAllowance: s('medicalAllowance') || prev.medicalAllowance, transportAllowance: s('transportAllowance') || prev.transportAllowance,
    elQty: s('elQty'), noticePayDay: s('noticePayDay'), noticeDeductionDay: s('noticeDeductionDay'),
    payableDay: s('payableDay'), payableHours: s('payableHours'), lastMonthName: s('lastMonthName'), lastMonthYear: s('lastMonthYear'),
    layOffDays: s('layOffDays'), paymentMethod: s('paymentMethod') === 'gratuity' ? 'gratuity' : 'compensation',
    others: s('others'), otherBenefits: s('otherBenefits'),
    advanceDeduction: s('advanceDeduction'), deductionForAdvance: s('deductionForAdvance'),
    otherDeduction: s('otherDeduction'), deductionParticularsB: s('deductionParticularsB'),
    paymentStatus: normStatus(rec.paymentStatus), paymentDate: dt('paymentDate'),
  };
}

// ─── The calculation ─────────────────────────────────────────────────────────

export interface Settlement {
  years: number; months: number; days: number; totalDays: number; benefitYears: number;
  basic: number; houseRent: number; dailyBasic: number; dailyGross: number; otRate: number;
  lastMonthSalary: number; lastMonthOvertime: number; earnedLeave: number;
  serviceComp: number; deathComp: number; layOff: number; gratuity: number; notice: number; others: number;
  refCompensation: number;            // statutory compensation as a reference, even when gratuity is chosen
  sDays: number; dDays: number; gDays: number;
  gratuityEligible: boolean; usesGratuity: boolean;
  noticeDeduction: number; advance: number; otherDeduction: number; totalDeductions: number;
  totalReceivable: number; finalTotal: number;
  salaryDueDate: string;              // last attendance + 7 working days (ISO, '' if no valid date)
  otherDueDate: string;               // last attendance + 30 calendar days (ISO, '' if no valid date)
}

export function computeSettlement(f: EmployeeFormData): Settlement {
  // `true` = inclusive: the last attendance day itself counts as a worked day (01-01-2025 → 31-10-2026 = 1y 10m 0d).
  const dur = calculateServiceDuration(f.joiningDate, f.lastAttendance, true);
  const totalDays = calculateTotalDays(dur.months, dur.days, parseInt(f.absentDays, 10) || 0);
  const benefit = calculateBenefitYears(dur.years, totalDays);
  const w = calculateWageComponents(n(f.totalMonthlyWage), n(f.foodAllowance), n(f.medicalAllowance), n(f.transportAllowance));
  const otRate = calculateHourlyOvertimeRate(w.basicWage);
  const lastMonthOvertime = parseFloat((otRate * n(f.payableHours)).toFixed(2));
  const lastMonthSalary = calculateLastMonthSalary(n(f.totalMonthlyWage), n(f.payableDay), f.lastMonthName, f.lastMonthYear);

  const t = f.terminationType || '';
  const gratuityEligible = isGratuityEligible(t);
  const usesGratuity = f.paymentMethod === 'gratuity' && gratuityEligible;
  const gratuity = calculateGratuity(benefit, w.dailyBasic);
  const refService = calculateServiceCompensation(t, benefit, w.dailyBasic);
  const refDeath = calculateDeathCompensation(t, benefit, w.dailyBasic);
  const serviceComp = usesGratuity ? 0 : refService;      // "compensation OR gratuity", never both
  const deathComp = usesGratuity ? 0 : refDeath;
  const layOff = t === LAYOFF_TYPE ? calculateLayOffCompensation(n(f.layOffDays), w.dailyBasic, w.houseRent) : 0;
  const earnedLeave = calculateEarnedLeave(n(f.elQty), w.dailyGross);
  const notice = NOTICE_PAY_TYPES.includes(t) ? calculateNoticePay(n(f.noticePayDay), w.dailyBasic) : 0;
  const noticeDeduction = NOTICE_DEDUCTION_TYPES.includes(t) ? calculateNoticeDeduction(n(f.noticeDeductionDay), w.dailyBasic) : 0;

  const others = n(f.others), advance = n(f.advanceDeduction), otherDeduction = n(f.otherDeduction);
  const totalDeductions = parseFloat((advance + noticeDeduction + otherDeduction).toFixed(2));
  const totalReceivable = parseFloat((earnedLeave + serviceComp + deathComp + (usesGratuity ? gratuity : 0) + layOff + notice + lastMonthSalary + lastMonthOvertime + others).toFixed(2));
  return {
    years: dur.years, months: dur.months, days: dur.days, totalDays, benefitYears: benefit,
    basic: w.basicWage, houseRent: w.houseRent, dailyBasic: w.dailyBasic, dailyGross: w.dailyGross, otRate,
    lastMonthSalary, lastMonthOvertime, earnedLeave, serviceComp, deathComp, layOff, gratuity, notice, others,
    refCompensation: parseFloat((refService + refDeath).toFixed(2)),
    sDays: getServiceCompensationDaysPerYear(t, benefit), dDays: getDeathCompensationDaysPerYear(t), gDays: getGratuityDaysPerYear(benefit),
    gratuityEligible, usesGratuity, noticeDeduction, advance, otherDeduction, totalDeductions, totalReceivable,
    finalTotal: Number((totalReceivable - totalDeductions).toFixed(0)),
    salaryDueDate: addWorkingDays(f.lastAttendance, SALARY_DUE_WORKING_DAYS),
    otherDueDate: addCalendarDays(f.lastAttendance, OTHER_DUE_CALENDAR_DAYS),
  };
}

/** Form + derived figures as strings — exactly what PaymentBill and the saved row expect. */
export function resolveSettlement(f: EmployeeFormData, s: Settlement): EmployeeFormData {
  const x = (v: number) => String(v);
  return {
    ...f,
    serviceYears: x(s.years), serviceMonths: x(s.months), serviceDays: x(s.days), totalDays: x(s.totalDays), benefitYears: x(s.benefitYears),
    basicWage: x(s.basic), houseRent: x(s.houseRent), dailyBasic: x(s.dailyBasic), dailyGross: x(s.dailyGross), hourlyOvertimeRate: x(s.otRate),
    lastMonthSalary: x(s.lastMonthSalary), lastMonthOvertime: x(s.lastMonthOvertime),
    serviceCompDaysPerYear: x(s.sDays), DeathCompensationDaysPerYear: x(s.dDays), gratuityDaysPerYear: x(s.gDays), gratuityAmount: x(s.gratuity),
    serviceCompensation: x(s.serviceComp), deathCompensation: x(s.deathComp), layOffCompensation: x(s.layOff),
    earnedLeave: x(s.earnedLeave), noticePay: x(s.notice), noticeDeduction: x(s.noticeDeduction), totalDeductions: x(s.totalDeductions),
    paymentMethod: s.usesGratuity ? 'gratuity' : 'compensation',
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface Issue { field: string; text: string }
export interface SettlementIssues { errors: Issue[]; warnings: string[] }

export function validateSettlement(f: EmployeeFormData, s: Settlement): SettlementIssues {
  const errors: Issue[] = [], warnings: string[] = [];
  if (!f.employeeName.trim()) errors.push({ field: 'employeeName', text: 'Employee name is required.' });
  if (!f.terminationType) errors.push({ field: 'terminationType', text: 'Choose the settlement type.' });
  if (!f.joiningDate) errors.push({ field: 'joiningDate', text: 'Joining date is required.' });
  if (!f.lastAttendance) errors.push({ field: 'lastAttendance', text: 'Last attendance date is required.' });
  if (f.joiningDate && f.lastAttendance && f.lastAttendance < f.joiningDate) errors.push({ field: 'lastAttendance', text: 'Last attendance is before the joining date.' });
  if (n(f.totalMonthlyWage) <= 0) errors.push({ field: 'totalMonthlyWage', text: 'Enter the total monthly wage.' });

  if (f.settlementDate && f.lastAttendance && f.settlementDate < f.lastAttendance) warnings.push('The settlement date is before the last attendance date.');
  if (n(f.absentDays) > s.months * 30 + s.days) warnings.push('Absent days are more than the days of the incomplete year.');
  if (n(f.payableDay) > 0 && (!f.lastMonthName || !f.lastMonthYear)) warnings.push('Choose the last month and year — the last-month wage depends on its calendar days.');
  if (f.terminationType === LAYOFF_TYPE && n(f.layOffDays) <= 0) warnings.push('Enter the lay-off days for the lay-off compensation.');
  // (The "no statutory compensation or gratuity is calculated…" notice was removed on purpose —
  //  a zero compensation line on the form already shows that.)
  if (s.finalTotal < 0) warnings.push('The deductions are more than the amount payable.');
  if (f.paymentStatus === 'Paid' && !f.paymentDate) warnings.push('Status is Paid but the payment date is empty.');
  if (f.paymentDate && s.otherDueDate && f.paymentDate > s.otherDueDate) {
    warnings.push(`Payment date is after the 30-day limit for other dues (${formatDMY(s.otherDueDate)}).`);
  } else if (f.paymentDate && s.salaryDueDate && f.paymentDate > s.salaryDueDate && (s.lastMonthSalary + s.lastMonthOvertime) > 0) {
    warnings.push(`Payment date is after the 7-working-day limit for salary (${formatDMY(s.salaryDueDate)}).`);
  }
  return { errors, warnings };
}

// ─── Saved rows for the Statement ────────────────────────────────────────────

export interface SettlementRow {
  id: string; savedAt: string; name: string; cardNo: string; designation: string; section: string; termination: string;
  joining: string; lastAttendance: string; settlementDate: string; service: string; benefitYears: number;
  wage: number; receivable: number; deductions: number; net: number; status: PayStatus; paymentDate: string;
  // Print-sheet columns
  payableDays: number; salaryAmount: number;            // col 5
  otHours: number; otAmount: number;                    // col 6
  elDays: number; elAmount: number;                     // col 7
  isDeath: boolean; serviceComp: number; deathComp: number; gratuity: number; layOff: number; noticePay: number; others: number;   // col 8
  noticeDeductionDays: number; noticeDeduction: number; advance: number; advanceNote: string; otherDeduction: number; otherDeductionNote: string; // col 9
}

export function buildSettlementRows(records: DbRecord[]): SettlementRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    const s = (k: string) => String(r[k] ?? '').trim();
    const dt = (k: string) => (r[k] ? toDateInput(r[k]) || '' : '');
    return {
      id: s('id'), savedAt: s('savedAt'), name: s('employeeName') || '—', cardNo: s('cardNo'), designation: s('designation'), section: s('section'),
      termination: s('terminationType'), joining: dt('joiningDate'), lastAttendance: dt('lastAttendance'), settlementDate: dt('settlementDate'),
      service: `${n(r.serviceYears)} বছর ${n(r.serviceMonths)} মাস ${n(r.serviceDays)} দিন`, benefitYears: n(r.benefitYears),
      wage: n(r.totalWage), receivable: n(r.totalReceivable), deductions: n(r.totalDeductions), net: n(r.finalTotal),
      status: normStatus(r.paymentStatus), paymentDate: dt('paymentDate'),
      payableDays: n(r.payableDay), salaryAmount: n(r.lastMonthSalary),
      otHours: n(r.payableHours), otAmount: n(r.lastMonthOvertime),
      elDays: n(r.elQty), elAmount: n(r.earnedLeave),
      isDeath: isDeathType(s('terminationType')),
      serviceComp: n(r.serviceCompensation), deathComp: n(r.deathCompensation),
      gratuity: s('paymentMethod') === 'gratuity' ? n(r.gratuityAmount) : 0,   // the amount is saved even when not chosen
      layOff: n(r.layOffCompensation), noticePay: n(r.noticePay), others: n(r.others),
      noticeDeductionDays: n(r.noticeDeductionDay), noticeDeduction: n(r.noticeDeduction),
      advance: n(r.advanceDeduction), advanceNote: s('deductionForAdvance'),
      otherDeduction: n(r.otherDeduction), otherDeductionNote: s('deductionParticularsB'),
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export type SettlementSortField = 'name' | 'cardNo' | 'settlementDate' | 'net' | '';
export interface SettlementFilters {
  search: string;
  status: string[];                        // 'Pending' | 'Paid'; [] = all
  dateFrom: string; dateTo: string;        // settlement date range
  columns: Record<string, string[]>;       // cardNo / designation / section / termination
  sort: { field: SettlementSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_SETTLEMENT_FILTERS: SettlementFilters = { search: '', status: [], dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';
export function columnValue(r: SettlementRow, field: string): string {
  const v = field === 'cardNo' ? r.cardNo : field === 'designation' ? r.designation : field === 'section' ? r.section : field === 'termination' ? r.termination : '';
  return v.trim() || BLANK_VALUE;
}
export function countActiveFilters(f: SettlementFilters): number {
  return [f.search.trim(), f.status.length > 0, f.dateFrom, f.dateTo].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

export function filterRows(rows: SettlementRow[], f: SettlementFilters): SettlementRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.dateFrom && (!r.settlementDate || r.settlementDate < f.dateFrom)) return false;
    if (f.dateTo && (!r.settlementDate || r.settlementDate > f.dateTo)) return false;
    if (f.status.length && !f.status.includes(r.status || 'None')) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const hay = `${r.name} ${r.cardNo} ${r.designation} ${r.section} ${r.termination}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    if (field === 'net') return m * (a.net - b.net);
    const x = field === 'name' ? a.name : field === 'cardNo' ? a.cardNo : a.settlementDate;
    const y = field === 'name' ? b.name : field === 'cardNo' ? b.cardNo : b.settlementDate;
    if (!x && !y) return 0;
    if (!x) return 1;                      // blanks always last
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: SettlementRow[]) {
  const sum = (l: SettlementRow[]) => l.reduce((s, r) => s + r.net, 0);
  const pending = rows.filter(r => r.status === 'Pending'), paid = rows.filter(r => r.status === 'Paid');
  return {
    count: rows.length, totalNet: sum(rows), totalReceivable: rows.reduce((s, r) => s + r.receivable, 0), totalDeductions: rows.reduce((s, r) => s + r.deductions, 0),
    pendingCount: pending.length, pendingAmount: sum(pending), paidCount: paid.length, paidAmount: sum(paid),
  };
}