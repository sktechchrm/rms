// ─────────────────────────────────────────────────────────────────────────────
// Corrective Action Plan (CAP) / Non-Conformance Record — types
// Path: src/components/modules/correctiveAction/types.ts
//
// Two parts per entry:
//   PART 1 · Audit (once per buyer audit): Audited by, Audit Date, audit duration
//            (Audit Date + 0 … 5 days) → audit end date (calculated).
//   PART 2 · Non-conformance (one record per NC): NC ID, NC Reference, NC Category,
//            Responsible Person(s), NC Description, Root Cause Analysis, Corrective Action
//            Plan (CAP), Target Completion Date, CAP Status, Evidence 1–3.
// The audit header is kept after each NC is saved, so the next NC of the same audit does
// not need it again. "SL No." is the row number and "Overdue" is calculated (see below).
//
// EVIDENCE 1–3: each holds a file attachment (PNG, JPEG, JPG, PDF, Word, Excel) or a pasted
// link. An attached file is uploaded to Google Drive through the Apps Script backend (see
// evidenceUpload.ts); the record stores only the file's link (evidenceN) and name (evidenceNName).
//
// CAP STATUS (dropdown): Open / In Progress / Ongoing / Completed / Corrected / Closed /
// Pending Evidence / Pending Verification. DONE_STATUSES lists the ones that count as finished.
//
// OVERDUE (auto): a record that is not finished and whose Target Completion Date has passed.
//   Overdue   target passed, not finished     Due Soon  target within DUE_SOON_DAYS
//   On Track  target further away             Done      CAP Status is finished
//   No Date   no target date entered
//
// All dates are stored and computed as ISO (YYYY-MM-DD); formatDMY() converts to DD-MM-YYYY for display only.
//
// AUDIT PERIOD: the Audit Date column everywhere (Statement, its column filter, Print, PDF, Excel) shows the period
// auditDate → auditEndDate. A record stores auditDate, auditDays and auditEndDate (see Manager buildRecord).
// The date-range / Month-Year filters and sorting use the audit's first day.
//
// Statement filters (shared by the Statement table, Print Preview, Excel and the hidden print copy):
//   - dateFrom / dateTo → Audit Date range
//   - monthBasis + month → Month-Year matched against the Audit Date ('audit') or Target Date ('target')
//   - auditedBy → exact Audited by (buyer / auditor) name
//   - capStatus → exact CAP Status;  statuses → deadline states (multi-select)
//   - columns → column-header filters (multi-select, [] = all; empty cells match "(Blank)")
//   - sort → NC ID or Audit Date (natural order; blanks last). Not counted as a filter.
//   - search → words match Audited by / NC ID / NC Description / NC Reference / Category /
//     Root Cause / CAP / Responsible Person(s). A standalone 4-digit year (e.g. 2026) matches the
//     Audit Date OR Target Completion Date year.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export const CAP_STATUS_OPTIONS = [
  'Open', 'In Progress', 'Ongoing', 'Completed', 'Corrected', 'Closed', 'Pending Evidence', 'Pending Verification',
];
/** CAP Status values that count as finished (never Overdue / Due Soon). */
export const DONE_STATUSES = ['Completed', 'Corrected', 'Closed'];
export const DUE_SOON_DAYS = 14;

// ─── Audit duration: Audit Date + 0 … 5 days ────────────────────────────────

export const AUDIT_DURATION_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

/** ISO date + N days, calendar-safe (no time-zone shifts). '' when the start is not a date. */
export function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return '';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Extra audit days of a record, 0–5 (older records without the field = 0). */
export function auditDaysOf(rec: Record<string, unknown>): number {
  return Math.min(5, Math.max(0, Math.trunc(Number(rec.auditDays) || 0)));
}

/**
 * The audit END date (ISO) of a record: its saved auditEndDate, or — if that is missing — auditDate + auditDays.
 * Never before the audit date. '' when there is no audit date.
 */
export function auditEndOf(rec: Record<string, unknown>): string {
  const start = String(rec.auditDate ?? '').slice(0, 10);
  if (!start) return '';
  const saved = String(rec.auditEndDate ?? '').slice(0, 10);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : addDaysIso(start, auditDaysOf(rec));
  return end < start ? start : end;
}

export interface CorrectiveActionData {
  // PART 1 — audit (once per buyer audit)
  auditConductedBy: string;
  auditDate: string;
  /** Extra days after the audit date: '0' … '5'. */
  auditDays: string;
  /** Calculated: auditDate + auditDays (ISO). Stored with the record. */
  auditEndDate: string;

  // PART 2 — non-conformance
  ncId: string;
  ncDescription: string;
  ncReference: string;
  ncCategory: string;
  rootCause: string;
  correctiveAction: string;
  targetDate: string;
  responsiblePersons: string;
  capStatus: string;
  /** Evidence link (uploaded file or pasted link) and the attached file's name. */
  evidence1: string;
  evidence1Name: string;
  evidence2: string;
  evidence2Name: string;
  evidence3: string;
  evidence3Name: string;

  factoryName: string;
  factoryAddress: string;
}

export interface CorrectiveActionFormProps {
  data: CorrectiveActionData;
  setData: (data: CorrectiveActionData) => void;
  /** Called with true while any evidence file is uploading (the Manager blocks Save meanwhile). */
  onUploadingChange?: (uploading: boolean) => void;
}

export const INITIAL_CORRECTIVE_ACTION_STATE: CorrectiveActionData = {
  auditConductedBy: '',
  auditDate: '',
  auditDays: '0',
  auditEndDate: '',
  ncId: '',
  ncDescription: '',
  ncReference: '',
  ncCategory: '',
  rootCause: '',
  correctiveAction: '',
  targetDate: '',
  responsiblePersons: '',
  capStatus: 'Open',
  evidence1: '', evidence1Name: '',
  evidence2: '', evidence2Name: '',
  evidence3: '', evidence3Name: '',
  factoryName: '',
  factoryAddress: '',
};

/** Formats an ISO date (YYYY-MM-DD) as DD-MM-YYYY for display only; unchanged if not ISO. */
export function formatDMY(isoDate: string): string {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return isoDate;
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

// ─── Deadline state ──────────────────────────────────────────────────────────

export type CapState = 'overdue' | 'due-soon' | 'on-track' | 'done' | 'no-date';

export const CAP_STATE_STYLE: Record<CapState, { label: string; bg: string; color: string }> = {
  'overdue':  { label: 'Overdue',  bg: '#fee2e2', color: '#b91c1c' },
  'due-soon': { label: 'Due Soon', bg: '#fef3c7', color: '#92400e' },
  'on-track': { label: 'On Track', bg: '#dbeafe', color: '#1d4ed8' },
  'done':     { label: 'Done',     bg: '#dcfce7', color: '#166534' },
  'no-date':  { label: 'No Date',  bg: '#f1f5f9', color: '#475569' },
};

/** Today as local ISO YYYY-MM-DD (local, not UTC — avoids the off-by-one around midnight). */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole days from `fromIso` to `toIso` (negative if `toIso` is earlier); null if either is invalid. */
function daysBetween(fromIso: string, toIso: string): number | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(fromIso);
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(toIso);
  if (!a || !b) return null;
  const da = Date.UTC(+a[1], +a[2] - 1, +a[3]);
  const db = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  return Math.round((db - da) / 86400000);
}

export const plural = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

export interface CapStateResult {
  state: CapState;
  /** e.g. "6 days left", "Due today", "12 days overdue"; '' when there is nothing to say. */
  detail: string;
  /** Days past the target date for an Overdue record, otherwise null. */
  overdueDays: number | null;
}

export function getCapState(targetDate: string, capStatus: string, today: string = todayIso()): CapStateResult {
  const status = (capStatus ?? '').trim().toLowerCase();
  if (DONE_STATUSES.some(s => s.toLowerCase() === status)) return { state: 'done', detail: '', overdueDays: null };
  const days = targetDate ? daysBetween(today, targetDate.slice(0, 10)) : null;
  if (days === null) return { state: 'no-date', detail: '', overdueDays: null };
  if (days < 0)   return { state: 'overdue',  detail: `${plural(-days)} overdue`, overdueDays: -days };
  if (days === 0) return { state: 'due-soon', detail: 'Due today', overdueDays: null };
  if (days <= DUE_SOON_DAYS) return { state: 'due-soon', detail: `${plural(days)} left`, overdueDays: null };
  return { state: 'on-track', detail: `${plural(days)} left`, overdueDays: null };
}

// ─── Statement entries + shared filters ──────────────────────────────────────

export interface CapEntry {
  rec: DbRecord;
  state: CapState;
  detail: string;
  overdueDays: number | null;
}

/** Resolves each record's deadline state once (against today). */
export function buildCapEntries(records: DbRecord[]): CapEntry[] {
  const today = todayIso();
  return records.map(rec => {
    const { state, detail, overdueDays } = getCapState(String(rec.targetDate ?? ''), String(rec.capStatus ?? ''), today);
    return { rec, state, detail, overdueDays };
  });
}

export interface CapFilters {
  /** ISO date — Audit Date From (audit date >= dateFrom). */
  dateFrom: string;
  /** ISO date — Audit Date To (audit date <= dateTo). */
  dateTo: string;
  /** Which date the Month-Year filter applies to. */
  monthBasis: 'audit' | 'target';
  /** ISO month 'YYYY-MM'; '' = no month filter. */
  month: string;
  /** '' = all, otherwise an exact CAP Status. */
  capStatus: string;
  /** Selected deadline states; [] = all. Matches ANY selected. */
  statuses: string[];
  /** '' = all, otherwise an exact "Audited by" name (case-insensitive). */
  auditedBy: string;
  /** Free text; a standalone 4-digit year = Audit Date or Target Completion year. */
  search: string;
  /** Column-header filters: field name → selected values ([] or missing = all). */
  columns: Record<string, string[]>;
  /** Sort order for the list; field '' = default (as saved). */
  sort: { field: 'ncId' | 'auditDate' | ''; dir: 'asc' | 'desc' };
}

export const EMPTY_CAP_FILTERS: CapFilters = {
  dateFrom: '',
  dateTo: '',
  monthBasis: 'target',
  month: '',
  capStatus: '',
  statuses: [],
  auditedBy: '',
  search: '',
  columns: {},
  sort: { field: '', dir: 'asc' },
};

/** Number of active filter groups (each group, and each filtered column, counts once). Sorting is not a filter. */
export function countActiveCapFilters(f: CapFilters): number {
  const cols = Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
  return [f.dateFrom, f.dateTo, f.month, f.capStatus, f.auditedBy, f.statuses.length > 0, f.search.trim()].filter(Boolean).length + cols;
}

export function hasActiveCapFilters(f: CapFilters): boolean {
  return countActiveCapFilters(f) > 0;
}

// ─── Column-header filters ───────────────────────────────────────────────────

/** Label used for records that have no value in a filtered column. */
export const BLANK_VALUE = '(Blank)';

/** The value a record shows in a filterable column (dates as ISO, empty as "(Blank)"). */
export function capColumnValue(rec: DbRecord, field: string): string {
  const r = rec as Record<string, unknown>;
  const raw = String(r[field] ?? '').trim();
  // The Audit Date column carries the audit PERIOD ("2026-11-15" or "2026-11-15 → 2026-11-17", ISO so it sorts by date).
  if (field === 'auditDate') {
    const start = raw.slice(0, 10);
    if (!start) return BLANK_VALUE;
    const end = auditEndOf(r);
    return end && end !== start ? `${start} → ${end}` : start;
  }
  const v = field === 'auditDate' || field === 'targetDate' ? raw.slice(0, 10) : raw;
  return v || BLANK_VALUE;
}

/** Splits the search box into year tokens (standalone 4-digit year 1900–2099) and text words. */
export function parseCapSearch(search: string): { years: string[]; words: string[] } {
  const years: string[] = [];
  const words: string[] = [];
  for (const token of (search ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    if (/^(19|20)\d{2}$/.test(token)) years.push(token);
    else words.push(token);
  }
  return { years, words };
}

/**
 * Applies the Statement filters (then the sort) to entries from buildCapEntries().
 * Used by the Statement table, Print Preview, Excel and the hidden print copy.
 */
export function filterCapEntries(entries: CapEntry[], f: CapFilters): CapEntry[] {
  const { years, words } = parseCapSearch(f.search);
  const result = entries.filter(({ rec, state }) => {
    const audit  = String(rec.auditDate  ?? '').slice(0, 10);   // ISO YYYY-MM-DD
    const target = String(rec.targetDate ?? '').slice(0, 10);

    if (f.dateFrom && (!audit || audit < f.dateFrom)) return false;
    if (f.dateTo   && (!audit || audit > f.dateTo))   return false;

    if (f.month) {
      const base = f.monthBasis === 'audit' ? audit : target;
      if (base.slice(0, 7) !== f.month) return false;
    }

    if (f.capStatus && String(rec.capStatus ?? '') !== f.capStatus) return false;
    if (f.auditedBy && String(rec.auditConductedBy ?? '').trim().toLowerCase() !== f.auditedBy.trim().toLowerCase()) return false;
    if (f.statuses.length && !f.statuses.includes(state)) return false;

    for (const [field, selected] of Object.entries(f.columns ?? {})) {
      if (selected.length && !selected.includes(capColumnValue(rec, field))) return false;
    }

    if (years.length) {
      const ys = [audit.slice(0, 4), target.slice(0, 4)];
      if (!years.some(y => ys.includes(y))) return false;
    }

    if (words.length) {
      const hay = [
        rec.auditConductedBy, rec.ncId, rec.ncDescription, rec.ncReference, rec.ncCategory,
        rec.rootCause, rec.correctiveAction, rec.responsiblePersons,
      ].map(v => String(v ?? '').toLowerCase()).join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });

  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return result;
  const mult = dir === 'asc' ? 1 : -1;
  return [...result].sort((a, b) => {
    const va = field === 'auditDate' ? String(a.rec.auditDate ?? '').slice(0, 10) : String(a.rec.ncId ?? '').trim();
    const vb = field === 'auditDate' ? String(b.rec.auditDate ?? '').slice(0, 10) : String(b.rec.ncId ?? '').trim();
    if (!va && !vb) return 0;
    if (!va) return 1;
    if (!vb) return -1;
    return mult * va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
  });
}

// ── Audit period text (Statement, Print, PDF, Excel) ─────────────────────────
//   Audit Date only (same-day audit)          → "15-11-2026"
//   Audit Date + extra days (multi-day audit) → "15-11-2026 → 17-11-2026"
// The end is auditEndDate, or auditDate + auditDays when that is missing (see auditEndOf).

/** Audit period text for one saved record ('—' when there is no audit date). */
export function auditPeriodText(rec: Record<string, unknown>): string {
  const start = String(rec.auditDate ?? '').slice(0, 10);
  if (!start) return '—';
  const end = auditEndOf(rec);
  const from = formatDMY(start);
  return end && end !== start ? `${from} → ${formatDMY(end)}` : from;
}

/** Audit period text for the (ISO) audit date and end date given as strings. */
export function auditPeriodOf(auditDate: string, auditEndDate: string): string {
  return auditPeriodText({ auditDate, auditEndDate });
}