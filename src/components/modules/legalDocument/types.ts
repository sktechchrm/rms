// ─────────────────────────────────────────────────────────────────────────────
// Legal Document Validity Status — types
// Path: src/components/modules/legalDocument/types.ts
//
// REDESIGN: one record = one document (fixed form), same shape as Left
// Employee Notice — NOT an array-of-items document like Requisition.
// "View" is a statement/list of many saved records with filtering, not a
// single-document print preview.
//
// "Set alarm: reminder before from 2 months of Expire" — implemented as a
// computed, always-live visual status (see getExpiryStatus below), not an
// actual push-notification/email alarm — there's no background job
// scheduler in this app. The reminder shows the moment the statement is
// opened.
// ─────────────────────────────────────────────────────────────────────────────

export interface LegalDocumentData {
  documentDetails: string;
  mentionedCapacity: string;
  dateReceived: string;
  dateExpire: string;
  authorityBody: string;
  factoryName: string;
  factoryAddress: string;
}

export interface LegalDocumentFormProps {
  data: LegalDocumentData;
  setData: (data: LegalDocumentData) => void;
}

export const REMINDER_WINDOW_DAYS = 60; // "2 months before expire"

export type ExpiryStatus = 'expired' | 'due-soon' | 'valid' | 'unknown';

export function daysUntilExpiry(dateExpire: string): number | null {
  if (!dateExpire) return null;
  const target = new Date(dateExpire);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function getExpiryStatus(dateExpire: string): ExpiryStatus {
  const days = daysUntilExpiry(dateExpire);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= REMINDER_WINDOW_DAYS) return 'due-soon';
  return 'valid';
}

export const INITIAL_LEGAL_DOCUMENT_STATE: LegalDocumentData = {
  documentDetails: '',
  mentionedCapacity: '',
  dateReceived: '',
  dateExpire: '',
  authorityBody: '',
  factoryName: '',
  factoryAddress: '',
};
