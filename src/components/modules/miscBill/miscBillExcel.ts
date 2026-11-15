// ─────────────────────────────────────────────────────────────────────────────
// miscBillExcel.ts — Excel export of the filtered statement.
//   Bills sheet:   one row per bill (date, template, subject, entries, grand total, prepared by) + totals.
//   Entries sheet: one row per employee line of every bill, with the same figures the bill prints.
// Path: src/components/modules/miscBill/miscBillExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { BillRow } from './miscBillModel';
import { flattenEntries, formatDMY, summarize } from './miscBillModel';
import { calculateDynamicBasicSalary } from './types';

const widths = (ws: XLSX.WorkSheet, w: number[]) => { ws['!cols'] = w.map(wch => ({ wch })); };
const num = (n: number) => Math.round(n * 100) / 100;

export function exportMiscBillExcel(rows: BillRow[], filename: string): void {
  const wb = XLSX.utils.book_new();

  // ── Bills ──
  const billHead = ['SL', 'Bill Date', 'Template', 'Subject', 'Entries', 'Grand Total (Tk)', 'Prepared By'];
  const billBody = rows.map((r, i) => [i + 1, formatDMY(r.date), r.templateLabel, r.subject, r.entries, num(r.total), r.preparedBy]);
  const s = summarize(rows);
  const bills = XLSX.utils.aoa_to_sheet([billHead, ...billBody, [], ['', '', 'Total', `${s.bills} bills`, s.entries, num(s.total), '']]);
  widths(bills, [5, 12, 22, 40, 9, 16, 22]);
  bills['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: billBody.length, c: billHead.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, bills, 'Bills');

  // ── Entries ──
  const entHead = ['Bill Date', 'Template', 'Subject', 'SL', 'Particulars', 'Name', 'Card No.', 'Designation', 'Department',
    'Gross Salary', 'Basic Salary', 'Count', 'Payable Amount (Tk)'];
  const entBody = flattenEntries(rows).map(({ bill, item, payable }) => [
    formatDMY(bill.date), bill.templateLabel, bill.subject, item.slNo, item.particulars, item.name, item.cardNo, item.designation, item.department,
    Number(item.grossSalary) || 0, num(calculateDynamicBasicSalary(item.grossSalary)), bill.template === 'adjustment' ? '' : item.count, num(payable),
  ]);
  const entriesTotal = flattenEntries(rows).reduce((t, e) => t + e.payable, 0);
  const entries = XLSX.utils.aoa_to_sheet([entHead, ...entBody, [], ['', '', '', '', '', '', '', '', 'Total', '', '', '', num(entriesTotal)]]);
  widths(entries, [12, 22, 36, 6, 30, 22, 12, 18, 16, 13, 13, 9, 18]);
  entries['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: entBody.length, c: entHead.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, entries, 'Entries');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
