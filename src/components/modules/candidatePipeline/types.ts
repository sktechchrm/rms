// ─────────────────────────────────────────────────────────────────────────────
// Candidate Pipeline — types
// Path: src/components/modules/candidatePipeline/types.ts
//
// Part B of the Recruitment & Onboarding stage (Employee Lifecycle & Growth
// Management) — Part A (Manpower Requisition) was added as a third type
// inside the existing Requisition module; this is a genuinely NEW entity
// (a candidate, not a requisition), so it gets its own module.
//
// One record = one candidate (fixed form, matches Left Employee Notice's
// save model), tracked through a single CURRENT stage rather than a full
// stage-transition history log — same complexity level as Legal
// Document's Status / Supplier Assessment's Approval Status, which also
// track current state rather than a full audit trail.
// ─────────────────────────────────────────────────────────────────────────────

export type CandidateStage =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interviewed'
  | 'Selected'
  | 'Offer Sent'
  | 'Offer Accepted'
  | 'Joined'
  | 'Rejected'
  | 'Withdrawn';

export const STAGE_OPTIONS: CandidateStage[] = [
  'Applied', 'Shortlisted', 'Interview Scheduled', 'Interviewed',
  'Selected', 'Offer Sent', 'Offer Accepted', 'Joined', 'Rejected', 'Withdrawn',
];

/** Stages where the pipeline has genuinely ended (no further action expected). */
export const CLOSED_STAGES: CandidateStage[] = ['Joined', 'Rejected', 'Withdrawn'];

export const SOURCE_OPTIONS = ['Referral', 'Job Portal', 'Walk-in', 'Agency', 'Social Media', 'Other'];

export interface CandidateData {
  candidateName: string;
  phone: string;
  email: string;
  positionAppliedFor: string;
  department: string;
  /** Free-text reference to a Manpower Requisition entry (Part A), if
     this candidate is being considered for a specific requisitioned
     vacancy — loose text reference, not a structured cross-module link. */
  requisitionReference: string;
  applicationDate: string;
  source: string;
  stage: CandidateStage;
  interviewDate: string;
  interviewFeedback: string;
  expectedSalary: string;
  offeredSalary: string;
  joiningDate: string;
  remarks: string;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankCandidateData(): CandidateData {
  return {
    candidateName: '', phone: '', email: '', positionAppliedFor: '', department: '',
    requisitionReference: '', applicationDate: new Date().toISOString().split('T')[0],
    source: 'Job Portal', stage: 'Applied',
    interviewDate: '', interviewFeedback: '',
    expectedSalary: '', offeredSalary: '', joiningDate: '', remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_CANDIDATE_STATE: CandidateData = blankCandidateData();

export const STAGE_STYLE: Record<CandidateStage, { bg: string; color: string }> = {
  'Applied':              { bg: '#f1f5f9', color: '#64748b' },
  'Shortlisted':          { bg: '#eff6ff', color: '#1d4ed8' },
  'Interview Scheduled':  { bg: '#fef3c7', color: '#92400e' },
  'Interviewed':          { bg: '#fef3c7', color: '#92400e' },
  'Selected':             { bg: '#ecfdf5', color: '#047857' },
  'Offer Sent':           { bg: '#ecfdf5', color: '#047857' },
  'Offer Accepted':       { bg: '#f0fdf4', color: '#15803d' },
  'Joined':                { bg: '#f0fdf4', color: '#15803d' },
  'Rejected':              { bg: '#fee2e2', color: '#b91c1c' },
  'Withdrawn':             { bg: '#f1f5f9', color: '#64748b' },
};
