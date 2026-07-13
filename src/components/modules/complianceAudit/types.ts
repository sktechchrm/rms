// ─────────────────────────────────────────────────────────────────────────────
// Compliance Audit — types
// Path: src/components/modules/complianceAudit/types.ts
//
// Standard BSCI/Sedex/SMETA-style Corrective Action Plan (CAP) audit
// report, matching the reference image's exact structure — not
// invented: Audit Details header (company/site info, audit type as a
// checkbox set including follow-up rounds, auditing areas multi-select,
// multiple auditors) + a dynamically-sized Corrective Action Plan-
// Non-Compliances table.
//
// ONE module, TWO audit types via a dropdown (auditType) — 'Internal'
// (the factory's own internal compliance audit) vs 'External for
// Supplier' (an audit conducted on a supplier) — same "one flat field
// set, type dropdown selects which fields apply/are shown" pattern as
// Emergency Log/Requisition/Miscellaneous Bill.
// ─────────────────────────────────────────────────────────────────────────────

export type AuditCategory = 'Internal' | 'External for Supplier';
export const AUDIT_CATEGORY_OPTIONS: AuditCategory[] = ['Internal', 'External for Supplier'];

export type AuditRound = 'Initial' | '1st Follow-Up' | '2nd Follow-Up' | '3rd Follow-Up' | '4th Follow-Up';
export const AUDIT_ROUND_OPTIONS: AuditRound[] = ['Initial', '1st Follow-Up', '2nd Follow-Up', '3rd Follow-Up', '4th Follow-Up'];

export const AUDITING_AREA_OPTIONS = [
  'Labour Standard', 'Health & Safety', 'Wages & Benefits',
  'Working Hours', 'Environment', 'Business Ethics', 'Training',
] as const;

export interface AuditorItem {
  slNo: number;
  name: string;
  designation: string;
  organization: string;
}

export function blankAuditorItem(slNo: number): AuditorItem {
  return { slNo, name: '', designation: '', organization: '' };
}

export interface CorrectiveActionItem {
  slNo: number;
  nonComplianceNumber: string;
  detailsOfNonCompliance: string;
  nonCompliancePictureLink: string;
  preventiveCorrectiveActions: string;
  timeline: string;
  agreedByManagement: string;
  responsiblePersonName: string;
}

export function blankCorrectiveActionItem(slNo: number): CorrectiveActionItem {
  return {
    slNo, nonComplianceNumber: '', detailsOfNonCompliance: '', nonCompliancePictureLink: '',
    preventiveCorrectiveActions: '', timeline: '', agreedByManagement: '', responsiblePersonName: '',
  };
}

export interface ComplianceAuditData {
  auditType: AuditCategory;

  // ── Audit Details ────────────────────────────────────────────────────────
  companyName: string;
  siteName: string;
  siteAddress: string;
  siteContactName: string;
  siteContactJobTitle: string;
  sitePhone: string;
  siteEmail: string;
  auditRound: AuditRound;
  auditingAreas: string[];
  auditDate: string;
  auditors: AuditorItem[];

  // ── Corrective Action Plan ──────────────────────────────────────────────
  correctiveActions: CorrectiveActionItem[];

  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankComplianceAudit(): ComplianceAuditData {
  return {
    auditType: 'Internal',
    companyName: '', siteName: '', siteAddress: '',
    siteContactName: '', siteContactJobTitle: '', sitePhone: '', siteEmail: '',
    auditRound: 'Initial', auditingAreas: [], auditDate: '',
    auditors: [blankAuditorItem(1)],
    correctiveActions: [blankCorrectiveActionItem(1)],
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_COMPLIANCE_AUDIT_STATE: ComplianceAuditData = blankComplianceAudit();

/** Resizes the auditors array — same pattern as committee members/KPI items. */
export function resizeAuditors(current: AuditorItem[], targetCount: number): AuditorItem[] {
  const count = Math.max(1, targetCount);
  const resized: AuditorItem[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankAuditorItem(i + 1));
  }
  return resized;
}

/** Resizes the corrective-action items array. */
export function resizeCorrectiveActions(current: CorrectiveActionItem[], targetCount: number): CorrectiveActionItem[] {
  const count = Math.max(1, targetCount);
  const resized: CorrectiveActionItem[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankCorrectiveActionItem(i + 1));
  }
  return resized;
}
