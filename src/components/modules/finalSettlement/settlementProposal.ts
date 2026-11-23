// ─────────────────────────────────────────────────────────────────────────────
// settlementProposal.ts — the management proposal sheet: employees of ANY mix of চাকরি নিষ্পত্তির ধরন on one sheet,
// every settlement type in its OWN column (all 12 are always shown). Each employee's net payable sits in the column of
// his / her type; the footer gives the head-count and the total of every type.
// Source rows: the multi-employee form (what is being entered / imported), else the filtered saved Statement.
// Path: src/components/modules/finalSettlement/settlementProposal.ts
// ─────────────────────────────────────────────────────────────────────────────

import { TERMINATION_OPTIONS } from './settlementModel';
import type { SettlementRow } from './settlementModel';
import type { BatchGroup, EvaluatedGroup } from './settlementBatch';

export interface ProposalRow {
  key: string; name: string; cardNo: string; designation: string; section: string;
  type: string;                       // TERMINATION_OPTIONS value
  joining: string; lastAttendance: string; service: string; wage: number;
  receivable: number; deductions: number; net: number;
}
export interface ProposalCol { key: string; label: string }

export const OTHER_KEY = '__other';

/** One column per settlement type, in the standard order (+ "অন্যান্য" only when a row has an unknown type). */
export function proposalCols(rows: ProposalRow[]): ProposalCol[] {
  const cols: ProposalCol[] = TERMINATION_OPTIONS.map(o => ({ key: o.value, label: o.label }));
  if (rows.some(r => !TERMINATION_OPTIONS.some(o => o.value === r.type))) cols.push({ key: OTHER_KEY, label: 'অন্যান্য' });
  return cols;
}
export const colKeyOf = (r: ProposalRow): string => (TERMINATION_OPTIONS.some(o => o.value === r.type) ? r.type : OTHER_KEY);

/** Grouped by type (standard order), then by name. */
export function sortProposal(rows: ProposalRow[]): ProposalRow[] {
  const order = (r: ProposalRow) => { const i = TERMINATION_OPTIONS.findIndex(o => o.value === r.type); return i < 0 ? 999 : i; };
  return [...rows].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

export function proposalTotals(rows: ProposalRow[], cols: ProposalCol[]) {
  const count: Record<string, number> = {}, net: Record<string, number> = {};
  for (const c of cols) { count[c.key] = 0; net[c.key] = 0; }
  for (const r of rows) { const k = colKeyOf(r); count[k] += 1; net[k] += r.net; }
  return { count, net, employees: rows.length, grand: rows.reduce((s, r) => s + r.net, 0) };
}

export function proposalFromBatch(groups: BatchGroup[], evaluated: EvaluatedGroup[]): ProposalRow[] {
  const out: ProposalRow[] = [];
  groups.forEach((g, gi) => {
    evaluated[gi]?.rows.forEach(e => {
      if (e.blank) return;
      const f = e.form, c = e.calc;
      out.push({
        key: e.key, name: f.employeeName.trim(), cardNo: f.cardNo, designation: f.designation, section: f.section, type: g.terminationType,
        joining: f.joiningDate, lastAttendance: f.lastAttendance, service: `${c.years} বছর ${c.months} মাস ${c.days} দিন`,
        wage: parseFloat(f.totalMonthlyWage) || 0, receivable: c.totalReceivable, deductions: c.totalDeductions, net: c.finalTotal,
      });
    });
  });
  return sortProposal(out);
}

export function proposalFromSaved(rows: SettlementRow[]): ProposalRow[] {
  return sortProposal(rows.map(r => ({
    key: r.id, name: r.name, cardNo: r.cardNo, designation: r.designation, section: r.section, type: r.termination,
    joining: r.joining, lastAttendance: r.lastAttendance, service: r.service, wage: r.wage,
    receivable: r.receivable, deductions: r.deductions, net: r.net,
  })));
}