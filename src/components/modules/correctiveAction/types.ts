// ─────────────────────────────────────────────────────────────────────────────
// Corrective Action Plan (CAP) / Non-Conformance Record — types
// Path: src/components/modules/correctiveAction/types.ts
//
// One record = one non-conformance (NC) with its corrective action plan (fixed
// form, same save model as Legal Document / Audit Visit). Columns, in order:
//   SL No., Audit Conducted By, Audit Date, NC ID, NC Description, NC Reference,
//   NC Category / Keyword, Root Cause Analysis, Corrective Action Plan (CAP),
//   Target Completion Date, Responsible Person(s), CAP Status, Evidence 1,
//   Evidence 2, Evidence 3, Overdue  (+ Actions on screen)
// "SL No." and "Overdue" are not typed in: SL is the row number and Overdue is
// calculated (see below).
//
// EVIDENCE 1–3: each holds a file attachment (PNG, JPEG, JPG, PDF, Word, Excel)
// or a pasted link. This app has no file storage of its own, so an attached file
// is uploaded to Google Drive through a small Apps Script web app (see
// evidenceUpload.ts and DriveUpload.gs); the record stores only the file's link
// (evidenceN) and its name (evidenceNName). Until that upload address is
// configured, the field simply takes a pasted link.
//
// CAP STATUS (dropdown): Open / In Progress / Ongoing / Completed / Closed /
// Pending Evidence / Pending Verification. DONE_STATUSES lists the ones that
// count as finished for the Overdue calculation (edit it if your process treats
// "Pending Verification" as finished too).
//
// OVERDUE (auto): a record that is not finished and whose Target Completion Date
// has passed is Overdue; the Overdue column shows how many days. Deadline STATE
// (drives the chips, the alert ball and the small line under each target date):
//   Overdue   target passed, not finished     Due Soon  target within DUE_SOON_DAYS
//   On Track  target further away             Done      CAP Status is finished
//   No Date   no target date entered
//
// All dates are stored and computed as ISO (YYYY-MM-DD); formatDMY() converts to
// DD-MM-YYYY for display only.
//
// Statement filters (shared by the Statement table, Print Preview and the hidden
// print copy, so what you see is what prints):
//   - dateFrom → "Audit Date From": audit date on/after From
//   - dateTo   → "Target Date To":  target completion on/before To
//   - monthBasis + month → Month-Year matched against the Audit Date ('audit')
//     or the Target Completion Date ('target')
//   - capStatus → exact CAP Status;  statuses → deadline states (multi-select)
//   - search → words match Audit Conducted By / NC ID / NC Description / NC
//     Reference / Category / Root Cause / CAP / Responsible Person(s) (every word
//     must match). A standalone 4-digit YEAR (e.g. 2026) is NOT matched as text:
//     it lists records whose Audit Date OR Target Completion Date is in that year.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';

export const CAP_STATUS_OPTIONS = [
  'Open', 'In Progress', 'Ongoing', 'Completed', 'Closed', 'Pending Evidence', 'Pending Verification',
];
/** CAP Status values that count as finished (never Overdue / Due Soon). */
export const DONE_STATUSES = ['Completed', 'Closed'];
export const DUE_SOON_DAYS = 14;

export interface CorrectiveActionData {
  auditConductedBy: string;
  auditDate: string;
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
  /** Days past the target date for an Overdue record, otherwise null (feeds the Overdue column). */
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
  /** ISO date — Target Date To (target completion <= dateTo). */
  dateTo: string;
  /** Which date the Month-Year filter applies to. */
  monthBasis: 'audit' | 'target';
  /** ISO month 'YYYY-MM'; '' = no month filter. */
  month: string;
  /** '' = all, otherwise an exact CAP Status. */
  capStatus: string;
  /** Selected deadline states; [] = all. Matches ANY selected. */
  statuses: string[];
  /** Free text; a standalone 4-digit year = Audit Date or Target Completion year. */
  search: string;
}

export const EMPTY_CAP_FILTERS: CapFilters = {
  dateFrom: '',
  dateTo: '',
  monthBasis: 'target',
  month: '',
  capStatus: '',
  statuses: [],
  search: '',
};

/** Number of active filter groups (each group counts once). */
export function countActiveCapFilters(f: CapFilters): number {
  return [f.dateFrom, f.dateTo, f.month, f.capStatus, f.statuses.length > 0, f.search.trim()].filter(Boolean).length;
}

export function hasActiveCapFilters(f: CapFilters): boolean {
  return countActiveCapFilters(f) > 0;
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
 * Applies the Statement filters to entries from buildCapEntries(). Used by the
 * Statement table, Print Preview and the hidden print copy.
 */
export function filterCapEntries(entries: CapEntry[], f: CapFilters): CapEntry[] {
  const { years, words } = parseCapSearch(f.search);
  return entries.filter(({ rec, state }) => {
    const audit  = String(rec.auditDate  ?? '').slice(0, 10);   // ISO YYYY-MM-DD
    const target = String(rec.targetDate ?? '').slice(0, 10);

    // From → Audit Date (audit on/after From); To → Target Completion (target on/before To)
    if (f.dateFrom && (!audit  || audit  < f.dateFrom)) return false;
    if (f.dateTo   && (!target || target > f.dateTo))   return false;

    if (f.month) {
      const base = f.monthBasis === 'audit' ? audit : target;
      if (base.slice(0, 7) !== f.month) return false;
    }

    if (f.capStatus && String(rec.capStatus ?? '') !== f.capStatus) return false;
    if (f.statuses.length && !f.statuses.includes(state)) return false;

    // Year typed in search → Audit Date or Target Completion Date in that year
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
}