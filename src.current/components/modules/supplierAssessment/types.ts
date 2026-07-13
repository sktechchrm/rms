// ─────────────────────────────────────────────────────────────────────────────
// Supplier Assessment, Approval & Tracking — types
// Path: src/components/modules/supplierAssessment/types.ts
//
// One record = one supplier (fixed form, matches Left Employee Notice's
// save model), with an ARRAY of assessment entries — one supplier can be
// assessed against multiple standards (BSCI, Sedex SMETA, WRAP), each
// with its own approval decision, per explicit confirmation.
//
// Standards covered (verified via search, not assumed):
//   BSCI (amfori)  — not a certification, a framework; produces a grade.
//   Sedex SMETA    — an audit METHODOLOGY (Sedex is the platform), not a
//                    certification; 2-Pillar (Labor + Health&Safety,
//                    mandatory) or 4-Pillar (+ Environment + Business
//                    Ethics); produces a Corrective Action Plan Report
//                    (CAPR); Sedex treats a report as stale after 24
//                    months regardless of risk level.
//   WRAP           — an actual CERTIFICATION (unlike BSCI/Sedex), 12
//                    principles, awarded at a level (commonly Platinum/
//                    Gold/Silver).
// Because each standard's own scale is so different (BSCI grade vs Sedex
// pillar count vs WRAP level), auditType/score are free text rather than
// a fixed dropdown — forcing one shared scale across all three would
// misrepresent at least two of them.
// ─────────────────────────────────────────────────────────────────────────────

export type SupplierAssessmentStandard = 'BSCI' | 'Sedex SMETA' | 'WRAP' | 'Other';
export const STANDARD_OPTIONS: SupplierAssessmentStandard[] = ['BSCI', 'Sedex SMETA', 'WRAP', 'Other'];

export type ApprovalStatus = 'Pending' | 'Approved' | 'Conditional' | 'Rejected';
export const APPROVAL_STATUS_OPTIONS: ApprovalStatus[] = ['Pending', 'Approved', 'Conditional', 'Rejected'];

export const BUSINESS_TYPE_OPTIONS = ['Manufacturer', 'Trading Company', 'Subcontractor', 'Raw Material Supplier', 'Service Provider', 'Other'];

/** One assessment entry — one standard, one audit cycle. Approval is
   recorded PER assessment (not one overall supplier status), since a
   supplier may be approved under BSCI while still pending under Sedex. */
export interface SupplierAssessmentEntry {
  slNo: number;
  standard: SupplierAssessmentStandard;
  /** Free text — e.g. "4-Pillar" (Sedex), "Gold" (WRAP), "Grade A" (BSCI). */
  auditType: string;
  auditDate: string;
  auditorBody: string;
  /** Free text — each standard's own scale (grade/pillar-result/level). */
  score: string;
  keyFindings: string;
  nonConformities: string;
  certificateValidUntil: string;
  /** Text/URL link to the report or certificate — this app has no file-
     upload/storage backend, same approach as Legal Document's Attachment
     and Audit/Visit's Report/Certificate fields. */
  reportLink: string;

  // ── Approval workflow ────────────────────────────────────────────────
  approvalStatus: ApprovalStatus;
  /** Only meaningful when approvalStatus === 'Conditional'. */
  approvalConditions: string;
  approvedBy: string;
  approvalDate: string;
  nextReviewDate: string;
}

export function blankAssessmentEntry(slNo: number): SupplierAssessmentEntry {
  return {
    slNo, standard: 'BSCI', auditType: '', auditDate: '', auditorBody: '',
    score: '', keyFindings: '', nonConformities: '', certificateValidUntil: '', reportLink: '',
    approvalStatus: 'Pending', approvalConditions: '', approvedBy: '', approvalDate: '', nextReviewDate: '',
  };
}

export interface SupplierData {
  supplierName: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessType: string;
  productCategory: string;
  tradeLicenseNo: string;
  assessments: SupplierAssessmentEntry[];

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankSupplierData(): SupplierData {
  return {
    supplierName: '', address: '', contactPerson: '', phone: '', email: '',
    businessType: 'Manufacturer', productCategory: '', tradeLicenseNo: '',
    assessments: [blankAssessmentEntry(1)],
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_SUPPLIER_STATE: SupplierData = blankSupplierData();
