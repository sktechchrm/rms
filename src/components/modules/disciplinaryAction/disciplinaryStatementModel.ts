// ─────────────────────────────────────────────────────────────────────────────
// disciplinaryStatementModel.ts — Disciplinary Action: the saved-case list engine for the Statement
// (rows / filters / sort / summary). Same structure as LeftEmployeeNotice/leftNoticeModel.ts.
// Path: src/components/modules/disciplinaryAction/disciplinaryStatementModel.ts
//
// Works on the saved record of the 6-step form (referenceNo, showCauseDate, replyStatus, notice2Date, committeeMembersJson,
// notice3Date, evaluationDate, finalDecision, punishmentType …). Nothing about the 6 steps changes.
//
// Deadlines (the Committee form already uses the 50-day figure):
//   reply due     = কারণ দর্শানোর তারিখ + 7  working days
//   enquiry limit = কারণ দর্শানোর তারিখ + 50 working days
// Working days skip Friday and the factory's festival holidays (utils/businessDays).
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';
import { toDateInput } from '../../../utils/dateUtils';

// ─── Rules ───────────────────────────────────────────────────────────────────

export const CASE_RULES = { replyWorkdays: 7, enquiryWorkdays: 50 };
export const SOON_DAYS = 3;                       // "N দিন বাকি" is highlighted when this close

// ─── Date / text helpers ─────────────────────────────────────────────────────

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
export function daysFrom(from: string, to: string): number | null {
  if (!validIso(from) || !validIso(to)) return null;
  return Math.round((new Date(`${to.slice(0, 10)}T00:00:00Z`).getTime() - new Date(`${from.slice(0, 10)}T00:00:00Z`).getTime()) / 86400000);
}

/** Rich-text HTML (from the editors) or legacy **markdown** → plain text, for the Excel file and search. */
export function stripHtml(input: unknown): string {
  const s = String(input ?? '');
  if (!s) return '';
  return s
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<(br|\/div|\/p|\/li|\/ul|\/ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\*\*\*|\*\*/g, '')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Stage ───────────────────────────────────────────────────────────────────

export type Stage = 'Reply' | 'Nomination' | 'Enquiry' | 'Report' | 'Decided' | 'Closed';
export const STAGE_ORDER: Stage[] = ['Reply', 'Nomination', 'Enquiry', 'Report', 'Decided', 'Closed'];
export const STAGE_STYLE: Record<Stage, { bg: string; color: string; label: string }> = {
  Reply:      { bg: '#fef3c7', color: '#92400e', label: 'জবাবের অপেক্ষায়' },
  Nomination: { bg: '#dbeafe', color: '#1d4ed8', label: 'প্রতিনিধি মনোনয়ন' },
  Enquiry:    { bg: '#ede9fe', color: '#6d28d9', label: 'তদন্ত চলমান' },
  Report:     { bg: '#ccfbf1', color: '#0f766e', label: 'প্রতিবেদন দাখিল' },
  Decided:    { bg: '#dcfce7', color: '#15803d', label: 'সিদ্ধান্ত হয়েছে' },
  Closed:     { bg: '#f1f5f9', color: '#475569', label: 'সমাপ্ত (জবাব সন্তোষজনক)' },
};

/** Which printed output a row can open (matches the Manager's handleGenerateNotice targets). */
export type NoticeTarget = 1 | 2 | 3 | 4 | 'evaluation';

export interface DueStep { date: string; daysLeft: number | null }   // daysLeft: > 0 future, 0 today, < 0 past

export interface CaseRow {
  id: string; savedAt: string; referenceNo: string;
  name: string; cardNo: string; designation: string; section: string;
  subject: string; complaint: string;
  showCause: string; replyDue: DueStep; replyDate: string; replyStatus: string;
  notice2: string; notice3: string; memberCount: number; memberNames: string;
  enquiry: DueStep;                                  // the 50-working-day limit
  evaluationDate: string; reportSummary: string; recommendation: string; finalDecision: string; punishment: string;
  stage: Stage;
  daysOpen: number | null;                           // to today (open) or to the completing date (decided / closed)
  /** The deadline that is running right now ('' when none) — drives the overdue / due-soon alert. */
  running: DueStep & { kind: '' | 'reply' | 'enquiry' };
  overdue: boolean; soon: boolean;
  /** The printed output that matches the stage and is complete enough to print; null → open the form instead. */
  letter: NoticeTarget | null;
}

// ─── Saved rows for the Statement ────────────────────────────────────────────

export function buildCaseRows(records: DbRecord[], festivalHolidays: string[], today: string = todayIso()): CaseRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    const s = (k: string) => String(r[k] ?? '').trim();
    const dt = (k: string) => (r[k] ? toDateInput(r[k]) || '' : '');

    const showCause = dt('showCauseDate'), replyDate = dt('replyDate'), replyStatus = s('replyStatus');
    const notice2 = dt('notice2Date'), notice3 = dt('notice3Date'), evaluationDate = dt('evaluationDate');
    const reportSummary = stripHtml(r.investigationReportSummary), recommendation = stripHtml(r.recommendation), finalDecision = stripHtml(r.finalDecision);
    const complaint = stripHtml(r.complaint);

    let members: { name?: string }[] = [];
    try { const p = JSON.parse(String(r.committeeMembersJson ?? '[]')); if (Array.isArray(p)) members = p; } catch { /* malformed → none */ }
    const named = members.map(m => String(m?.name ?? '').trim()).filter(Boolean);
    const memberCount = Number(r.numberOfCommitteeMembers) || named.length;

    // current stage = the furthest step that holds real data
    const stage: Stage =
      replyStatus === 'সন্তোষজনক' ? 'Closed'
      : finalDecision ? 'Decided'
      : (evaluationDate || reportSummary) ? 'Report'
      : (notice3 || named.length > 0) ? 'Enquiry'
      : (notice2 || replyStatus === 'অসন্তোষজনক' || memberCount > 0) ? 'Nomination'
      : 'Reply';

    const step = (date: string): DueStep => ({ date, daysLeft: date ? daysFrom(today, date) : null });
    const replyDue = step(showCause ? addDaysSkippingHolidays(showCause, CASE_RULES.replyWorkdays, festivalHolidays) : '');
    const enquiry  = step(showCause ? addDaysSkippingHolidays(showCause, CASE_RULES.enquiryWorkdays, festivalHolidays) : '');

    let running: CaseRow['running'] = { date: '', daysLeft: null, kind: '' };
    if (stage === 'Reply' && !replyDate) running = { ...replyDue, kind: 'reply' };
    else if (stage === 'Nomination' || stage === 'Enquiry' || stage === 'Report') running = { ...enquiry, kind: 'enquiry' };
    const overdue = running.daysLeft !== null && running.daysLeft < 0;
    const soon = running.daysLeft !== null && running.daysLeft >= 0 && running.daysLeft <= SOON_DAYS;

    const endDate = stage === 'Decided' ? (evaluationDate || today) : stage === 'Closed' ? (replyDate || today) : today;

    // which printed output this case can open — the same readiness rules the Manager's ফলাফল list uses
    const ready = {
      1: !!(s('employeeName') && s('cardNo') && complaint && showCause),
      2: memberCount > 0 && !!notice2,
      3: memberCount > 0 && members.length === memberCount && members.every(m => String(m?.name ?? '').trim() !== '') && !!notice3,
      evaluation: !!(reportSummary && recommendation && evaluationDate),
      4: !!(finalDecision && evaluationDate),
    };
    const ceiling: NoticeTarget[] =
      stage === 'Decided' ? [4, 'evaluation', 3, 2, 1] : stage === 'Report' ? ['evaluation', 3, 2, 1] : stage === 'Enquiry' ? [3, 2, 1] : stage === 'Nomination' ? [2, 1] : [1];
    const letter = ceiling.find(t => ready[t]) ?? null;

    return {
      id: s('id'), savedAt: s('savedAt'), referenceNo: s('referenceNo'),
      name: s('employeeName') || '—', cardNo: s('cardNo'), designation: s('designation'), section: s('section'),
      subject: s('subject'), complaint,
      showCause, replyDue, replyDate, replyStatus, notice2, notice3, memberCount, memberNames: named.join(', '),
      enquiry, evaluationDate, reportSummary, recommendation, finalDecision, punishment: s('punishmentType'),
      stage, daysOpen: showCause ? daysFrom(showCause, endDate) : null, running, overdue, soon, letter,
    };
  }).sort((a, b) => (b.showCause || b.savedAt).localeCompare(a.showCause || a.savedAt));
}

// ─── Filters / sort / summary ────────────────────────────────────────────────

export type CaseSortField = 'name' | 'cardNo' | 'showCause' | '';
export interface CaseFilters {
  search: string;
  stage: string[];                         // Stage values; [] = all
  dateFrom: string; dateTo: string;        // কারণ দর্শানোর তারিখ range
  overdueOnly: boolean;
  columns: Record<string, string[]>;       // cardNo / section / designation
  sort: { field: CaseSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_CASE_FILTERS: CaseFilters = { search: '', stage: [], dateFrom: '', dateTo: '', overdueOnly: false, columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';
export function columnValue(r: CaseRow, field: string): string {
  const v = field === 'cardNo' ? r.cardNo : field === 'section' ? r.section : field === 'designation' ? r.designation : '';
  return v.trim() || BLANK_VALUE;
}
export function countActiveFilters(f: CaseFilters): number {
  return [f.search.trim(), f.stage.length > 0, f.dateFrom, f.dateTo, f.overdueOnly].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

export function filterRows(rows: CaseRow[], f: CaseFilters): CaseRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.dateFrom && (!r.showCause || r.showCause < f.dateFrom)) return false;
    if (f.dateTo && (!r.showCause || r.showCause > f.dateTo)) return false;
    if (f.stage.length && !f.stage.includes(r.stage)) return false;
    if (f.overdueOnly && !r.overdue) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const hay = `${r.name} ${r.cardNo} ${r.designation} ${r.section} ${r.referenceNo} ${r.complaint} ${r.punishment}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    const x = field === 'name' ? a.name : field === 'cardNo' ? a.cardNo : a.showCause;
    const y = field === 'name' ? b.name : field === 'cardNo' ? b.cardNo : b.showCause;
    if (!x && !y) return 0;
    if (!x) return 1;                      // blanks always last
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: CaseRow[]) {
  const c = (st: Stage) => rows.filter(r => r.stage === st).length;
  return {
    count: rows.length, reply: c('Reply'), nomination: c('Nomination'), enquiry: c('Enquiry'), report: c('Report'), decided: c('Decided'), closed: c('Closed'),
    inEnquiry: c('Nomination') + c('Enquiry') + c('Report'),
    overdue: rows.filter(r => r.overdue).length,
    soon: rows.filter(r => r.soon).length,
  };
}
