// ─────────────────────────────────────────────────────────────────────────────
// Training Module — types
// Path: src/components/modules/trainingModule/types.ts
//
// Training topic list SOURCED from Worker Guideline's actual 32-topic
// table of contents (WorkerGuidelinePage.tsx's #s1..#s32 list) — copied
// here as a static reference list (not a live import from that page
// component, to avoid a UI-component-to-data-module dependency; if
// Worker Guideline's topic list changes, this list should be updated to
// match, same as any other duplicated reference data in this app).
//
// One record = one training session (fixed form, matches Left Employee
// Notice's save model), covering: monthly training tracking, a
// generated training notice, the assigned trainer (referenced from the
// Trainer Master List module), schedule, conduct confirmation, a
// picture reference (text/URL, no file upload — same approach as Legal
// Document's Attachment/Audit-Visit's Report field), and a DYNAMIC
// participant list (count genuinely varies per session, same resizable-
// array pattern as committee members/KPI items).
// ─────────────────────────────────────────────────────────────────────────────

export const WORKER_GUIDELINE_TOPICS: string[] = [
  '১. কারখানা পরিচিতি', '২. কোম্পানির লক্ষ্য',
  '৩. উৎপাদন প্রক্রিয়া', '৪. নিয়োগ পত্র',
  '৫. হ্যান্ড বুক', '৬. আর্থিক সুবিধা',
  '৭. দক্ষতা বৃদ্ধি', '৮. কর্মক্ষেত্রে ঝুঁকি',
  '৯. স্বাস্থ্য ও নিরাপত্তা', '১০. ক্ষতিপূরণ নীতি',
  '১১. ঘুষ ও দুর্নীতি', '১২. সংরক্ষিত এলাকা',
  '১৩. পুরস্কার', '১৪. দুর্যোগ মোকাবেলা',
  '১৫. হয়রানি/যৌন নির্যাতন', '১৬. বৈষম্য ও জবরদস্তি',
  '১৭. অভিযোগ পদ্ধতি', '১৮. HR বিজনেস প্রিন্সিপাল',
  '১৯. শিশু ও কিশোর শ্রমিক', '২০. শৃঙ্খলা',
  '২১. অসদাচরণ', '২২. দেশি ও বিদেশি শ্রমিক',
  '২৩. সাব-কন্ট্রাক্ট', '২৪. সংগঠনের স্বাধীনতা',
  '২৫. লিঙ্গ সমতা', '২৬. মেটাল কন্ট্রোল',
  '২৭. HIV/AIDS', '২৮. Ergonomic',
  '২৯. মেশিন সেফটি', '৩০. ফিডব্যাক',
  '৩১. কারখানা ভিজিট', '৩২. এনভায়রনমেন্ট',
  'অন্যান্য (Other)',
];

export type TrainingStatus = '' | 'Planned' | 'Notice Sent' | 'Conducted' | 'Cancelled';
export const TRAINING_STATUS_OPTIONS: TrainingStatus[] = ['Planned', 'Notice Sent', 'Conducted', 'Cancelled'];

export interface ParticipantItem {
  slNo: number;
  name: string;
  cardNo: string;
  designation: string;
  department: string;
  attended: boolean;
}

export function blankParticipant(slNo: number): ParticipantItem {
  return { slNo, name: '', cardNo: '', designation: '', department: '', attended: true };
}

export interface TrainingData {
  trainingTopic: string;
  customTopic: string; // used when trainingTopic === 'অন্যান্য (Other)'
  trainingMonth: string; // 1-12
  trainingYear: string;

  noticeIssueDate: string;
  noticeDetails: string;

  trainerName: string; // free text OR pulled from Trainer Master List via the employee-style search

  scheduledDate: string;
  scheduledTime: string;
  venue: string;
  duration: string;

  status: TrainingStatus;
  conductedDate: string;

  pictureLink: string;

  participants: ParticipantItem[];

  remarks: string;
  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankTrainingData(): TrainingData {
  return {
    trainingTopic: '', customTopic: '',
    trainingMonth: String(new Date().getMonth() + 1), trainingYear: String(new Date().getFullYear()),
    noticeIssueDate: '', noticeDetails: '',
    trainerName: '',
    scheduledDate: '', scheduledTime: '', venue: '', duration: '',
    status: 'Planned', conductedDate: '',
    pictureLink: '',
    participants: [],
    remarks: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_TRAINING_STATE: TrainingData = blankTrainingData();

/** Same resizable-array pattern already established for committee
   members (Disciplinary Action) and KPI items (Employee Performance). */
export function resizeParticipants(current: ParticipantItem[], targetCount: number): ParticipantItem[] {
  const count = Math.max(0, targetCount);
  const resized: ParticipantItem[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankParticipant(i + 1));
  }
  return resized;
}
