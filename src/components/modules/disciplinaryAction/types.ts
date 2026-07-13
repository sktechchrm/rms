// ─────────────────────────────────────────────────────────────────────────────
// Disciplinary Action — types
// Path: src/components/modules/disciplinaryAction/types.ts
//
// REBUILT (3rd round, per explicit correction):
//   ১. কারণ দর্শানো (was "Show cause") — কারণ দর্শানোর তারিখ (renamed
//      from ১ম নোটিশ ইস্যু তারিখ) + বিষয় + অভিযোগ → Notice 1. সূত্র নং is
//      now DYNAMICALLY GENERATED (company code / এইচ.আর. / ডি / সিরিয়াল
//      / বছর), not manually typed.
//   ২. জবাব ও অবস্থা (was "Reply and Status") — unchanged in substance.
//   ৩. প্রতিনিধি মনোনয়ন — NEW, SEPARATE step (was folded into step 3
//      before) — committee member COUNT + its own নোটিশ ইস্যু তারিখ →
//      Notice 2.
//   ৪. তদন্ত কমিটি (was "Form Investigation committee", now ONLY the
//      committee member details table) — its own নোটিশ ইস্যু তারিখ →
//      Notice 3, using business-day-aware deadline math (skips Friday +
//      factory-level festival holidays).
//   ৫. মূল্যায়ন (was "Report and Recommendation") — now ALSO produces a
//      "প্রতিবেদন ও সুপারিশ" output in ফলাফল, not just data entry.
//
// All notice dates are MANUAL entry now (confirmed) — no auto-fill from
// today's date. ফলাফল is populated DYNAMICALLY — a notice only appears
// once its required fields are actually filled in.
// ─────────────────────────────────────────────────────────────────────────────

import { toBanglaNumber, formatDate } from '../../../utils/bnEnDate';

/** DD/MM/YYYY in Bengali digits — combines the two existing primitives
   from utils/bnEnDate.ts, doesn't duplicate either's logic. Same result
   as LeftEmployeeNotice's formatDateBengali, kept local here rather than
   importing across modules to keep this module self-contained. */
export function formatDateBn(dateStr: string): string {
  if (!dateStr) return '';
  return toBanglaNumber(formatDate(dateStr));
}

export type NoticeSubject = 'কারণ দর্শানোর নোটিশ।' | 'অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।';
export const SUBJECT_OPTIONS: NoticeSubject[] = [
  'কারণ দর্শানোর নোটিশ।',
  'অস্থায়ী স্থগিতাদেশ সহ কারণ দর্শানোর নোটিশ।',
];

export type ReplyStatus = '' | 'সন্তোষজনক' | 'অসন্তোষজনক';

export interface CommitteeMember {
  slNo: number;
  name: string;
  cardNo: string;
  designation: string;
  section: string;
}

export function blankCommitteeMember(slNo: number): CommitteeMember {
  return { slNo, name: '', cardNo: '', designation: '', section: '' };
}

export interface DisciplinaryActionData {
  // ── ধাপ ১: কারণ দর্শানো ─────────────────────────────────────────────────
  /** Dynamically generated (company code/এইচ.আর./ডি/serial/year) — see
     generateReferenceNo() below. Not manually typed. */
  referenceNo: string;
  employeeName: string;
  cardNo: string;
  designation: string;
  section: string;
  joiningDate: string;
  /** কারণ দর্শানোর তারিখ — renamed from ১ম নোটিশ ইস্যু তারিখ. Anchor date
     for Notice 3's business-day-aware deadline, AND Notice 1's own print
     date (confirmed identical, separate নোটিশ ১ ইস্যু তারিখ field
     removed as redundant). */
  showCauseDate: string;
  subject: NoticeSubject;
  complaint: string;

  // ── ধাপ ২: জবাব ও অবস্থা ────────────────────────────────────────────────
  replyDate: string;
  replyStatus: ReplyStatus;

  // ── ধাপ ৩: প্রতিনিধি মনোনয়ন ────────────────────────────────────────────
  numberOfCommitteeMembers: string;
  /** Notice 2's issue date — MANUAL. */
  notice2Date: string;

  // ── ধাপ ৪: তদন্ত কমিটি ──────────────────────────────────────────────────
  committeeMembers: CommitteeMember[];
  /** Notice 3's issue date — MANUAL. */
  notice3Date: string;

  // ── ধাপ ৫: মূল্যায়ন ─────────────────────────────────────────────────────
  investigationReportSummary: string;
  recommendation: string;
  finalDecision: string;
  /** প্রতিবেদন ও সুপারিশ output's date — MANUAL. */
  evaluationDate: string;

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankDisciplinaryActionData(): DisciplinaryActionData {
  return {
    referenceNo: '', employeeName: '', cardNo: '', designation: '', section: '', joiningDate: '',
    showCauseDate: '', subject: 'কারণ দর্শানোর নোটিশ।', complaint: '',
    replyDate: '', replyStatus: '',
    numberOfCommitteeMembers: '', notice2Date: '',
    committeeMembers: [], notice3Date: '',
    investigationReportSummary: '', recommendation: '', finalDecision: '', evaluationDate: '',
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_DISCIPLINARY_ACTION_STATE: DisciplinaryActionData = blankDisciplinaryActionData();

/**
 * Number of worker representatives required on the investigation
 * committee — 50% of total, ROUNDED UP (confirmed earlier: 6 members → 3,
 * 5 members → 3, not 2 or 2.5).
 */
export function calculateRepresentativeCount(totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return Math.ceil(totalMembers / 2);
}

/**
 * Generates সূত্র নং dynamically: {companyCode}/এইচ.আর./ডি/{serial 3-digit}/{year}
 * — serial = count of this factory's existing disciplinary-action records
 * in the given year, + 1 (confirmed pattern). companyCode falls back to a
 * generic placeholder if the factory hasn't set FactoryConfig.referenceCode.
 */
export function generateReferenceNo(companyCode: string, existingCountThisYear: number, year: string): string {
  const serial = String(existingCountThisYear + 1).padStart(3, '0');
  const code = companyCode || 'কোম্পানি';
  return `${code}/এইচ.আর./ডি/${toBanglaNumber(serial)}/${year}`;
}

/**
 * Resizes the committeeMembers array to match numberOfCommitteeMembers —
 * dynamic, not manually added/removed. Preserves already-entered data for
 * rows that still exist.
 */
export function resizeCommitteeMembers(current: CommitteeMember[], targetCount: number): CommitteeMember[] {
  const count = Math.max(0, targetCount);
  const resized: CommitteeMember[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankCommitteeMember(i + 1));
  }
  return resized;
}
