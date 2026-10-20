// ─────────────────────────────────────────────────────────────────────────────
// Legal Document/License/Certificate/Agreement Record — types
// Path: src/components/modules/legalDocument/types.ts
//
// REDESIGN (2nd round, explicit field spec): one record = one document
// (fixed form, matches Left Employee Notice's save model). Column spec:
//   Document ID, Document Title, Category, Document No., Issuing
//   Authority, Issue Date, Expiry Date, Status (auto), Attachment, Actions
//
// "Attachment" — this app has no file-upload/storage infrastructure (every
// module stores plain text/JSON in Google Sheets), so this is a TEXT/URL
// field (e.g. a Google Drive link to the scanned document), not a real
// file upload. Documented clearly rather than silently faking upload UI.
//
// "Status" reuses the shared expiryStatus.ts helper — same logic as
// Audit/Visit/Certification Validity Record's Status column, not a
// separate copy.
//
// UPDATE (aligned with the Audit/Visit module): all dates are stored and
// computed as ISO (YYYY-MM-DD); formatDMY() converts to DD-MM-YYYY purely for
// display (table, print, "Expiry" box) — a copy of the one in the audit
// module so the two modules stay independent. The Statement filters live
// here too, shared by the Statement table, Print Preview and the hidden print
// copy (so what you see is what prints):
//   - dateFrom / dateTo → Expiry Date range (Expiry From / Expiry To)
//   - monthBasis + month → Month-Year ('YYYY-MM') matched against the Issue
//     Date ('issue') or the Expiry Date ('expiry')
//   - category          → exact Category
//   - statuses          → one or more of valid / due-soon / expired
//                         (multi-select, matches ANY selected; [] = all)
//   - search            → words match Title / Authority / Document No. (every
//                         word must match). A standalone 4-digit YEAR typed in
//                         the search (e.g. 2026) is NOT matched as text: it
//                         lists documents ISSUED or EXPIRING in that year.
//                         "fire 2026" = fire documents issued/expiring in 2026.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, type ExpiryStatus } from '../../../utils/expiryStatus';

export const CATEGORY_OPTIONS = ['License', 'Certificate', 'Agreement', 'Permit', 'Registration', 'Other'];

export interface LegalDocumentData {
  documentTitle: string;
  category: string;
  documentNo: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  /** Text/URL link to the scanned document — see file header note. Not a
     real file upload; this app has no file-storage backend. */
  attachment: string;
  factoryName: string;
  factoryAddress: string;
}

export interface LegalDocumentFormProps {
  data: LegalDocumentData;
  setData: (data: LegalDocumentData) => void;
}

export const INITIAL_LEGAL_DOCUMENT_STATE: LegalDocumentData = {
  documentTitle: '',
  category: 'License',
  documentNo: '',
  issuingAuthority: '',
  issueDate: '',
  expiryDate: '',
  attachment: '',
  factoryName: '',
  factoryAddress: '',
};

/**
 * Formats an ISO date string (YYYY-MM-DD) as DD-MM-YYYY for display only.
 * Returns the input unchanged if it isn't a recognizable ISO date (empty,
 * or already some other format) — never throws.
 */
export function formatDMY(isoDate: string): string {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return isoDate;
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

// ─── Statement entries + shared filters ──────────────────────────────────────

export interface LegalEntry {
  rec: DbRecord;
  status: ExpiryStatus;
}

/** Resolves each record's status once (valid / due-soon / expired / unknown). */
export function buildLegalEntries(records: DbRecord[]): LegalEntry[] {
  return records.map(rec => ({ rec, status: getExpiryStatus(String(rec.expiryDate ?? '')) }));
}

export interface LegalFilters {
  /** ISO date — Expiry From (expiry date >= dateFrom). */
  dateFrom: string;
  /** ISO date — Expiry To (expiry date <= dateTo). */
  dateTo: string;
  /** Which date the Month-Year filter applies to. */
  monthBasis: 'issue' | 'expiry';
  /** ISO month 'YYYY-MM'; '' = no month filter. */
  month: string;
  /** '' = all categories, otherwise an exact Category. */
  category: string;
  /** Selected ExpiryStatus values; [] = all. Matches ANY selected. */
  statuses: string[];
  /** Free text over Title / Authority / Document No.; a 4-digit year = issue/expiry year. */
  search: string;
}

export const EMPTY_LEGAL_FILTERS: LegalFilters = {
  dateFrom: '',
  dateTo: '',
  monthBasis: 'expiry',
  month: '',
  category: '',
  statuses: [],
  search: '',
};

/** Number of active filter groups (dates, month, category, statuses and search count once each). */
export function countActiveLegalFilters(f: LegalFilters): number {
  return [f.dateFrom, f.dateTo, f.month, f.category, f.statuses.length > 0, f.search.trim()].filter(Boolean).length;
}

export function hasActiveLegalFilters(f: LegalFilters): boolean {
  return countActiveLegalFilters(f) > 0;
}

/**
 * Splits the search box into year tokens (a standalone 4-digit year,
 * 1900–2099) and plain text words. "fire 2026" → years ['2026'], words ['fire'].
 */
export function parseLegalSearch(search: string): { years: string[]; words: string[] } {
  const years: string[] = [];
  const words: string[] = [];
  for (const token of (search ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    if (/^(19|20)\d{2}$/.test(token)) years.push(token);
    else words.push(token);
  }
  return { years, words };
}

/**
 * Applies the Statement filters to entries from buildLegalEntries(). Used by
 * the Statement table, Print Preview and the hidden print copy, so the printed
 * list is always exactly what the Statement shows.
 */
export function filterLegalEntries(entries: LegalEntry[], f: LegalFilters): LegalEntry[] {
  const { years, words } = parseLegalSearch(f.search);
  return entries.filter(({ rec, status }) => {
    const issue  = String(rec.issueDate  ?? '').slice(0, 10);   // ISO YYYY-MM-DD
    const expiry = String(rec.expiryDate ?? '').slice(0, 10);

    // Expiry From / To
    if (f.dateFrom && (!expiry || expiry < f.dateFrom)) return false;
    if (f.dateTo   && (!expiry || expiry > f.dateTo))   return false;

    // Month-Year → Issue Date or Expiry Date, per monthBasis
    if (f.month) {
      const target = (f.monthBasis === 'issue' ? issue : expiry).slice(0, 7); // 'YYYY-MM'
      if (target !== f.month) return false;
    }

    if (f.category && String(rec.category ?? '') !== f.category) return false;
    if (f.statuses.length && !f.statuses.includes(status)) return false;

    // Year typed in search → issued or expiring in that year
    if (years.length) {
      const ys = [issue.slice(0, 4), expiry.slice(0, 4)];
      if (!years.some(y => ys.includes(y))) return false;
    }

    if (words.length) {
      const hay = [rec.documentTitle, rec.issuingAuthority, rec.documentNo]
        .map(v => String(v ?? '').toLowerCase())
        .join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
}