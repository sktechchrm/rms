// ─────────────────────────────────────────────────────────────────────────────
// Audit/Visit/Certification Validity Record — types
// Path: src/components/modules/auditVisit/types.ts
//
// REDESIGN (2nd round, explicit field spec): one record = one audit/visit
// event (fixed form, matches Left Employee Notice's save model). Column spec:
//   Record ID, Audit/Certification, Standard/Buyer, Auditor/Organization,
//   Visit Date, Validity Period (month or year), Valid Until (Auto),
//   Status (auto), Report/Certificate, Actions
//
// "Report/Certificate" — this app has no file-upload/storage
// infrastructure, so this is a TEXT/URL field (e.g. a Google Drive link),
// not a real file upload — same approach as Legal Document's Attachment
// field, documented clearly rather than faking upload UI.
//
// "Status" reuses the shared expiryStatus.ts helper — same logic as Legal
// Document's Status column, not a separate copy.
//
// REDESIGN (3rd round — renewal outcome: "Early" / "Delayed"): a record
// whose Valid Until has passed is no longer automatically "Expired". If
// the SAME audit/certification was renewed (a later record exists in the
// same chain — see chain-matching note below), the status reflects HOW
// that renewal happened:
//   - Renewed on/before the deadline → "Early"   (proactive, no gap opened)
//   - Renewed after the deadline     → "Delayed" (lapsed, however briefly
//                                       or however long — any late
//                                       renewal reads as Delayed, there
//                                       is no cutoff back to Expired)
//   - No renewal exists yet          → "Expired" (unresolved lapse)
//
// This requires looking ACROSS records of the same audit/certification
// chain (sorted by Visit Date), not just at one record in isolation — so
// the grouping + status resolution lives here as buildAuditRenewalChains(),
// a single source of truth imported by both AuditVisitStatement.tsx and
// AuditVisitStatementPrintView.tsx. Previously each of those computed
// status independently per-record with plain getExpiryStatus(), which is
// exactly the kind of duplicated logic this file consolidates (same
// rationale as the toBanglaNumber consolidation in LeftNoticeDataType.ts).
//
// This chain-grouping logic stays HERE rather than in the shared
// expiryStatus.ts util, because it's specific to this module's shape
// (grouping by `auditCertification`) — expiryStatus.ts stays generic since
// LegalDocument's module also depends on it and has no such field.
//
// REDESIGN (4th round — chain matching by NORMALIZED FIRST WORD, replacing
// exact-string matching): real-world data entry is inconsistent —
// "Better work Assessment" vs. "BetterWork" vs. "BetterWork Assessment" vs.
// "Better Work Assessment" all refer to the same audit type in practice,
// but exact-string matching treated each as its own chain-of-one, so no
// record ever found its "next visit" and everything fell through to
// "Expired" regardless of whether it was actually renewed.
//
// getChainKey() now normalizes a certification name down to a matching
// key by: (1) splitting camelCase boundaries into separate words first,
// so "BetterWork" reads as "Better" + "Work" rather than one token, then
// (2) taking the FIRST WORD, lowercased. Two records chain together if
// their first word matches, however the rest of the name was typed:
//
//   "Better work Assessment"   -> "better"
//   "BetterWork"               -> "better"   (camelCase split first)
//   "BetterWork Assessment"    -> "better"
//   "Better Work Assessment"   -> "better"
//
// CAVEAT — this is intentionally loose, by explicit choice (matching on
// first word only, not full fuzzy similarity or a fixed dropdown). Two
// genuinely DIFFERENT audits that happen to start with the same word
// (e.g. "Better Work Assessment" vs. "Better Life Foundation Audit") will
// be incorrectly treated as the same renewal chain. If that turns out to
// be a real problem, tighten getChainKey() (e.g. match on the first TWO
// words) or convert the `auditCertification` field in AuditVisitForm.tsx
// from free text to a dropdown/autocomplete backed by a fixed
// certification-type list, which would make chain matching exact again by
// construction.
//
// REDESIGN (5th round — quantified delay/early amount): "Early"/"Delayed"
// used to be a bare label with no sense of scale — a renewal 2 days late
// and one 8 months late both just said "Delayed". getExpiryStatusWithRenewal()
// in expiryStatus.ts now also returns `gapDays` (the magnitude, in days,
// between the deadline and the actual renewal), and buildAuditRenewalChains()
// formats that into a human `delayLabel` ("13 days late", "2 months early")
// via the shared formatDurationDays() helper. Screen and print both render
// this label under the status badge, so the size of the gap is visible,
// not just its direction.
//
// REDESIGN (6th round — DD-MM-YYYY display formatting): all dates in this
// module are stored and computed internally as ISO (YYYY-MM-DD) — that's
// what <input type="date"> needs, what string sorting for chain-ordering
// relies on, and what calculateValidUntil()/daysUntil() parse. Only the
// PRESENTATION changes: formatDMY() below converts an ISO date to
// DD-MM-YYYY purely for display in read-only text (table cells, the
// "Valid Until (Auto)" box). Nothing about storage, sorting, or date math
// changes — this is a render-time formatter only, applied at the last
// possible step before a date reaches JSX text.
//
// NOTE: native <input type="date"> fields (Visit Date entry, and the
// Visit Date From / Valid Until To filters in AuditVisitStatement.tsx) are
// NOT covered by formatDMY() — the browser controls their displayed format
// based on OS/browser locale, and that can't be overridden without
// replacing them with a custom text input + date-picker component.
//
// REDESIGN (7th round — shared filters, Print Preview follows the list):
// the Statement's filter state (Visit Date From, Valid Until To, Status,
// Search) now lives in AuditVisitManager and is passed down, instead of
// being private to AuditVisitStatement.tsx. The filtering itself is a
// single function here, filterAuditEntries(), used by BOTH the Statement
// table and the "প্রিন্ট প্রিভিউ" menu item — so Print Preview prints exactly
// what the Statement is showing (All → everything, Valid → only valid, and
// so on), and the two can never drift apart. describeAuditFilters() builds
// the one-line "Filtered: …" summary printed under the print header.
//
// Filter columns:
//   - dateFrom → Visit Date    (record's visit date  >= From)
//   - dateTo   → Valid Until   (record's valid until <= To)
//   - search   → words match Audit/Certification, Standard/Buyer,
//     Auditor/Organization (every word must match). A 4-digit YEAR typed in
//     the search (e.g. 2025) is NOT matched as text — it filters by Visit
//     Year: audits conducted in 2025 (ANY day of the visit; a 30-12-2026 →
//     02-01-2027 audit shows for both 2026 and 2027). "SEDEX 2025" = SEDEX
//     audits conducted in 2025. Several years = any of them ("2025 2026").
//   - monthBasis + month → Month-Year filter: month ('YYYY-MM') is matched
//     against the Visit Date column when monthBasis = 'visit', or against the
//     Valid Until column when monthBasis = 'valid'
//   - statuses → one or more resolved renewal-aware statuses (multi-select,
//     matches ANY selected; see buildAuditRenewalChains). [] = all statuses.
//
// REDESIGN (8th round — Visit Date can be a RANGE): an audit that runs over
// consecutive days (e.g. 10-09-2026 → 11-09-2026) is stored in the SAME
// Visit Date field group: `visitDate` stays the START day, and a new
// OPTIONAL `visitEndDate` holds the last audit day ('' = single-day audit,
// so every existing record keeps working untouched). Rules:
//   - Validity is counted from the LAST audit day: getValidityBase() returns
//     visitEndDate when it is set (and not before the start), otherwise
//     visitDate. Valid Until, Status and the Early/Delayed gap all use it.
//   - Renewal-chain ORDER and the "next visit" comparison still use the
//     START day (visitDate) of each record.
//   - Filters: "Visit Date From" matches when the visit's LAST day is on/after
//     From; Month-Year (Visit) matches when ANY month of the visit overlaps
//     the chosen month.
//   - Display: formatVisitRange() always renders the range form, e.g.
//     "08-09-2026 to 10-09-2026 (3 days)"; a single-day audit shows
//     "08-09-2026 to 08-09-2026 (1 day)" (end filled in at display time). An end date equal to the start is saved as ''.
//
// DEPENDS ON: utils/expiryStatus.ts exporting getExpiryStatusWithRenewal(),
// formatDurationDays() and EXPIRY_STATUS_STYLE.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  getExpiryStatus,
  getExpiryStatusWithRenewal,
  formatDurationDays,
  EXPIRY_STATUS_STYLE,
  type ExpiryStatus,
} from '../../../utils/expiryStatus';

export type ValidityUnit = 'month' | 'year';
export const VALIDITY_UNIT_OPTIONS: { value: ValidityUnit; label: string }[] = [
  { value: 'month', label: 'Month(s)' },
  { value: 'year',  label: 'Year(s)'  },
];

export interface AuditVisitData {
  auditCertification: string;
  standardBuyer: string;
  auditorOrganization: string;
  visitDate: string;
  /** Optional last audit day for multi-day audits; '' = single-day. */
  visitEndDate: string;
  validityPeriodValue: string;
  validityPeriodUnit: ValidityUnit;
  /** Text/URL link to the report/certificate — see file header note. */
  reportCertificate: string;
  factoryName: string;
  factoryAddress: string;
}

export interface AuditVisitFormProps {
  data: AuditVisitData;
  setData: (data: AuditVisitData) => void;
}

/** Valid Until (Auto) = Visit Date + Validity Period. */
export function calculateValidUntil(visitDate: string, periodValue: string, unit: ValidityUnit): string {
  if (!visitDate) return '';
  const base = new Date(visitDate);
  if (isNaN(base.getTime())) return '';
  const amount = parseInt(periodValue) || 0;
  const next = new Date(base);
  if (unit === 'year') next.setFullYear(next.getFullYear() + amount);
  else next.setMonth(next.getMonth() + amount);
  return next.toISOString().split('T')[0];
}

/**
 * Formats an ISO date string (YYYY-MM-DD, whatever this module stores and
 * computes internally) as DD-MM-YYYY for display purposes only. Returns
 * the input unchanged if it isn't a recognizable ISO date (e.g. empty
 * string, or already some other format) — never throws, safe to call on
 * anything.
 *
 * Storage, sorting (buildAuditRenewalChains' chronological chain order),
 * and date math (calculateValidUntil, daysUntil) all continue to use the
 * raw ISO string — only call this right before a date reaches JSX text.
 */
export function formatDMY(isoDate: string): string {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return isoDate;
  const [, y, mo, d] = m;
  return `${d}-${mo}-${y}`;
}

/**
 * The date validity is counted from: the LAST audit day if a valid end date
 * is set (end >= start), otherwise the visit date. ISO in, ISO out.
 */
export function getValidityBase(visitDate: string, visitEndDate?: string): string {
  const start = (visitDate ?? '').slice(0, 10);
  const end   = (visitEndDate ?? '').slice(0, 10);
  return end && start && end >= start ? end : start;
}

/**
 * Display text for the Visit Date column / print, ALWAYS in range form:
 * "08-09-2026 to 10-09-2026 (3 days)". A single-day audit (no end date) is
 * built dynamically with end = start: "08-09-2026 to 08-09-2026 (1 day)".
 * The day count is INCLUSIVE (the 8th, 9th and 10th = 3 days). Nothing extra
 * is stored — the end date is only filled in at display time.
 */
export function formatVisitRange(visitDate: string, visitEndDate?: string): string {
  const start = (visitDate ?? '').slice(0, 10);
  const s = formatDMY(start);
  if (!s) return '';
  const endRaw = (visitEndDate ?? '').slice(0, 10);
  const endIso = endRaw && endRaw >= start ? endRaw : start;   // missing/invalid end → same day
  const n = visitDays(start, endIso);
  return `${s} to ${formatDMY(endIso)} (${n} ${n === 1 ? 'day' : 'days'})`;
}

/** Inclusive audit days: both the first and last day count (08-09 → 10-09 = 3). Same day = 1. 0 if invalid or end < start. */
export function visitDays(visitDate: string, visitEndDate: string): number {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(visitDate ?? '');
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(visitEndDate ?? '');
  if (!a || !b) return 0;
  const ds = Date.UTC(+a[1], +a[2] - 1, +a[3]);
  const de = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  return de >= ds ? Math.round((de - ds) / 86400000) + 1 : 0;
}

export const INITIAL_AUDIT_VISIT_STATE: AuditVisitData = {
  auditCertification: '',
  standardBuyer: '',
  auditorOrganization: '',
  visitDate: new Date().toISOString().split('T')[0],
  visitEndDate: '',
  validityPeriodValue: '1',
  validityPeriodUnit: 'year',
  reportCertificate: '',
  factoryName: '',
  factoryAddress: '',
};

export interface AuditRenewalEntry {
  rec: DbRecord;
  validUntil: string;
  status: ExpiryStatus;
  /** Magnitude in days between deadline and actual renewal — see
   *  RenewalStatusResult in expiryStatus.ts. Null unless status is
   *  'early' or 'delayed'. */
  gapDays: number | null;
  /** Human-readable quantified label, e.g. "13 days late" or
   *  "2 months early". Undefined unless status is 'early' or 'delayed'. */
  delayLabel?: string;
}

/**
 * Normalizes an audit/certification name down to a chain-matching key:
 * splits camelCase boundaries into separate words first (so "BetterWork"
 * reads as "Better" + "Work"), then takes the FIRST WORD, lowercased. Two
 * records chain together if their first word matches, however the rest of
 * the name was typed.
 *
 *   "Better work Assessment"   -> "better"
 *   "BetterWork"               -> "better"   (camelCase split first)
 *   "BetterWork Assessment"    -> "better"
 *   "Better Work Assessment"   -> "better"
 *
 * Caveat: intentionally loose — see file header note. Two genuinely
 * different audits that just happen to start with the same word will be
 * treated as the same chain. Tighten this (e.g. match on the first TWO
 * words) or move auditCertification to a fixed dropdown if that becomes a
 * real problem.
 */
function getChainKey(auditCertification: string): string {
  const spaced = auditCertification
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2'); // "BetterWork" -> "Better Work"
  const firstWord = spaced.split(/\s+/)[0] ?? '';
  return firstWord.toLowerCase();
}

/**
 * Builds the human-readable quantified label for early/delayed statuses.
 * Returns undefined for every other status, since there's nothing to
 * quantify (no renewal to measure against, or deadline not reached yet).
 */
function formatDelayLabel(status: ExpiryStatus, gapDays: number | null): string | undefined {
  if (gapDays === null) return undefined;
  if (status === 'early')   return `${formatDurationDays(gapDays)} early`;
  if (status === 'delayed') return `${formatDurationDays(gapDays)} late`;
  return undefined;
}

/**
 * Groups records into renewal chains by NORMALIZED FIRST WORD of
 * `auditCertification` (see getChainKey() above — same certification type
 * re-audited over time, tolerant of inconsistent free-text entry), sorted
 * chronologically by Visit Date, then resolves each record's status —
 * plus a quantified early/delay label — against whichever record (if any)
 * comes NEXT in its own chain. See file header for the resolution rules.
 *
 * Single source of truth for both AuditVisitStatement.tsx (screen) and
 * AuditVisitStatementPrintView.tsx (print) — call this once per render in
 * each rather than recomputing status independently.
 *
 * IMPORTANT: always pass the FULL record list here, never an already
 * filtered subset — a record's status depends on the NEXT visit in its
 * chain, and a filter may have hidden that next visit. Filter AFTER this
 * call with filterAuditEntries().
 *
 * `validUntil` returned here stays ISO (YYYY-MM-DD) — callers that render
 * it as text should pass it through formatDMY() first.
 */
export function buildAuditRenewalChains(records: DbRecord[]): AuditRenewalEntry[] {
  const chains = new Map<string, DbRecord[]>();
  for (const rec of records) {
    const key = getChainKey(String(rec.auditCertification ?? ''));
    if (!chains.has(key)) chains.set(key, []);
    chains.get(key)!.push(rec);
  }
  for (const chain of chains.values()) {
    chain.sort((a, b) => String(a.visitDate ?? '').localeCompare(String(b.visitDate ?? '')));
  }

  return records.map(rec => {
    const validUntil = calculateValidUntil(
      getValidityBase(String(rec.visitDate ?? ''), String(rec.visitEndDate ?? '')),
      String(rec.validityPeriodValue ?? ''),
      (rec.validityPeriodUnit === 'year' ? 'year' : 'month'),
    );

    const chain = chains.get(getChainKey(String(rec.auditCertification ?? ''))) ?? [];
    const idx   = chain.findIndex(r => r.id === rec.id);
    const nextVisitDate = idx >= 0 && idx < chain.length - 1
      ? String(chain[idx + 1].visitDate ?? '')
      : undefined;

    const { status, gapDays } = getExpiryStatusWithRenewal({ validUntil, nextVisitDate });

    return {
      rec,
      validUntil,
      status,
      gapDays,
      delayLabel: formatDelayLabel(status, gapDays),
    };
  });
}

// ─── Shared list filters (Statement table + Print Preview) ──────────────────

export interface AuditFilters {
  /** ISO date — filters the Visit Date column (visit date >= dateFrom). */
  dateFrom: string;
  /** ISO date — filters the Valid Until column (valid until <= dateTo). */
  dateTo: string;
  /** Which column the Month-Year filter applies to. */
  monthBasis: 'visit' | 'valid';
  /** ISO month 'YYYY-MM' (from <input type="month">); '' = no month filter. */
  month: string;
  /** Selected ExpiryStatus values ('valid', 'delayed', …); [] = all. Matches ANY selected. */
  statuses: string[];
  /** Free text over Audit/Certification, Standard/Buyer, Auditor/Organization. */
  search: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  dateFrom: '',
  dateTo: '',
  monthBasis: 'visit',
  month: '',
  statuses: [],
  search: '',
};

export function hasActiveAuditFilters(f: AuditFilters): boolean {
  return countActiveAuditFilters(f) > 0;
}

/** Number of active filter groups (dates, month, statuses and search count once each). */
export function countActiveAuditFilters(f: AuditFilters): number {
  return [f.dateFrom, f.dateTo, f.month, f.statuses.length > 0, f.search.trim()].filter(Boolean).length;
}

/**
 * Splits the search box into Visit Year tokens (a standalone 4-digit year,
 * 1900–2099) and plain text words. "SEDEX 2025" → years ['2025'], words ['sedex'].
 */
export function parseAuditSearch(search: string): { years: string[]; words: string[] } {
  const years: string[] = [];
  const words: string[] = [];
  for (const token of (search ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    if (/^(19|20)\d{2}$/.test(token)) years.push(token);
    else words.push(token);
  }
  return { years, words };
}

/**
 * Applies the Statement filters to entries from buildAuditRenewalChains().
 * Used by BOTH the Statement table and the Print Preview, so the printed
 * list is always exactly what the Statement shows.
 */
export function filterAuditEntries(entries: AuditRenewalEntry[], f: AuditFilters): AuditRenewalEntry[] {
  const { years, words } = parseAuditSearch(f.search);
  return entries.filter(({ rec, validUntil, status }) => {
    const visitStart = String(rec.visitDate ?? '').slice(0, 10);          // ISO YYYY-MM-DD
    const visitEnd   = String(rec.visitEndDate ?? '').slice(0, 10);
    const visitLast  = visitEnd && visitEnd >= visitStart ? visitEnd : visitStart;

    // From → Visit Date (the visit's LAST day must be on/after From)
    if (f.dateFrom && (!visitLast || visitLast < f.dateFrom)) return false;
    // To → Valid Until (record must expire on/before To)
    if (f.dateTo && (!validUntil || validUntil > f.dateTo)) return false;

    // Year typed in search → visit conducted in that year (any day of the visit)
    if (years.length) {
      const y1 = visitStart.slice(0, 4);
      const y2 = visitLast.slice(0, 4);
      if (!visitStart || !years.some(y => y >= y1 && y <= y2)) return false;
    }

    // Month-Year → Visit Date or Valid Until, per monthBasis
    if (f.month) {
      if (f.monthBasis === 'valid') {
        if (validUntil.slice(0, 7) !== f.month) return false;
      } else {
        // Visit: any month the (possibly multi-day) visit touches
        if (!visitStart || f.month < visitStart.slice(0, 7) || f.month > visitLast.slice(0, 7)) return false;
      }
    }

    if (f.statuses.length && !f.statuses.includes(status)) return false;

    if (words.length) {
      const hay = [rec.auditCertification, rec.standardBuyer, rec.auditorOrganization]
        .map(v => String(v ?? '').toLowerCase())
        .join(' ');
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
}

/**
 * One-line, human-readable summary of the active filters for the print
 * header, e.g. "Visit Date from 01-01-2026 · Valid Until to 31-12-2026 ·
 * Status: Delayed". Returns '' when no filter is active (print header then
 * omits the line, since the list is the full register).
 */
export function describeAuditFilters(f: AuditFilters): string {
  const parts: string[] = [];
  if (f.dateFrom) parts.push(`Visit Date from ${formatDMY(f.dateFrom)}`);
  if (f.dateTo)   parts.push(`Valid Until to ${formatDMY(f.dateTo)}`);
  if (f.month) {
    const [y, m] = f.month.split('-');
    parts.push(`${f.monthBasis === 'valid' ? 'Valid Until' : 'Visit'} Month ${m}-${y}`);
  }
  if (f.statuses.length) {
    const labels = f.statuses.map(st => EXPIRY_STATUS_STYLE[st as ExpiryStatus]?.label ?? st);
    parts.push(`Status: ${labels.join(', ')}`);
  }
  const { years, words } = parseAuditSearch(f.search);
  if (years.length) parts.push(`Visit Year ${years.join(', ')}`);
  if (words.length) parts.push(`Search: "${words.join(' ')}"`);
  return parts.join(' · ');
}

/**
 * Plain (non-renewal-aware) status for the live/unsaved form entry — there
 * is no "next visit" to look ahead to yet while the user is still editing
 * the current one, so this just re-exports the simple check for
 * AuditVisitForm.tsx's inline status banner.
 */
export { getExpiryStatus };