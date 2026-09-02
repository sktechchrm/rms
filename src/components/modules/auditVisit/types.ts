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
// Valid Until From/To filters in AuditVisitStatement.tsx) are NOT covered
// by formatDMY() — the browser controls their displayed format based on
// OS/browser locale, and that can't be overridden without replacing them
// with a custom text input + date-picker component.
//
// DEPENDS ON: utils/expiryStatus.ts exporting getExpiryStatusWithRenewal()
// and formatDurationDays().
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  getExpiryStatus,
  getExpiryStatusWithRenewal,
  formatDurationDays,
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

export const INITIAL_AUDIT_VISIT_STATE: AuditVisitData = {
  auditCertification: '',
  standardBuyer: '',
  auditorOrganization: '',
  visitDate: new Date().toISOString().split('T')[0],
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
      String(rec.visitDate ?? ''),
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

/**
 * Plain (non-renewal-aware) status for the live/unsaved form entry — there
 * is no "next visit" to look ahead to yet while the user is still editing
 * the current one, so this just re-exports the simple check for
 * AuditVisitForm.tsx's inline status banner.
 */
export { getExpiryStatus };