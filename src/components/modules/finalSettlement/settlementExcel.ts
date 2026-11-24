// ─────────────────────────────────────────────────────────────────────────────
// settlementExcel.ts — Excel downloads of the Final Settlement module (Statement · Payment Bill · Proposal sheet).
// All three share the look of the import template (see excelKit.ts): navy header, frozen, thin lines, number formats.
// Path: src/components/modules/finalSettlement/settlementExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { EmployeeFormData } from './FinalSettlementDataTypes';
import type { SettlementRow, Settlement } from './settlementModel';
import { formatDMY } from './settlementModel';
import type { ProposalRow } from './settlementProposal';
import { proposalCols, colKeyOf, proposalTotals, PART_COLS } from './settlementProposal';
import { newWorkbook, download, styleHeaderRow, styleHeaderCell, thin, NAVY, SLATE, SOFT, GREEN, MONEY, WHOLE } from './excelKit';

// Same labels as the form's "পেমেন্ট অবস্থা" section.
const H_STATUS = 'পরিশোধের অবস্থা';
const H_SALARY_DATE = 'বেতন পরিশোধের তারিখ';
const H_OTHER_DATE = 'ক্ষতিপূরণ, সুবিধাদি ও অন্যান্য পাওনা পরিশোধের তারিখ';
const statusBn = (v?: string): string => (v === 'Paid' ? 'পরিশোধিত' : v === 'Pending' ? 'বকেয়া' : '—');
const dateOrDash = (iso?: string): string => (iso ? formatDMY(iso) : '—');
const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

/**
 * Compensation / Benefit = everything inside Payable (A) except the last-month salary, the overtime and the
 * earned-leave encashment (which have their own columns), so those four columns add up to Total Payable Amount (A).
 */
const compensationOf = (r: SettlementRow): number => r.serviceComp + r.deathComp + r.gratuity + r.layOff + r.noticePay + r.others;

/** One Statement column: header, width, how to read it from a row, and whether the totals row sums it. */
interface ListCol { head: string; width: number; value: (r: SettlementRow, i: number) => string | number; sum?: boolean; money?: boolean }

// The order here IS the column order of the sheet; headers, widths, rows and the totals row all come from this one list.
const LIST_COLS: ListCol[] = [
  { head: 'SL',                       width: 5,  value: (_r, i) => i + 1 },
  { head: 'Card No',                  width: 10, value: r => r.cardNo },
  { head: 'Name',                     width: 24, value: r => r.name },
  { head: 'Designation',              width: 18, value: r => r.designation },
  { head: 'Section',                  width: 16, value: r => r.section },
  { head: 'Joining Date',             width: 13, value: r => formatDMY(r.joining) },
  { head: 'Gross Salary',             width: 13, value: r => r.wage, money: true },
  { head: 'OT Rate',                  width: 10, value: r => r.otRate, money: true },
  { head: 'Settlement Type',          width: 28, value: r => r.termination },
  { head: 'Last Attendance',          width: 14, value: r => formatDMY(r.lastAttendance) },
  { head: 'Service',                  width: 20, value: r => r.service },
  { head: 'Benefit Years',            width: 10, value: r => r.benefitYears },
  { head: 'Payable Salary',           width: 14, value: r => r.salaryAmount, sum: true },
  { head: 'Payable OT',               width: 12, value: r => r.otAmount, sum: true },
  { head: 'EL Encashment',            width: 14, value: r => r.elAmount, sum: true },
  { head: 'Compensation/Benefit',     width: 18, value: r => compensationOf(r), sum: true },
  { head: 'Total Payable Amount (A)', width: 20, value: r => r.receivable, sum: true },
  { head: 'Deduction (B)',            width: 13, value: r => r.deductions, sum: true },
  { head: 'Net Payable Amount (A-B)', width: 20, value: r => r.net, sum: true },
  { head: 'Settlement Date',          width: 14, value: r => formatDMY(r.settlementDate) },
  { head: H_STATUS,                   width: 16, value: r => statusBn(r.status) },
  { head: H_SALARY_DATE,              width: 20, value: r => dateOrDash(r.salaryPaymentDate) },
  { head: H_OTHER_DATE,               width: 34, value: r => dateOrDash(r.paymentDate) },
];

/** The filtered Statement: one row per settlement + a totals row. */
export async function exportSettlementList(rows: SettlementRow[], filename: string): Promise<void> {
  const wb = await newWorkbook();
  const ws = wb.addWorksheet('Settlements', { views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }] });
  LIST_COLS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  styleHeaderRow(ws.addRow(LIST_COLS.map(c => c.head)));
  rows.forEach((r, i) => {
    const row = ws.addRow(LIST_COLS.map(c => c.value(r, i)));
    row.eachCell({ includeEmpty: true }, (cell, n) => {
      const c = LIST_COLS[n - 1];
      cell.border = { bottom: thin, right: thin };
      cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' };
      if (c && (c.sum || c.money)) cell.numFmt = MONEY;
    });
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: LIST_COLS.length } };

  ws.addRow([]);
  const totals = ws.addRow(LIST_COLS.map(c =>
    c.head === 'Name' ? 'Total'
    : c.sum ? round2(rows.reduce((s, r, i) => s + (Number(c.value(r, i)) || 0), 0))
    : ''));
  totals.eachCell({ includeEmpty: true }, (cell, n) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    cell.border = { top: { style: 'medium', color: { argb: NAVY } } };
    if (LIST_COLS[n - 1]?.sum) { cell.numFmt = MONEY; cell.alignment = { horizontal: 'right' }; }
  });
  await download(wb, filename);
}

/** One settlement's bill: every earning and deduction line with its basis. */
export async function exportSettlementBill(f: EmployeeFormData, s: Settlement, filename: string): Promise<void> {
  // A stored date is an override; empty means "follow the automatic due date" (same rule as the form).
  const salaryDate = f.salaryPaymentDate || s.salaryDueDate;
  const otherDate = f.paymentDate || s.otherDueDate;

  const earn: [string, string, number][] = [
    [`Last month wage (${f.lastMonthName} ${f.lastMonthYear})`, `${f.payableDay || 0} days`, s.lastMonthSalary],
    ['Last month overtime', `${f.payableHours || 0} h × ${s.otRate}`, s.lastMonthOvertime],
    ['Earned leave', `${f.elQty || 0} days × ${s.dailyGross}`, s.earnedLeave],
    ['Service compensation', `${s.benefitYears} yr × ${s.sDays} days × ${s.dailyBasic}`, s.serviceComp],
    ['Death compensation', `${s.benefitYears} yr × ${s.dDays} days × ${s.dailyBasic}`, s.deathComp],
    ['Lay-off compensation', `${f.layOffDays || 0} days`, s.layOff],
    ['Gratuity', `${s.benefitYears} yr × ${s.gDays} days × ${s.dailyBasic}`, s.usesGratuity ? s.gratuity : 0],
    ['Notice pay', `${f.noticePayDay || 0} days × ${s.dailyBasic}`, s.notice],
    [`Others ${f.otherBenefits ? `(${f.otherBenefits})` : ''}`.trim(), '', s.others],
  ];
  const ded: [string, string, number][] = [
    ['Notice deduction', `${f.noticeDeductionDay || 0} days × ${s.dailyBasic}`, s.noticeDeduction],
    [`Advance ${f.deductionForAdvance ? `(${f.deductionForAdvance})` : ''}`.trim(), '', s.advance],
    [`Other deduction ${f.deductionParticularsB ? `(${f.deductionParticularsB})` : ''}`.trim(), '', s.otherDeduction],
  ];
  const info: [string, string | number][] = [
    ['Employee', f.employeeName], ['Card No', f.cardNo], ['Designation', f.designation], ['Section', f.section], ['Settlement type', f.terminationType],
    ['Joining date', formatDMY(f.joiningDate)], ['Last attendance', formatDMY(f.lastAttendance)], ['Settlement date', formatDMY(f.settlementDate)],
    ['Service', `${s.years} y ${s.months} m ${s.days} d (benefit years ${s.benefitYears})`], ['Total monthly wage', Number(f.totalMonthlyWage) || 0],
    [H_STATUS, statusBn(f.paymentStatus)], [H_SALARY_DATE, dateOrDash(salaryDate)], [H_OTHER_DATE, dateOrDash(otherDate)],
  ];

  const wb = await newWorkbook();
  const ws = wb.addWorksheet('Payment Bill');
  [52, 34, 16].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  for (const [k, v] of info) {
    const row = ws.addRow([k, v]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
    row.getCell(2).alignment = { horizontal: 'left' };
    if (typeof v === 'number') row.getCell(2).numFmt = MONEY;
    row.eachCell(cell => { cell.border = { bottom: thin }; });
  }
  ws.addRow([]);

  const block = (title: string, lines: [string, string, number][], totalLabel: string, total: number) => {
    const head = ws.addRow([title, 'Basis', 'Amount (Tk)']);
    styleHeaderRow(head, NAVY, 22);
    head.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    for (const l of lines.filter(x => x[2] > 0)) {
      const row = ws.addRow(l);
      row.getCell(3).numFmt = MONEY;
      row.eachCell(cell => { cell.border = { bottom: thin }; });
    }
    const t = ws.addRow([totalLabel, '', total]);
    t.eachCell({ includeEmpty: true }, cell => { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; cell.border = { top: { style: 'thin', color: { argb: NAVY } } }; });
    t.getCell(3).numFmt = MONEY;
    ws.addRow([]);
  };
  block('EARNINGS', earn, 'Total payable (A)', s.totalReceivable);
  block('DEDUCTIONS', ded, 'Total deduction (B)', s.totalDeductions);

  const net = ws.addRow(['NET PAYABLE (A − B)', '', s.finalTotal]);
  net.height = 24;
  net.eachCell({ includeEmpty: true }, cell => {
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    cell.alignment = { vertical: 'middle' };
  });
  net.getCell(3).numFmt = WHOLE;
  await download(wb, filename);
}

/**
 * Management proposal sheet (English): a two-level header (Payment Details · Net Payable by Settlement Type),
 * one column per settlement type (all 12) with the net under the employee's type, then count / total rows.
 */
export async function exportSettlementProposal(rows: ProposalRow[], filename: string): Promise<void> {
  const cols = proposalCols(rows);
  const tot = proposalTotals(rows, cols);
  const lead = ['SL', 'Card No', 'Name', 'Designation', 'Section', 'Joining Date', 'Last Attendance', 'Service', 'Gross Salary'];
  const nL = lead.length, nP = PART_COLS.length, nT = cols.length, nAll = nL + nP + nT;

  const wb = await newWorkbook();
  const ws = wb.addWorksheet('Proposal', { views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }] });
  [5, 10, 24, 18, 16, 13, 14, 14, 12, ...PART_COLS.map(() => 14), ...cols.map(() => 17)].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // header — row 1: group titles (merged), row 2: the column names
  const h1 = ws.addRow([...lead, 'Payment Details (Tk)', ...Array(nP - 1).fill(''), 'Net Payable by Settlement Type (Tk)', ...Array(nT - 1).fill('')]);
  const h2 = ws.addRow([...Array(nL).fill(''), ...PART_COLS.map(p => p.head), ...cols.map(c => c.label)]);
  for (let c = 1; c <= nL; c++) ws.mergeCells(1, c, 2, c);
  ws.mergeCells(1, nL + 1, 1, nL + nP);
  ws.mergeCells(1, nL + nP + 1, 1, nAll);
  h1.height = 22; h2.height = 48;
  for (let c = 1; c <= nAll; c++) {
    styleHeaderCell(h1.getCell(c), NAVY);
    if (c > nL) styleHeaderCell(h2.getCell(c), c <= nL + nP ? SLATE : NAVY);
  }
  ws.getCell(1, nL + nP + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5D50' } };   // the type block gets its own tint
  for (let c = nL + nP + 1; c <= nAll; c++) ws.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5D50' } };

  rows.forEach((r, i) => {
    const k = colKeyOf(r);
    const row = ws.addRow([i + 1, r.cardNo, r.name, r.designation, r.section, r.joining ? formatDMY(r.joining) : '', r.lastAttendance ? formatDMY(r.lastAttendance) : '', r.service, r.wage,
      ...PART_COLS.map(p => r[p.key]), ...cols.map(c => (c.key === k ? r.net : ''))]);
    row.eachCell({ includeEmpty: true }, (cell, n) => {
      cell.border = { bottom: thin, right: thin };
      cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' };
      if (n === nL) cell.numFmt = MONEY;
      else if (n > nL && n <= nL + nP) cell.numFmt = MONEY;
      else if (n > nL + nP) { cell.numFmt = WHOLE; cell.font = { bold: true }; }
    });
  });

  // footer: head-count · totals · grand total
  const foot = (values: (string | number)[], labelFrom: number, labelTo: number) => {
    const row = ws.addRow(values);
    ws.mergeCells(row.number, labelFrom, row.number, labelTo);
    row.eachCell({ includeEmpty: true }, (cell, n) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };
      cell.border = { top: { style: 'thin', color: { argb: NAVY } } };
      if (n > labelTo) cell.alignment = { horizontal: 'right' };
    });
    return row;
  };
  ws.addRow([]);
  foot([`No. of employees`, ...Array(nL + nP - 1).fill(''), ...cols.map(c => tot.count[c.key] || '')], 1, nL + nP).getCell(1).alignment = { horizontal: 'right' };
  const totalRow = foot(['Total (Tk)', ...Array(nL - 1).fill(''), ...PART_COLS.map(p => tot.parts[p.key]), ...cols.map(c => (tot.net[c.key] ? round2(tot.net[c.key]) : ''))], 1, nL);
  totalRow.getCell(1).alignment = { horizontal: 'right' };
  totalRow.eachCell({ includeEmpty: true }, (cell, n) => { if (n > nL && n <= nL + nP) cell.numFmt = MONEY; else if (n > nL + nP) cell.numFmt = WHOLE; });
  const grand = ws.addRow([`Grand Total Net Payable (A − B): Tk ${tot.grand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
  ws.mergeCells(grand.number, 1, grand.number, nAll);
  grand.height = 22;
  grand.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  grand.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  grand.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

  await download(wb, filename);
}