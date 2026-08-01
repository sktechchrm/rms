// ─────────────────────────────────────────────────────────────────────────────
// Disciplinary Action — types
// Path: src/components/modules/disciplinaryAction/types.ts
//
// REBUILT (4th round): added Notice 4 — চূড়ান্ত সিদ্ধান্ত অবহিতকরণ,
// formally communicating data.finalDecision to the employee. Notice 4's
// issue date is NOT a manual field — it's derived as the next business
// day after evaluationDate (skipping Friday + factory festival
// holidays), same business-day math used for Notice 3's investigation
// deadline. See calculateNotice4Date() below.
//
// FIX (punishmentType field missing): FinalDecisionForm.tsx's শাস্তি/দণ্ড
// <select> and DisciplinaryNoticeLetter.tsx's Notice 4 body both now
// read/write data.punishmentType, but this field never existed on
// DisciplinaryActionData — the select was previously uncontrolled (no
// value ever persisted) and Notice 4 printed a hardcoded punishment
// string regardless of what was actually chosen. Added below, in ধাপ ৬
// alongside finalDecision — this is the "type of punishment selected
// from the dropdown" (বরখাস্ত / অপসারণ / etc.), separate from
// finalDecision's free-text richtext writeup of the decision.
// ─────────────────────────────────────────────────────────────────────────────

import { toBanglaNumber, formatDate } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';

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
  // NOTE: Notice 4 has no stored date field — its issue date is always
  // DERIVED from evaluationDate (next business day, skipping Friday +
  // festival holidays) via calculateNotice4Date() below, computed fresh
  // wherever it's needed rather than persisted.

  // ── ধাপ ৬: চূড়ান্ত সিদ্ধান্ত ────────────────────────────────────────────
  /** শাস্তি/দণ্ড — the punishment TYPE selected from FinalDecisionForm's
     dropdown (e.g. "বরখাস্ত", "অপসারণ", "জরিমানা"...). Printed on
     Notice 4 in place of the earlier hardcoded punishment string.
     Distinct from finalDecision, which is the free-text richtext
     writeup of the decision/reasoning, not just the punishment label. */
  punishmentType: string;

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
    punishmentType: '',
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

/**
 * Notice 4's issue date — the NEXT BUSINESS DAY after evaluationDate,
 * skipping Friday + any factory-configured festival holiday. Not a
 * manual field: Notice 4 formally communicates finalDecision to the
 * employee right after the evaluation is recorded, so its date is
 * always one business day after evaluationDate, computed fresh rather
 * than stored.
 */
export function calculateNotice4Date(evaluationDate: string, festivalHolidays: string[]): string {
  if (!evaluationDate) return '';
  return addDaysSkippingHolidays(evaluationDate, 1, festivalHolidays);
}