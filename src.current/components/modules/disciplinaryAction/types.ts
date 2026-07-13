// ─────────────────────────────────────────────────────────────────────────────
// Disciplinary Action — types
// Path: src/components/modules/disciplinaryAction/types.ts
//
// A branching workflow (per the reference image), NOT a simple sequential
// form like most other modules in this app:
//
//   Field Set 1 (employee info) → generates Notice 1 (Show Cause /
//   Temporary Suspension)
//     ↓
//   Field Set 2 (reply status: Satisfactory / Not Satisfactory)
//     ↓ if Satisfactory → CASE CLOSED, stop here
//     ↓ if Not Satisfactory → continue
//   Field Set 3 (number of committee members) → generates Notice 2
//   (Representative Nomination — 50% of committee = worker representatives,
//   rounded UP: ceil(total/2), confirmed 6→3 and 5→3, not 2 or 2.5)
//     ↓
//   Field Set 4 (committee member details — a DYNAMIC TABLE whose row
//   count equals Field Set 3's number, not manually added/removed rows)
//   → generates Notice 3 (start investigation — deadline = Notice 1's
//   ISSUE DATE + 50 days, not "today" when Notice 3 happens to print)
// ─────────────────────────────────────────────────────────────────────────────

export type ReplyStatus = '' | 'Satisfactory' | 'Not Satisfactory';

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
  // ── Field Set 1 ──────────────────────────────────────────────────────────
  employeeName: string;
  cardNo: string;
  designation: string;
  section: string;
  joiningDate: string;
  /** The actual issue date of Notice 1 — the anchor date Notice 3's
     50-day investigation deadline is computed from, NOT whatever date
     Notice 3 happens to be printed on. */
  notice1Date: string;

  // ── Field Set 2 ──────────────────────────────────────────────────────────
  replyStatus: ReplyStatus;

  // ── Field Set 3 (only meaningful when replyStatus === 'Not Satisfactory') ─
  numberOfCommitteeMembers: string;

  // ── Field Set 4 (dynamic table — row count driven by Field Set 3) ────────
  committeeMembers: CommitteeMember[];

  date: string;
  factoryName: string;
  factoryAddress: string;
}

export function blankDisciplinaryActionData(): DisciplinaryActionData {
  return {
    employeeName: '', cardNo: '', designation: '', section: '', joiningDate: '',
    notice1Date: new Date().toISOString().split('T')[0],
    replyStatus: '',
    numberOfCommitteeMembers: '',
    committeeMembers: [],
    date: new Date().toISOString().split('T')[0],
    factoryName: '', factoryAddress: '',
  };
}

export const INITIAL_DISCIPLINARY_ACTION_STATE: DisciplinaryActionData = blankDisciplinaryActionData();

/**
 * Number of worker representatives required on the investigation
 * committee — 50% of total, ROUNDED UP (confirmed: 6 members → 3,
 * 5 members → 3, not 2 or 2.5). Math.ceil, not Math.round, so an odd
 * total always favors more worker representation, never less.
 */
export function calculateRepresentativeCount(totalMembers: number): number {
  if (totalMembers <= 0) return 0;
  return Math.ceil(totalMembers / 2);
}

/**
 * Investigation deadline = Notice 1's ISSUE DATE + 50 days (confirmed —
 * not "today" when Notice 3 is printed, which could be any later date).
 */
export function calculateInvestigationDeadline(notice1Date: string): string {
  if (!notice1Date) return '';
  const base = new Date(notice1Date);
  if (isNaN(base.getTime())) return '';
  const deadline = new Date(base);
  deadline.setDate(deadline.getDate() + 50);
  return deadline.toISOString().split('T')[0];
}

/**
 * Resizes the committeeMembers array to match numberOfCommitteeMembers —
 * called whenever Field Set 3's count changes, so Field Set 4's table
 * always has exactly that many rows (dynamic, not manually added/removed
 * like every other module's item tables in this app). Preserves already-
 * entered data for rows that still exist; new rows are blank; extra rows
 * beyond the new count are dropped.
 */
export function resizeCommitteeMembers(current: CommitteeMember[], targetCount: number): CommitteeMember[] {
  const count = Math.max(0, targetCount);
  const resized: CommitteeMember[] = [];
  for (let i = 0; i < count; i++) {
    resized.push(current[i] ? { ...current[i], slNo: i + 1 } : blankCommitteeMember(i + 1));
  }
  return resized;
}
