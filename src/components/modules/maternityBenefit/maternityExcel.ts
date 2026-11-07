// ─────────────────────────────────────────────────────────────────────────────
// maternityExcel.ts — Excel export for the Maternity Benefit module (same shape as settlementExcel.ts).
//   exportMaternityList : the filtered Statement, one row per record + a totals row.
//   exportMaternityBill : one record's bill — every earning line with its basis.
// Path: src/components/modules/maternityBenefit/maternityExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { MaternityFormData } from './MaternityBenefitTypes';
import type { MaternityRow, MaternityCalc, InstView } from './maternityModel';
import { formatDMY, STATUS_STYLE } from './maternityModel';

const widths = (ws: XLSX.WorkSheet, w: number[]) => { ws['!cols'] = w.map(wch => ({ wch })); };
const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;
const dateOrDash = (iso?: string): string => (iso ? formatDMY(iso) : '—');

/** One installment as three columns: time limit, status (paid / due) and amount. */
const instStatus = (v: InstView, eligible: boolean): string => (!eligible ? '—' : v.paid ? 'পরিশোধিত' : 'বকেয়া');
const instDate = (v: InstView, eligible: boolean): string => (!eligible ? '—' : v.paid ? dateOrDash(v.paidDate) : dateOrDash(v.due));
const instAmount = (v: InstView, eligible: boolean): number => (eligible ? v.amount : 0);

/** One Statement column: header, width, how to read it from a row, and whether the totals row sums it. */
interface ListCol { head: string; width: number; value: (r: MaternityRow, i: number) => string | number; sum?: boolean }

// The order here IS the column order of the sheet; headers, widths, rows and the totals row all come from this one list.
const LIST_COLS: ListCol[] = [
  { head: 'SL',                      width: 5,  value: (_r, i) => i + 1 },
  { head: 'Card No',                 width: 10, value: r => r.cardNo },
  { head: 'Name',                    width: 24, value: r => r.name },
  { head: 'Designation',             width: 18, value: r => r.designation },
  { head: 'Section',                 width: 16, value: r => r.section },
  { head: 'Alive Children',          width: 10, value: r => r.aliveChildren },
  { head: 'যোগ্যতা',                  width: 14, value: r => r.eligibility },
  { head: 'Notice Date',             width: 13, value: r => dateOrDash(r.notice) },
  { head: 'Expected Delivery',       width: 15, value: r => dateOrDash(r.delivery) },
  { head: 'Leave Start',             width: 13, value: r => dateOrDash(r.leaveStart) },
  { head: 'Leave End',               width: 13, value: r => dateOrDash(r.leaveEnd) },
  { head: 'Service',                 width: 20, value: r => r.service },
  { head: 'Monthly Wage',            width: 13, value: r => r.wage },
  { head: 'Daily Wage',              width: 11, value: r => round2(r.daily) },
  { head: '1st Installment Status',  width: 16, value: r => instStatus(r.first, r.eligible) },
  { head: '1st Inst. Paid / Due Date', width: 18, value: r => instDate(r.first, r.eligible) },
  { head: '1st Inst. Amount',        width: 14, value: r => instAmount(r.first, r.eligible), sum: true },
  { head: '2nd Installment Status',  width: 16, value: r => instStatus(r.second, r.eligible) },
  { head: '2nd Inst. Paid / Due Date', width: 18, value: r => instDate(r.second, r.eligible) },
  { head: '2nd Inst. Amount',        width: 14, value: r => instAmount(r.second, r.eligible), sum: true },
  { head: 'Total Paid',              width: 14, value: r => r.totalPaid, sum: true },
  { head: 'Pending Amount',          width: 14, value: r => r.pendingAmount, sum: true },
  { head: 'পরিশোধের অবস্থা',          width: 16, value: r => STATUS_STYLE[r.status].label },
];

/** The filtered Statement: one row per record + a totals row. */
export function exportMaternityList(rows: MaternityRow[], filename: string): void {
  const head = LIST_COLS.map(c => c.head);
  const body = rows.map((r, i) => LIST_COLS.map(c => c.value(r, i)));
  const totals = LIST_COLS.map(c =>
    c.head === 'Name' ? 'Total'
    : c.sum ? round2(rows.reduce((s, r, i) => s + (Number(c.value(r, i)) || 0), 0))
    : '');
  const ws = XLSX.utils.aoa_to_sheet([head, ...body, [], totals]);
  widths(ws, LIST_COLS.map(c => c.width));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Maternity Benefit');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One record's bill: the selected installment's earning lines with their basis. */
export function exportMaternityBill(f: MaternityFormData, c: MaternityCalc, filename: string): void {
  const inst = f.activeInstallmentType;
  const earn: [string, string, number][] = [
    [`প্রসূতি কল্যাণ সুবিধা${inst ? ` (${inst})` : ''}`, `${c.benefitDays} days × ${c.dailyStr}`, c.eligible ? c.benefit : 0],
    ['Current month wage', '', c.salary],
    ['Payable earned leave', '', c.payableEL],
    ['Others', '', c.others],
  ];
  const rows: (string | number)[][] = [
    ['Employee', f.employeeName], ['Card No', f.cardNo], ['Designation', f.designation], ['Section', f.section],
    ['Alive children', f.aliveChildren || '0'],
    ['Joining date', formatDMY(f.joiningDate)], ['Notice date', dateOrDash(f.maternityLeavenoticedDate)],
    ['Expected delivery', formatDMY(f.possibleDeliveryDate)], ['Leave', `${dateOrDash(c.leaveStart)} → ${dateOrDash(c.leaveEnd)}`],
    ['Service', `${c.years} y ${c.months} m ${c.days} d`], ['Eligibility', c.eligibility || '—'],
    ['Monthly wage', Number(f.totalMonthlyWage) || 0], ['Daily wage (÷ 26)', c.daily],
    ['Installment', inst || '—'],
    ['1st installment due', dateOrDash(c.firstDue)], ['2nd installment due', dateOrDash(c.secondDue)],
    [],
    ['EARNINGS', 'Basis', 'Amount (Tk)'], ...earn.filter(e => e[2] > 0).map(e => [e[0], e[1], round2(e[2])]),
    ['TOTAL PAYABLE', '', round2(c.total)],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  widths(ws, [52, 34, 16]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Maternity Bill');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}