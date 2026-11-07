// ─────────────────────────────────────────────────────────────────────────────
// maternityModel.ts — Maternity Benefit: blank state, record ↔ form, ONE pure calculation,
// validation, and the saved-row list engine (rows / filters / sort / summary) for the Statement.
// Path: src/components/modules/maternityBenefit/maternityModel.ts
//
// computeMaternity(form) derives every figure from the inputs (no effects, nothing stored twice):
//   service duration (joining → delivery) → eligibility (≥ 6 months AND ≤ 1 living child) →
//   leave dates (delivery − 59 days … + 119 days) → daily wage (monthly ÷ 26) →
//   for the SELECTED installment: benefit (60 / 120 days × daily) + current-month wage +
//   payable earned leave + others = total payable.
// resolveMaternity(form, calc) fills the derived values back so maternityBill.tsx works unchanged.
// Saved data format (installmentsJson, all column names) is unchanged — old records still open.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import type { MaternityFormData, MaternityInstallment } from './MaternityBenefitTypes';
import { INITIAL_FORM_STATE, MATERNITY_CONSTANTS, buildInstallmentsFromRecord, getActiveInstallmentDraft } from './MaternityBenefitTypes';
import { MaternityFormula } from './MaternityFormula';
import { toDateInput } from '../../../utils/dateUtils';

// ─── Payment time limits ─────────────────────────────────────────────────────
// ⚠ CONFIRM against the Labour Act / your policy — this is the ONE place to change them.
//   1st installment (pre-delivery 60 days): within N working days of the NOTICE date.
//   2nd installment (post-delivery 60 days): within N working days of the DELIVERY date.
// Working days skip the weekly holiday only (Friday); public holidays are not known to the system.
export const PAY_RULES = {
  first:  { workingDays: 3, from: 'notice',   text: 'নোটিশ প্রাপ্তির ৩ কর্মদিবসের মধ্যে' },
  second: { workingDays: 7, from: 'delivery', text: 'প্রসবের ৭ কর্মদিবসের মধ্যে' },
};
export const WEEKLY_HOLIDAY = 5;   // 0 = Sunday … 5 = Friday
export const SOON_DAYS = 3;        // "N দিন বাকি" is highlighted when this close to the limit

// ─── Small helpers ───────────────────────────────────────────────────────────

const pad2 = (x: number) => String(x).padStart(2, '0');
/** Safe text of any stored value: objects without a usable toString (and null) never throw — they become ''. */
export const text = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') { try { return v instanceof Date ? v.toISOString() : ''; } catch { return ''; } }
  return String(v);
};
const n = (v: unknown): number => { const x = parseFloat(text(v).replace(/,/g, '')); return Number.isFinite(x) ? x : 0; };

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
export const money = (x: number) => (Number.isFinite(x) ? x : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ISO date ± days, calendar-safe (no time-zone shifts). '' when not a date. */
export function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
/** ISO date + N working days (the weekly holiday is skipped). */
export function addWorkingDays(iso: string, count: number): string {
  let cur = iso, left = count;
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso ?? '')) return '';
  while (left > 0) {
    cur = addDaysIso(cur, 1);
    if (new Date(`${cur}T00:00:00Z`).getUTCDay() !== WEEKLY_HOLIDAY) left--;
  }
  return cur;
}
export function daysFrom(today: string, iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso ?? '')) return null;
  return Math.round((new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
}

// ─── Blank state + record → form ─────────────────────────────────────────────

export const blankMaternity = (): MaternityFormData => ({ ...INITIAL_FORM_STATE, formDate: todayIso() });

/** Saved sheet row → form inputs (derived figures are recalculated, not loaded). */
export function recordToForm(rec: Record<string, unknown>, prev: MaternityFormData): MaternityFormData {
  const s = (k: string) => text(rec[k]);
  const dt = (...keys: string[]) => { for (const k of keys) if (rec[k]) return toDateInput(rec[k]) || ''; return ''; };
  return {
    ...prev,
    employeeName: s('employeeName'), cardNo: s('cardNo'), designation: s('designation'),
    section: text(rec.department || rec.section), aliveChildren: s('aliveChildren'),
    joiningDate: dt('joiningDate'), maternitySymptomDate: dt('maternitySymptomDate'),
    possibleDeliveryDate: dt('deliveryDate', 'possibleDeliveryDate'), maternityLeavenoticedDate: dt('maternityLeavenoticedDate'),
    totalMonthlyWage: text(rec.monthlyWage || rec.totalMonthlyWage),
    latestMonth: s('latestMonth'), latestYear: s('latestYear'),
    installments: buildInstallmentsFromRecord(rec),
    activeInstallmentType: '',                      // always the placeholder on load — the user actively picks
    formDate: dt('formDate') || prev.formDate || todayIso(),
  };
}

// ─── The calculation ─────────────────────────────────────────────────────────

export interface MaternityCalc {
  years: number; months: number; days: number;
  serviceOk: boolean; childrenOk: boolean; eligible: boolean; eligibility: string;
  leaveStart: string; leaveEnd: string;
  dailyStr: string; daily: number;
  inst: string; benefitDays: number; benefit: number;
  salary: number; payableEL: number; others: number; total: number;
  firstDue: string; secondDue: string;
}

export function computeMaternity(f: MaternityFormData): MaternityCalc {
  const hasDates = Boolean(f.joiningDate && f.possibleDeliveryDate);
  const dur = hasDates ? MaternityFormula.calculateServiceDuration(f.joiningDate, f.possibleDeliveryDate) : { years: 0, months: 0, days: 0 };
  const alive = parseInt(f.aliveChildren, 10) || 0;
  const serviceOk = dur.years * 12 + dur.months >= MATERNITY_CONSTANTS.ELIGIBILITY_MONTHS;
  const childrenOk = alive <= MATERNITY_CONSTANTS.ELIGIBILITY_ALIVE_CHILDREN;
  const eligibility = hasDates ? MaternityFormula.checkCombinedEligibility(dur.years, dur.months, alive) : '';
  const eligible = eligibility === 'অধিকারী';

  const leaveStart = f.possibleDeliveryDate ? addDaysIso(f.possibleDeliveryDate, -(MATERNITY_CONSTANTS.PRE_DELIVERY_DAYS - 1)) : '';
  const leaveEnd = leaveStart ? addDaysIso(leaveStart, MATERNITY_CONSTANTS.MATERNITY_LEAVE_DAYS_OFFSET) : '';

  const dailyStr = MaternityFormula.calculateDailyGross(f.totalMonthlyWage);
  const daily = Number(dailyStr) || 0;
  const inst = f.activeInstallmentType;
  const benefitDays = inst === '' ? 0 : inst === '১ম+২য় কিস্তি' ? 120 : 60;
  const benefit = eligible ? benefitDays * daily : 0;

  const draft = getActiveInstallmentDraft(f.installments, inst);
  const salary = MaternityFormula.calculateEarnedWage(draft.earnedLeaveDays, dailyStr, draft.currentMonth, draft.currentYear);
  const payableEL = MaternityFormula.calculatePayableEarnedLeave(draft.payableEarnedLeaveDays, dailyStr);
  const others = MaternityFormula.calculateOtherBenefits(draft.otherBenefitsValue, draft.otherBenefitsType, f.totalMonthlyWage);

  return {
    years: dur.years, months: dur.months, days: dur.days, serviceOk, childrenOk, eligible, eligibility,
    leaveStart, leaveEnd, dailyStr, daily, inst, benefitDays, benefit, salary, payableEL, others,
    total: benefit + salary + payableEL + others,      // the bill adds the same four lines
    firstDue: eligible && f.maternityLeavenoticedDate ? addWorkingDays(f.maternityLeavenoticedDate, PAY_RULES.first.workingDays) : '',
    secondDue: eligible && f.possibleDeliveryDate ? addWorkingDays(f.possibleDeliveryDate, PAY_RULES.second.workingDays) : '',
  };
}

/**
 * The installments array to SAVE: the selected installment is written (created or updated in place) as 'paid'
 * from the current inputs; every other saved installment is kept as it is. No installment selected → unchanged.
 */
export function commitInstallment(f: MaternityFormData, c: MaternityCalc): MaternityInstallment[] {
  const inst = f.activeInstallmentType;
  if (inst !== 'প্রথম কিস্তি' && inst !== 'দ্বিতীয় কিস্তি' && inst !== '১ম+২য় কিস্তি') return f.installments;
  const draft = getActiveInstallmentDraft(f.installments, inst);
  const entry: MaternityInstallment = {
    ...draft, type: inst, status: 'paid', date: f.formDate,
    amount: (c.benefitDays * c.daily).toFixed(0), salary: c.salary.toFixed(0), others: c.others.toFixed(0),
  };
  const idx = f.installments.findIndex(i => i.type === inst);
  if (idx >= 0) { const next = [...f.installments]; next[idx] = entry; return next; }
  return [...f.installments, entry];
}

/** Form + derived values — exactly what maternityBill.tsx and the saved row expect. */
export function resolveMaternity(f: MaternityFormData, c: MaternityCalc): MaternityFormData {
  const days = c.inst === '১ম+২য় কিস্তি' ? 120 : 60;
  return {
    ...f,
    serviceYears: String(c.years), serviceMonths: String(c.months), serviceDays: String(c.days),
    eligibilityStatus: c.eligibility,
    maternityLeaveStartDate: c.leaveStart, maternityLeaveEndDate: c.leaveEnd,
    dailyGross: c.dailyStr, benifitDays: String(days), benefitAmount: (days * c.daily).toFixed(2),
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface Issue { field: string; text: string }
export interface MaternityIssues { errors: Issue[]; warnings: string[] }

export function validateMaternity(f: MaternityFormData, c: MaternityCalc): MaternityIssues {
  const errors: Issue[] = [], warnings: string[] = [];
  if (!f.employeeName.trim()) errors.push({ field: 'employeeName', text: 'কর্মীর নাম দিন।' });
  if (!f.joiningDate) errors.push({ field: 'joiningDate', text: 'যোগদানের তারিখ দিন।' });
  if (!f.possibleDeliveryDate) errors.push({ field: 'possibleDeliveryDate', text: 'সম্ভাব্য প্রসবের তারিখ দিন।' });
  if (f.joiningDate && f.possibleDeliveryDate && f.possibleDeliveryDate < f.joiningDate) errors.push({ field: 'possibleDeliveryDate', text: 'প্রসবের তারিখ যোগদানের তারিখের আগে হতে পারে না।' });
  if (n(f.totalMonthlyWage) <= 0) errors.push({ field: 'totalMonthlyWage', text: 'মোট মাসিক মজুরি দিন।' });

  if (f.aliveChildren.trim() === '') warnings.push('জীবিত সন্তান সংখ্যা দেওয়া হয়নি — ০ ধরে যোগ্যতা যাচাই হচ্ছে।');
  if (f.maternityLeavenoticedDate && f.maternityLeaveStartDate && f.maternityLeavenoticedDate > c.leaveStart && c.leaveStart) warnings.push('নোটিশের তারিখ ছুটি শুরুর তারিখের পরে।');
  if (f.maternitySymptomDate && f.possibleDeliveryDate && f.maternitySymptomDate > f.possibleDeliveryDate) warnings.push('প্রসূতি লক্ষণের তারিখ প্রসবের তারিখের পরে।');
  if (c.eligible && !c.inst) warnings.push('কিস্তি নির্বাচন করা হয়নি — সংরক্ষণ করলে শুধু তথ্য সংরক্ষিত হবে, কোনো কিস্তি পরিশোধিত গণ্য হবে না।');
  if (c.eligible && !f.maternityLeavenoticedDate) warnings.push('নোটিশের তারিখ নেই — ১ম কিস্তির সময়সীমা হিসাব করা যাচ্ছে না।');
  if (f.eligibilityStatus === '' && c.eligibility && !c.eligible) warnings.push(!c.serviceOk ? 'চাকরির মেয়াদ ৬ মাসের কম — সুবিধা প্রযোজ্য নয়।' : 'জীবিত সন্তান ১ এর বেশি — সুবিধা প্রযোজ্য নয়।');
  return { errors, warnings };
}

// ─── Saved rows for the Statement ────────────────────────────────────────────

export type MatStatus = 'NA' | 'Pending' | 'Partial' | 'Paid';
export const STATUS_STYLE: Record<MatStatus, { bg: string; color: string; label: string }> = {
  Pending: { bg: '#fef3c7', color: '#92400e', label: 'বকেয়া' },
  Partial: { bg: '#dbeafe', color: '#1d4ed8', label: 'আংশিক' },
  Paid:    { bg: '#dcfce7', color: '#166534', label: 'পরিশোধিত' },
  NA:      { bg: '#f1f5f9', color: '#64748b', label: 'প্রযোজ্য নয়' },
};

export interface InstView {
  paid: boolean; paidDate: string; due: string; daysLeft: number | null; amount: number;
  combined: boolean;                      // paid together with the other installment (১ম+২য় কিস্তি)
}
export interface MaternityRow {
  id: string; savedAt: string; name: string; cardNo: string; designation: string; section: string; aliveChildren: string; joining: string;
  eligible: boolean; eligibility: string; notice: string; delivery: string; leaveStart: string; leaveEnd: string;
  service: string; serviceKey: number; wage: number; daily: number;     // serviceKey = sortable length of service
  first: InstView; second: InstView;
  totalPaid: number; pendingAmount: number; status: MatStatus; overdue: number;
}

export function buildMaternityRows(records: DbRecord[], today: string = todayIso()): MaternityRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    const s = (k: string) => text(r[k]).trim();
    const dt = (...keys: string[]) => { for (const k of keys) if (r[k]) return toDateInput(r[k]) || ''; return ''; };
    const wage = n(r.monthlyWage) || n(r.totalMonthlyWage);
    const dailyStr = n(r.dailyGross) > 0 ? String(n(r.dailyGross)) : MaternityFormula.calculateDailyGross(String(wage));
    const daily = Number(dailyStr) || 0;
    const eligible = s('eligibilityStatus') === 'অধিকারী';
    const notice = dt('maternityLeavenoticedDate'), delivery = dt('deliveryDate', 'possibleDeliveryDate');

    const paid = buildInstallmentsFromRecord(r).filter(i => i.status === 'paid');
    const entry = (type: string) => paid.find(i => i.type === type);
    const total = (i: ReturnType<typeof entry>) => !i ? 0 : n(i.amount) + n(i.salary) + n(i.others) + MaternityFormula.calculatePayableEarnedLeave(i.payableEarnedLeaveDays, dailyStr);
    const first = entry('প্রথম কিস্তি'), second = entry('দ্বিতীয় কিস্তি'), both = entry('১ম+২য় কিস্তি');

    const firstDue = eligible && notice ? addWorkingDays(notice, PAY_RULES.first.workingDays) : '';
    const secondDue = eligible && delivery ? addWorkingDays(delivery, PAY_RULES.second.workingDays) : '';
    const view = (e: typeof first, comb: boolean, due: string, isFirst: boolean): InstView => {
      const done = Boolean(e) || Boolean(both);
      return {
        paid: done, paidDate: (e ?? both)?.date ? toDateInput((e ?? both)!.date) || '' : '', due, daysLeft: due ? daysFrom(today, due) : null,
        amount: done ? (e ? total(e) : (isFirst ? total(both) : 0)) : MATERNITY_CONSTANTS.PRE_DELIVERY_DAYS * daily,
        combined: comb && done,
      };
    };
    const v1 = view(first, Boolean(both), firstDue, true), v2 = view(second, Boolean(both), secondDue, false);
    const pendingAmount = eligible ? (v1.paid ? 0 : v1.amount) + (v2.paid ? 0 : v2.amount) : 0;
    const status: MatStatus = !eligible ? 'NA' : v1.paid && v2.paid ? 'Paid' : v1.paid || v2.paid ? 'Partial' : 'Pending';
    const late = (v: InstView) => (eligible && !v.paid && v.daysLeft !== null && v.daysLeft < 0 ? 1 : 0);
    return {
      id: s('id'), savedAt: s('savedAt'), name: s('employeeName') || '—', cardNo: s('cardNo'), designation: s('designation'),
      section: s('department') || s('section'), aliveChildren: s('aliveChildren'), joining: dt('joiningDate'),
      eligible, eligibility: s('eligibilityStatus'), notice, delivery, leaveStart: dt('leaveStartDate', 'maternityLeaveStartDate'),
      leaveEnd: dt('leaveEndDate', 'maternityLeaveEndDate'),
      service: `${n(r.serviceYears)} বছর ${n(r.serviceMonths)} মাস ${n(r.serviceDays)} দিন`,
      serviceKey: n(r.serviceYears) * 372 + n(r.serviceMonths) * 31 + n(r.serviceDays), wage, daily,
      first: v1, second: v2, totalPaid: total(first) + total(second) + total(both), pendingAmount, status, overdue: late(v1) + late(v2),
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export type MatSortField = 'name' | 'cardNo' | 'delivery' | 'service' | 'wage' | 'total' | 'first' | 'second' | '';
/** Month-Year filter basis: 1st installment date · 2nd installment date · either installment (১ম কিস্তি + ২য় কিস্তি). */
export type MonthBasis = 'first' | 'second' | 'both';
export interface MaternityFilters {
  search: string;
  status: string[];                        // 'Pending' | 'Partial' | 'Paid' | 'NA'; [] = all
  basis: MonthBasis;                       // what the Month-Year filter looks at
  year: string; month: string;             // Month-Year filter: records whose leave period overlaps that year / month ('' = any; month '01'…'12' needs a year)
  columns: Record<string, string[]>;       // cardNo / designation / section / eligibility / delivery / service / wage / total
  sort: { field: MatSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_MATERNITY_FILTERS: MaternityFilters = { search: '', status: [], basis: 'both', year: '', month: '', columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';
/** The date an installment cell shows: its paid date once paid, otherwise its time limit ('' when not eligible / unknown). */
export const instDateOf = (r: MaternityRow, which: 'first' | 'second'): string => {
  if (!r.eligible) return '';
  const v = r[which];
  return v.paid ? v.paidDate : v.due;
};
export function columnValue(r: MaternityRow, field: string): string {
  const v = field === 'cardNo' ? r.cardNo
    : field === 'designation' ? r.designation
    : field === 'section' ? r.section
    : field === 'eligibility' ? r.eligibility
    : field === 'delivery' ? formatDMY(r.delivery)
    : field === 'first' ? formatDMY(instDateOf(r, 'first'))
    : field === 'second' ? formatDMY(instDateOf(r, 'second'))
    : field === 'service' ? r.service
    : field === 'wage' ? money(r.wage)
    : field === 'total' ? money(r.totalPaid)
    : '';
  return v.trim() || BLANK_VALUE;
}
/** First and last day (ISO) of a year, or of one month of it. */
export function monthRange(year: string, month: string): { from: string; to: string } {
  const y = Number(year), m = Number(month);
  if (!month || !m) return { from: `${year}-01-01`, to: `${year}-12-31` };
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` };
}
export function countActiveFilters(f: MaternityFilters): number {
  return [f.search.trim(), f.status.length > 0, f.year, f.year && f.month].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

export function filterRows(rows: MaternityRow[], f: MaternityFilters): MaternityRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.year) {
      const { from, to } = monthRange(f.year, f.month);
      const within = (iso: string) => iso !== '' && iso >= from && iso <= to;
      const first = within(instDateOf(r, 'first')), second = within(instDateOf(r, 'second'));
      const ok = f.basis === 'first' ? first : f.basis === 'second' ? second : first || second;
      if (!ok) return false;
    }
    if (f.status.length && !f.status.includes(r.status)) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const hay = `${r.name} ${r.cardNo} ${r.designation} ${r.section} ${r.eligibility}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    if (field === 'total') return m * (a.totalPaid - b.totalPaid);
    if (field === 'wage') return m * (a.wage - b.wage);
    if (field === 'first' || field === 'second') {
      const p = instDateOf(a, field), q = instDateOf(b, field);
      if (!p && !q) return 0;
      if (!p) return 1;                    // blanks always last
      if (!q) return -1;
      return m * p.localeCompare(q);
    }
    if (field === 'service') return m * (a.serviceKey - b.serviceKey);
    const x = field === 'name' ? a.name : field === 'cardNo' ? a.cardNo : a.delivery;
    const y = field === 'name' ? b.name : field === 'cardNo' ? b.cardNo : b.delivery;
    if (!x && !y) return 0;
    if (!x) return 1;                      // blanks always last
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: MaternityRow[]) {
  const pend = rows.filter(r => r.status === 'Pending' || r.status === 'Partial');
  return {
    count: rows.length, totalPaid: rows.reduce((s, r) => s + r.totalPaid, 0),
    pendingCount: pend.length, pendingAmount: pend.reduce((s, r) => s + r.pendingAmount, 0),
    paidCount: rows.filter(r => r.status === 'Paid').length, overdue: rows.reduce((s, r) => s + r.overdue, 0),
  };
}