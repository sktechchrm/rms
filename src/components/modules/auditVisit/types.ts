// ─────────────────────────────────────────────────────────────────────────────
// Audit/Visit Record — types
// Path: src/components/modules/auditVisit/types.ts
//
// REDESIGN: one record = one audit/visit event (fixed form), same shape
// as Left Employee Notice — NOT an array-of-items document like
// Requisition. Each save creates/updates exactly one saved record. The
// "View" is a statement/list of many saved records with filtering (like
// Reports), not a single-document print preview of one entry.
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditVisitData {
  date: string;
  type: 'Audit' | 'Visit';
  duration: string; // '1 day' .. '5 day'
  certificationFor: string;
  auditFirm: string;
  auditorName: string;
  auditMode: 'Announced' | 'Un-announced';
  resultsScore: string;
  validityMonths: string;
  validityYears: string;
  factoryName: string;
  factoryAddress: string;
}

export interface AuditVisitFormProps {
  data: AuditVisitData;
  setData: (data: AuditVisitData) => void;
}

export const DURATION_OPTIONS = ['1 day', '2 day', '3 day', '4 day', '5 day'];
export const TYPE_OPTIONS: AuditVisitData['type'][] = ['Audit', 'Visit'];
export const MODE_OPTIONS: AuditVisitData['auditMode'][] = ['Announced', 'Un-announced'];

/** Next audit date = Date + Validity Time of Certificate (months + years). */
export function calculateNextAuditDate(date: string, validityMonths: string, validityYears: string): string {
  if (!date) return '';
  const base = new Date(date);
  if (isNaN(base.getTime())) return '';
  const months = parseInt(validityMonths) || 0;
  const years  = parseInt(validityYears)  || 0;
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + years);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().split('T')[0];
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export const INITIAL_AUDIT_VISIT_STATE: AuditVisitData = {
  date: new Date().toISOString().split('T')[0],
  type: 'Audit',
  duration: '1 day',
  certificationFor: '',
  auditFirm: '',
  auditorName: '',
  auditMode: 'Announced',
  resultsScore: '',
  validityMonths: '',
  validityYears: '1',
  factoryName: '',
  factoryAddress: '',
};
