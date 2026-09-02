// ─────────────────────────────────────────────────────────────────────────────
// utils/expiryStatus.ts — shared expiry/validity status logic, used by both
// LegalDocument and AuditVisit modules' Status columns (single source of
// truth, not a separate copy per module).
//
// UPDATE (renewal outcome: 'early' / 'delayed', replacing grace-window
// design): once a record's Valid Until has passed, its status depends
// entirely on whether — and when — the NEXT record in its renewal chain
// happened:
//   - No next record yet             → 'expired'
//   - Next record on/before deadline → 'early'   (renewed proactively)
//   - Next record after deadline     → 'delayed' (renewed late, however
//                                       late — no grace cutoff back to
//                                       'expired'; only a genuinely
//                                       un-renewed lapse is 'expired')
// getExpiryStatus() is untouched and still used standalone (LegalDocument,
// and AuditVisitForm's live single-entry preview, where there's no
// renewal chain to compare against). getExpiryStatusWithRenewal() is the
// renewal-aware variant AuditVisit's chain logic calls on top of it.
//
// UPDATE (quantified delay/early amount): getExpiryStatusWithRenewal() no
// longer returns a bare ExpiryStatus — it returns a RenewalStatusResult
// containing both the status AND `gapDays`, the number of days between
// the deadline (validUntil) and the actual renewal (nextVisitDate). This
// lets callers show not just "Delayed" but "Delayed — 2 months 5 days
// late", so the size of the lapse (or how far ahead of schedule a renewal
// was) is visible, not just the fact of it. `gapDays` is null whenever
// there's nothing to quantify (valid / due-soon / expired / unknown).
//
// formatDurationDays() is the shared day-count → human text formatter
// ("13 days", "2 months", "1 year 3 months") used to build that label.
// It uses calendar-approximate months (30 days) and years (365 days),
// consistent with how validity periods elsewhere in this app are already
// shown in whole months/years rather than exact day counts — precision
// beyond that isn't meaningful for audit renewal cadences.
// ─────────────────────────────────────────────────────────────────────────────

export type ExpiryStatus = 'valid' | 'due-soon' | 'early' | 'delayed' | 'expired' | 'unknown';

export const EXPIRY_STATUS_STYLE: Record<ExpiryStatus, { label: string; color: string; bg: string }> = {
  valid:      { label: 'Valid',     color: '#15803d', bg: '#dcfce7' },
  'due-soon': { label: 'Due Soon',  color: '#b45309', bg: '#fef3c7' },
  early:      { label: 'Early',     color: '#0369a1', bg: '#e0f2fe' },
  delayed:    { label: 'Delayed',   color: '#c2410c', bg: '#ffedd5' },
  expired:    { label: 'Expired',   color: '#b91c1c', bg: '#fee2e2' },
  unknown:    { label: '—',         color: '#64748b', bg: '#f1f5f9' },
};

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Plain status — no renewal awareness. Used standalone by LegalDocument
 *  and by AuditVisitForm's live/unsaved entry preview. */
export function getExpiryStatus(validUntil: string): ExpiryStatus {
  const days = daysUntil(validUntil);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 60) return 'due-soon';
  return 'valid';
}

/**
 * Converts a day count into approximate human-readable duration text.
 * Uses calendar-approximate months (30 days) and years (365 days) — this
 * app already shows validity periods in whole months/years elsewhere, so
 * matching that granularity here keeps the language consistent rather
 * than surfacing exact-but-noisy day counts for long gaps.
 *
 *   5    -> "5 days"
 *   13   -> "13 days"
 *   45   -> "1 month"        (rounds to nearest month once >= 30 days)
 *   400  -> "1 year 1 month"
 *   730  -> "2 years"
 */
export function formatDurationDays(days: number): string {
  const abs = Math.abs(Math.round(days));

  if (abs < 30) {
    return `${abs} day${abs === 1 ? '' : 's'}`;
  }

  if (abs < 365) {
    const months = Math.round(abs / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  const years = Math.floor(abs / 365);
  const remMonths = Math.round((abs % 365) / 30);

  if (remMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  return `${years} year${years === 1 ? '' : 's'} ${remMonths} month${remMonths === 1 ? '' : 's'}`;
}

export interface RenewalCheckInput {
  validUntil: string;        // this record's computed valid-until date
  nextVisitDate?: string;    // visitDate of the next record in the same chain, if any
}

export interface RenewalStatusResult {
  status: ExpiryStatus;
  /**
   * Days between the deadline (validUntil) and the actual renewal
   * (nextVisitDate) — always a non-negative magnitude, regardless of
   * direction. Populated only for 'early' and 'delayed' statuses (where
   * there IS a renewal to measure against); null for every other status,
   * since 'valid'/'due-soon' haven't reached their deadline yet and
   * 'expired'/'unknown' have nothing to measure against.
   */
  gapDays: number | null;
}

/**
 * Renewal-aware status for historical/list views, where a later record in
 * the same renewal chain (e.g. same auditCertification, sorted by date)
 * may already have superseded this one.
 *
 *  - Not yet past Valid Until        → plain getExpiryStatus() (valid/due-soon), gapDays: null
 *  - Past Valid Until, no next visit → 'expired', gapDays: null
 *  - Next visit on/before deadline   → 'early', gapDays: how many days ahead of the deadline
 *  - Next visit after deadline       → 'delayed', gapDays: how many days past the deadline
 *                                       (any lateness — no cutoff back to 'expired')
 */
export function getExpiryStatusWithRenewal({
  validUntil,
  nextVisitDate,
}: RenewalCheckInput): RenewalStatusResult {
  const days = daysUntil(validUntil);
  if (days === null) return { status: 'unknown', gapDays: null };
  if (days >= 0) return { status: getExpiryStatus(validUntil), gapDays: null };

  if (!nextVisitDate) return { status: 'expired', gapDays: null };

  const validUntilDate = new Date(validUntil);
  const nextDate       = new Date(nextVisitDate);
  if (isNaN(validUntilDate.getTime()) || isNaN(nextDate.getTime())) {
    return { status: 'expired', gapDays: null };
  }

  const gapDays = Math.round((nextDate.getTime() - validUntilDate.getTime()) / 86400000);

  return gapDays <= 0
    ? { status: 'early',   gapDays: Math.abs(gapDays) }
    : { status: 'delayed', gapDays };
}