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
// ─────────────────────────────────────────────────────────────────────────────

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
