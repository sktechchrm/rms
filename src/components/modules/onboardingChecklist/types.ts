// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Checklist — types
// Path: src/components/modules/onboardingChecklist/types.ts
//
// Part C of the Recruitment & Onboarding stage (Employee Lifecycle &
// Growth Management) — Part A (Manpower Requisition) lives inside the
// Requisition module, Part B (Candidate Pipeline) tracks candidates
// through to "Joined". This is the natural next step: once a candidate
// has joined, their onboarding (documents, ID card, bank setup,
// induction, department intro, equipment, policy sign-off) gets tracked
// here, one record per new joiner.
//
// One record = one employee's onboarding (fixed form, matches Left
// Employee Notice's save model), with a FIXED set of 7 checklist items
// (not a user-added/removed array — the checklist itself is standard
// across every new joiner, only its completion status varies).
// ─────────────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  completed: boolean;
  completedDate: string;
  notes: string;
}

export function blankChecklistItem(): ChecklistItem {
  return { completed: false, completedDate: '', notes: '' };
}

export const CHECKLIST_ITEM_KEYS = [
  'documentVerification',
  'idCardIssued',
  'bankAccountSetup',
  'inductionTraining',
  'departmentIntroduction',
  'equipmentUniformIssued',
  'policyAcknowledgment',
] as const;

export type ChecklistItemKey = typeof CHECKLIST_ITEM_KEYS[number];

export const CHECKLIST_ITEM_LABELS: Record<ChecklistItemKey, string> = {
  documentVerification:   'ডকুমেন্ট ভেরিফিকেশন',
  idCardIssued:            'আইডি কার্ড ইস্যু',
  bankAccountSetup:        'ব্যাংক অ্যাকাউন্ট সেটআপ',
  inductionTraining:       'ইন্ডাকশন প্রশিক্ষণ',
  departmentIntroduction:  'বিভাগ পরিচিতি',
  equipmentUniformIssued:  'সরঞ্জাম/ইউনিফর্ম ইস্যু',
  policyAcknowledgment:    'নীতিমালা স্বীকৃতি স্বাক্ষর',
};

export type ProbationStatus = '' | 'চলমান' | 'সম্পন্ন' | 'বর্ধিত' | 'ব্যর্থ';
export const PROBATION_STATUS_OPTIONS: ProbationStatus[] = ['চলমান', 'সম্পন্ন', 'বর্ধিত', 'ব্যর্থ'];

export interface OnboardingChecklistData {
  employeeName: string;
  cardNo: string;
  designation: string;
  department: string;
  joiningDate: string;
  /** Free-text reference to a Candidate Pipeline entry, if this joiner
     came through that pipeline — loose text reference, matching
     Requisition Reference's pattern in Candidate Pipeline itself. */
  candidateReference: string;
  mentorName: string;
  probationStartDate: string;
  probationEndDate: string;
  probationStatus: ProbationStatus;

  // ── Fixed 7-item checklist ────────────────────────────────────────────
  documentVerification: ChecklistItem;
  idCardIssued: ChecklistItem;
  bankAccountSetup: ChecklistItem;
  inductionTraining: ChecklistItem;
  departmentIntroduction: ChecklistItem;
  equipmentUniformIssued: ChecklistItem;
  policyAcknowledgment: ChecklistItem;

  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankOnboardingData(): OnboardingChecklistData {
  return {
    employeeName: '', cardNo: '', designation: '', department: '',
    joiningDate: new Date().toISOString().split('T')[0],
    candidateReference: '', mentorName: '',
    probationStartDate: '', probationEndDate: '', probationStatus: '',
    documentVerification: blankChecklistItem(),
    idCardIssued: blankChecklistItem(),
    bankAccountSetup: blankChecklistItem(),
    inductionTraining: blankChecklistItem(),
    departmentIntroduction: blankChecklistItem(),
    equipmentUniformIssued: blankChecklistItem(),
    policyAcknowledgment: blankChecklistItem(),
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_ONBOARDING_STATE: OnboardingChecklistData = blankOnboardingData();

/** How many of the 7 checklist items are marked complete — used for the
   tracking dashboard's progress display. */
export function calculateProgress(data: OnboardingChecklistData): { done: number; total: number; percent: number } {
  const total = CHECKLIST_ITEM_KEYS.length;
  const done = CHECKLIST_ITEM_KEYS.filter(key => data[key].completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}
