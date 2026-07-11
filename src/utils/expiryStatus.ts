// ─────────────────────────────────────────────────────────────────────────────
// expiryStatus.ts — shared "valid / due-soon / expired" status computation.
// Path: src/utils/expiryStatus.ts
//
// CONSOLIDATED: both Legal Document Validity Status (Expiry Date) and
// Audit/Visit/Certification Validity Record (Valid Until) need the exact
// same "is this date coming up / already passed" logic — one shared
// implementation instead of two copies that could drift apart, matching
// the established pattern elsewhere in this app (calculateEarnedLeaveAmount,
// calculateBasicFromGross, etc. in sharedFormulas.ts).
//
// "Reminder before 2 months of Expire" is implemented as this always-live
// computed status, not an actual push/email alarm — there's no background
// job scheduler in this app for real alarms. The reminder is visible the
// moment the record/statement is viewed.
// ─────────────────────────────────────────────────────────────────────────────

export const REMINDER_WINDOW_DAYS = 60; // "2 months before"

export type ExpiryStatus = 'expired' | 'due-soon' | 'valid' | 'unknown';

/** Days remaining until dateStr (negative = already passed). null if
   dateStr is missing/invalid. */
export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function getExpiryStatus(dateStr: string): ExpiryStatus {
  const days = daysUntil(dateStr);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= REMINDER_WINDOW_DAYS) return 'due-soon';
  return 'valid';
}

export const EXPIRY_STATUS_STYLE: Record<ExpiryStatus, { bg: string; color: string; label: string }> = {
  expired:    { bg: '#fee2e2', color: '#b91c1c', label: 'Expired' },
  'due-soon': { bg: '#fef3c7', color: '#92400e', label: 'Due Soon' },
  valid:      { bg: '#f0fdf4', color: '#15803d', label: 'Valid' },
  unknown:    { bg: '#f1f5f9', color: '#64748b', label: '—' },
};
