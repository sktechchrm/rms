// ─────────────────────────────────────────────────────────────────────────────
// leftNoticeModel.ts — Left Worker Notice: blank state, record ↔ employee, the notice-date calculation,
// validation, and the saved-row list engine (rows / filters / sort / summary) for the Statement.
// Path: src/components/modules/LeftEmployeeNotice/leftNoticeModel.ts
//
// computeNotice(employee) derives the three letter dates from the absence start date — no effects:
//   পত্র-১ = absence start + 10 working days
//   পত্র-২ = পত্র-১ + 10 working days
//   পত্র-৩ = পত্র-২ + 7 working days
// Working days skip Friday + Saturday and the fixed public holidays listed below (same rule as before).
// Saved data format (all column names, addressesJson) is unchanged — old records open normally.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import type { Address, Employee } from './LeftNoticeDataType';
import { initialEmployee, formatAddress } from './LeftNoticeDataType';
import { toDateInput } from '../../../utils/dateUtils';

// ─── Rules ───────────────────────────────────────────────────────────────────

export const NOTICE_RULES = { first: 10, second: 10, third: 7 };   // working days between the steps
const HOLIDAYS = new Set(['02-21', '03-26', '04-14', '05-01', '08-15', '12-16']);   // MM-DD, fixed-date holidays only
export const SOON_DAYS = 3;                                        // "N দিন বাকি" is highlighted when this close

// ─── Date helpers ────────────────────────────────────────────────────────────

const pad2 = (x: number) => String(x).padStart(2, '0');
const validIso = (iso: string) => /^\d{4}-\d{2}-\d{2}/.test(iso ?? '');

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
/** ISO date ± days, calendar-safe (no time-zone shifts). '' when not a date. */
export function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
const isOffDay = (iso: string) => {
  const dow = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getUTCDay();
  return dow === 5 || dow === 6 || HOLIDAYS.has(iso.slice(5, 10));
};
/** ISO date + N working days (Friday, Saturday and the fixed holidays are skipped). '' when not a date. */
export function addWorkingDays(iso: string, count: number): string {
  if (!validIso(iso)) return '';
  let cur = iso.slice(0, 10), left = count;
  while (left > 0) {
    cur = addDaysIso(cur, 1);
    if (!isOffDay(cur)) left--;
  }
  return cur;
}
export function daysFrom(from: string, to: string): number | null {
  if (!validIso(from) || !validIso(to)) return null;
  return Math.round((new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime()) / 86400000);
}

// ─── Gender normalisation ────────────────────────────────────────────────────
// The form's select only knows 'male' | 'female' | 'third'. The Personal File stores gender in its own
// casing / language — this maps the known variants down to those three codes (unknown values pass through).
const GENDER_MAP: Record<string, 'male' | 'female' | 'third'> = {
  male: 'male', m: 'male', পুরুষ: 'male',
  female: 'female', f: 'female', নারী: 'female', মহিলা: 'female',
  third: 'third', other: 'third', others: 'third', trans: 'third', transgender: 'third',
  তৃতীয়: 'third', 'তৃতীয় লিঙ্গ': 'third', 'অ-দ্বৈত': 'third', হিজড়া: 'third',
};
export const normalizeGender = (raw: unknown): string => {
  const v = String(raw ?? '').trim();
  if (!v) return '';
  return GENDER_MAP[v.toLowerCase()] ?? GENDER_MAP[v] ?? v;
};

// ─── Blank state + record → employee ─────────────────────────────────────────

export const blankEmployee = (): Employee => ({
  ...initialEmployee, date: todayIso(),
  presentAddress: { ...initialEmployee.presentAddress }, permanentAddress: { ...initialEmployee.permanentAddress },
});

/** Saved sheet row → form inputs (the three notice dates are recalculated, not loaded). */
export function recordToEmployee(rec: Record<string, unknown>, prev: Employee): Employee {
  let addresses: { present?: Partial<Address>; permanent?: Partial<Address> } = {};
  try { addresses = JSON.parse(String(rec.addressesJson ?? '{}')) ?? {}; } catch { /* malformed JSON → keep blanks */ }
  const dt = (k: string) => (rec[k] ? toDateInput(rec[k]) || '' : '');
  return {
    ...prev,
    name: String(rec.employeeName ?? ''), fatherName: String(rec.fatherName ?? ''), motherName: String(rec.motherName ?? ''),
    gender: String(rec.gender ?? ''), husbandName: String(rec.husbandName ?? ''),
    cardNo: String(rec.cardNo ?? ''), designation: String(rec.designation ?? ''), section: String(rec.department ?? ''),
    date: dt('date') || prev.date || todayIso(), joiningDate: dt('joiningDate'), absenceStartDate: dt('absentFrom'),
    presentAddress: { ...initialEmployee.presentAddress, ...(addresses.present ?? {}) },
    permanentAddress: { ...initialEmployee.permanentAddress, ...(addresses.permanent ?? {}) },
  };
}

// ─── The calculation ─────────────────────────────────────────────────────────

export interface NoticeCalc { first: string; second: string; third: string; daysAbsent: number | null }

export function computeNotice(e: Employee): NoticeCalc {
  const first = e.absenceStartDate ? addWorkingDays(e.absenceStartDate, NOTICE_RULES.first) : '';
  const second = first ? addWorkingDays(first, NOTICE_RULES.second) : '';
  const third = second ? addWorkingDays(second, NOTICE_RULES.third) : '';
  return { first, second, third, daysAbsent: e.absenceStartDate ? daysFrom(e.absenceStartDate, todayIso()) : null };
}

/** The Employee with its derived notice dates and the factory details — what the letters, envelopes and the saved row use. */
export function resolveEmployee(e: Employee, c: NoticeCalc, company: { name: string; address: string }): Employee {
  return { ...e, firstNoticeDate: c.first, secondNoticeDate: c.second, thirdNoticeDate: c.third, companyName: company.name, companyAddress: company.address };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface Issue { field: string; text: string }
export interface NoticeIssues { errors: Issue[]; warnings: string[] }

export function validateNotice(e: Employee, c: NoticeCalc, today: string = todayIso()): NoticeIssues {
  const errors: Issue[] = [], warnings: string[] = [];
  if (!e.name.trim()) errors.push({ field: 'name', text: 'কর্মীর নাম দিন।' });
  if (!e.cardNo.trim()) errors.push({ field: 'cardNo', text: 'কার্ড নং দিন।' });
  if (!e.designation.trim()) errors.push({ field: 'designation', text: 'পদবী দিন।' });
  if (!e.absenceStartDate) errors.push({ field: 'absenceStartDate', text: 'অনুপস্থিতির শুরুর তারিখ দিন — নোটিশের তারিখ এটি থেকেই হিসাব হয়।' });
  if (e.joiningDate && e.absenceStartDate && e.absenceStartDate < e.joiningDate) errors.push({ field: 'absenceStartDate', text: 'অনুপস্থিতির তারিখ যোগদানের তারিখের আগে হতে পারে না।' });

  if (!e.gender) warnings.push('লিঙ্গ নির্বাচন করা হয়নি।');
  if (!e.fatherName.trim() && !(e.husbandName ?? '').trim()) warnings.push('পিতা / স্বামীর নাম নেই — চিঠিতে ফাঁকা (—) আসবে।');
  if (!e.presentAddress.village.trim() || !e.presentAddress.district.trim()) warnings.push('বর্তমান ঠিকানায় গ্রাম ও জেলা দিন — খামে ঠিকানা অসম্পূর্ণ আসবে।');
  if (!e.permanentAddress.village.trim() || !e.permanentAddress.district.trim()) warnings.push('স্থায়ী ঠিকানায় গ্রাম ও জেলা দিন — খামে ঠিকানা অসম্পূর্ণ আসবে।');
  if (e.absenceStartDate && e.absenceStartDate > today) warnings.push('অনুপস্থিতির তারিখ আজকের পরের।');
  if (c.third && c.third > today) warnings.push(`চূড়ান্ত পত্রের তারিখ ${formatDMY(c.third)} — এর আগে চূড়ান্ত পত্র ইস্যু করবেন না।`);
  return { errors, warnings };
}

// ─── Saved rows for the Statement ────────────────────────────────────────────

export type Stage = 'Waiting' | 'N1' | 'N2' | 'Final';
export const STAGE_STYLE: Record<Stage, { bg: string; color: string; label: string }> = {
  Waiting: { bg: '#f1f5f9', color: '#475569', label: 'অপেক্ষমান' },
  N1:      { bg: '#fef3c7', color: '#92400e', label: 'পত্র-১ পর্যায়' },
  N2:      { bg: '#ffedd5', color: '#c2410c', label: 'পত্র-২ পর্যায়' },
  Final:   { bg: '#fee2e2', color: '#b91c1c', label: 'চূড়ান্ত (ইস্তফা গণ্য)' },
};
export interface NoticeStep { date: string; daysLeft: number | null }   // daysLeft: > 0 future, 0 today, < 0 past

export interface NoticeRow {
  id: string; savedAt: string; name: string; cardNo: string; designation: string; section: string; gender: string;
  fatherName: string; husbandName: string; joining: string; absence: string; daysAbsent: number | null;
  n1: NoticeStep; n2: NoticeStep; n3: NoticeStep; stage: Stage;
  presentAddress: string; permanentAddress: string;
}

export function buildNoticeRows(records: DbRecord[], today: string = todayIso()): NoticeRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    const s = (k: string) => String(r[k] ?? '').trim();
    const dt = (k: string) => (r[k] ? toDateInput(r[k]) || '' : '');
    const absence = dt('absentFrom');
    const calc = computeNotice({ ...initialEmployee, absenceStartDate: absence });
    const d1 = dt('firstNoticeDate') || calc.first, d2 = dt('secondNoticeDate') || calc.second, d3 = dt('thirdNoticeDate') || calc.third;
    const step = (date: string): NoticeStep => ({ date, daysLeft: date ? daysFrom(today, date) : null });
    const n1 = step(d1), n2 = step(d2), n3 = step(d3);
    const stage: Stage = n3.date && today >= n3.date ? 'Final' : n2.date && today >= n2.date ? 'N2' : n1.date && today >= n1.date ? 'N1' : 'Waiting';
    let addr: { present?: Address; permanent?: Address } = {};
    try { addr = JSON.parse(String(r.addressesJson ?? '{}')) ?? {}; } catch { /* ignore */ }
    return {
      id: s('id'), savedAt: s('savedAt'), name: s('employeeName') || '—', cardNo: s('cardNo'), designation: s('designation'), section: s('department'),
      gender: s('gender'), fatherName: s('fatherName'), husbandName: s('husbandName'), joining: dt('joiningDate'), absence,
      daysAbsent: absence ? daysFrom(absence, today) : null, n1, n2, n3, stage,
      presentAddress: addr.present ? formatAddress(addr.present) : '', permanentAddress: addr.permanent ? formatAddress(addr.permanent) : '',
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export type NoticeSortField = 'name' | 'cardNo' | 'absence' | '';
export interface NoticeFilters {
  search: string;
  stage: string[];                         // Stage values; [] = all
  dateFrom: string; dateTo: string;        // absence start range
  columns: Record<string, string[]>;       // cardNo / section / designation
  sort: { field: NoticeSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_NOTICE_FILTERS: NoticeFilters = { search: '', stage: [], dateFrom: '', dateTo: '', columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';
export function columnValue(r: NoticeRow, field: string): string {
  const v = field === 'cardNo' ? r.cardNo : field === 'section' ? r.section : field === 'designation' ? r.designation : '';
  return v.trim() || BLANK_VALUE;
}
export function countActiveFilters(f: NoticeFilters): number {
  return [f.search.trim(), f.stage.length > 0, f.dateFrom, f.dateTo].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

export function filterRows(rows: NoticeRow[], f: NoticeFilters): NoticeRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.dateFrom && (!r.absence || r.absence < f.dateFrom)) return false;
    if (f.dateTo && (!r.absence || r.absence > f.dateTo)) return false;
    if (f.stage.length && !f.stage.includes(r.stage)) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const hay = `${r.name} ${r.cardNo} ${r.designation} ${r.section} ${r.fatherName}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    const x = field === 'name' ? a.name : field === 'cardNo' ? a.cardNo : a.absence;
    const y = field === 'name' ? b.name : field === 'cardNo' ? b.cardNo : b.absence;
    if (!x && !y) return 0;
    if (!x) return 1;                      // blanks always last
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: NoticeRow[], today: string = todayIso()) {
  const c = (st: Stage) => rows.filter(r => r.stage === st).length;
  return {
    count: rows.length, waiting: c('Waiting'), n1: c('N1'), n2: c('N2'), final: c('Final'),
    dueToday: rows.filter(r => r.n1.date === today || r.n2.date === today || r.n3.date === today).length,
  };
}