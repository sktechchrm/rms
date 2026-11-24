// ─────────────────────────────────────────────────────────────────────────────
// settlementProposal.ts — the management proposal sheet (English): employees of ANY mix of settlement types on one sheet,
// every settlement type in its OWN column (all 12 are always shown). Each employee's net payable sits in the column of
// his / her type; the footer gives the head-count and the total of every type.
// Besides that every employee row carries the parts of the payment (last month salary, overtime, earned leave,
// compensation / gratuity, notice pay, others) and Total Payable (A) / Deductions (B), so the sheet is self-explanatory.
// Source rows: the multi-employee form (what is being entered / imported), else the filtered saved Statement.
// Path: src/components/modules/finalSettlement/settlementProposal.ts
// ─────────────────────────────────────────────────────────────────────────────

import { TERMINATION_OPTIONS } from './settlementModel';
import type { SettlementRow } from './settlementModel';
import type { BatchGroup, EvaluatedGroup } from './settlementBatch';

/** English names of the settlement types (keys = TERMINATION_OPTIONS values). */
export const TYPE_EN: Record<string, string> = {
  'ইস্তফা (২৭)': 'Resignation (Sec. 27)',
  'অনুপস্থিতির কারণে ইস্তফা (২৭)': 'Resignation due to Absence (Sec. 27)',
  'অবসর (২৮)': 'Retirement (Sec. 28)',
  'চাকুরীরত থাকা অবস্থায় মৃত্যু (১৯)': 'Natural Death in Service (Sec. 19)',
  'কর্মরত অবস্থায়/কর্মকালীন দূর্ঘটনার কারণে মৃত্যু (১৯)': 'Death by Accident at Work (Sec. 19)',
  'ডিসচার্জ (২২)': 'Discharge (Sec. 22)',
  'বরখাস্ত (২৩)': 'Dismissal (Sec. 23)',
  'বরখাস্ত (২৩.৪: খ/ছ)': 'Dismissal (Sec. 23.4 Kha/Chha)',
  'অপসারন (২৩.৩)': 'Removal (Sec. 23.3)',
  'চাকুরী অবসান (২৬)': 'Termination (Sec. 26)',
  'ছাঁটাই (২০)': 'Retrenchment (Sec. 20)',
  'লে-অফ (১৬)': 'Lay-off (Sec. 16)',
};
export const typeEn = (value: string): string => TYPE_EN[value] ?? value;

export type PartKey = 'salary' | 'ot' | 'el' | 'comp' | 'notice' | 'others' | 'receivable' | 'deductions';
/** The amount columns of an employee row, in print order (A and B last). */
export const PART_COLS: { key: PartKey; head: string }[] = [
  { key: 'salary',     head: 'Last Month Salary' },
  { key: 'ot',         head: 'Overtime' },
  { key: 'el',         head: 'Earned Leave' },
  { key: 'comp',       head: 'Compensation / Gratuity' },
  { key: 'notice',     head: 'Notice Pay' },
  { key: 'others',     head: 'Others' },
  { key: 'receivable', head: 'Total Payable (A)' },
  { key: 'deductions', head: 'Deductions (B)' },
];

export interface ProposalRow extends Record<PartKey, number> {
  key: string; name: string; cardNo: string; designation: string; section: string;
  type: string;                       // TERMINATION_OPTIONS value
  joining: string; lastAttendance: string; service: string; wage: number;
  net: number;
}
export interface ProposalCol { key: string; label: string }

export const OTHER_KEY = '__other';

/** One column per settlement type, in the standard order (+ "Other" only when a row has an unknown type). */
export function proposalCols(rows: ProposalRow[]): ProposalCol[] {
  const cols: ProposalCol[] = TERMINATION_OPTIONS.map(o => ({ key: o.value, label: typeEn(o.value) }));
  if (rows.some(r => !TERMINATION_OPTIONS.some(o => o.value === r.type))) cols.push({ key: OTHER_KEY, label: 'Other' });
  return cols;
}
export const colKeyOf = (r: ProposalRow): string => (TERMINATION_OPTIONS.some(o => o.value === r.type) ? r.type : OTHER_KEY);

/** Grouped by type (standard order), then by name. */
export function sortProposal(rows: ProposalRow[]): ProposalRow[] {
  const order = (r: ProposalRow) => { const i = TERMINATION_OPTIONS.findIndex(o => o.value === r.type); return i < 0 ? 999 : i; };
  return [...rows].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

export function proposalTotals(rows: ProposalRow[], cols: ProposalCol[]) {
  const count: Record<string, number> = {}, net: Record<string, number> = {};
  for (const c of cols) { count[c.key] = 0; net[c.key] = 0; }
  for (const r of rows) { const k = colKeyOf(r); count[k] += 1; net[k] += r.net; }
  const parts = {} as Record<PartKey, number>;
  for (const p of PART_COLS) parts[p.key] = round2(rows.reduce((s, r) => s + r[p.key], 0));
  return { count, net, parts, employees: rows.length, grand: round2(rows.reduce((s, r) => s + r.net, 0)) };
}

/** Saved rows keep the service period as a Bangla text — turn it into 1Y 10M 0D. */
const BN = '০১২৩৪৫৬৭৮৯';
const serviceEn = (s: string): string =>
  s.replace(/[০-৯]/g, d => String(BN.indexOf(d))).replace(/বছর/g, 'Y').replace(/মাস/g, 'M').replace(/দিন/g, 'D').replace(/\s+/g, ' ').trim();

export function proposalFromBatch(groups: BatchGroup[], evaluated: EvaluatedGroup[]): ProposalRow[] {
  const out: ProposalRow[] = [];
  groups.forEach((g, gi) => {
    evaluated[gi]?.rows.forEach(e => {
      if (e.blank) return;
      const f = e.form, c = e.calc;
      out.push({
        key: e.key, name: f.employeeName.trim(), cardNo: f.cardNo, designation: f.designation, section: f.section, type: g.terminationType,
        joining: f.joiningDate, lastAttendance: f.lastAttendance, service: `${c.years}Y ${c.months}M ${c.days}D`,
        wage: parseFloat(f.totalMonthlyWage) || 0,
        salary: c.lastMonthSalary, ot: c.lastMonthOvertime, el: c.earnedLeave,
        comp: round2(c.serviceComp + c.deathComp + (c.usesGratuity ? c.gratuity : 0) + c.layOff),
        notice: c.notice, others: c.others, receivable: c.totalReceivable, deductions: c.totalDeductions, net: c.finalTotal,
      });
    });
  });
  return sortProposal(out);
}

export function proposalFromSaved(rows: SettlementRow[]): ProposalRow[] {
  return sortProposal(rows.map(r => ({
    key: r.id, name: r.name, cardNo: r.cardNo, designation: r.designation, section: r.section, type: r.termination,
    joining: r.joining, lastAttendance: r.lastAttendance, service: serviceEn(r.service), wage: r.wage,
    salary: r.salaryAmount, ot: r.otAmount, el: r.elAmount,
    comp: round2(r.serviceComp + r.deathComp + r.gratuity + r.layOff),
    notice: r.noticePay, others: r.others, receivable: r.receivable, deductions: r.deductions, net: r.net,
  })));
}