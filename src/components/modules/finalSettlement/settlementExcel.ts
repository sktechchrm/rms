import * as XLSX from 'xlsx';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import type { SettlementRow, Settlement } from './settlementModel';
import { formatDMY } from './settlementModel';

const widths = (ws: XLSX.WorkSheet, w: number[]) => { ws['!cols'] = w.map(wch => ({ wch })); };

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
interface ListCol { head: string; width: number; value: (r: SettlementRow, i: number) => string | number; sum?: boolean }

// The order here IS the column order of the sheet; headers, widths, rows and the totals row all come from this one list.
const LIST_COLS: ListCol[] = [
  { head: 'SL',                       width: 5,  value: (_r, i) => i + 1 },
  { head: 'Card No',                  width: 10, value: r => r.cardNo },
  { head: 'Name',                     width: 24, value: r => r.name },
  { head: 'Designation',              width: 18, value: r => r.designation },
  { head: 'Section',                  width: 16, value: r => r.section },
  { head: 'Joining Date',             width: 13, value: r => formatDMY(r.joining) },
  { head: 'Gross Salary',             width: 13, value: r => r.wage },
  { head: 'OT Rate',                  width: 10, value: r => r.otRate },
  { head: 'Settlement Type',          width: 28, value: r => r.termination },
  { head: 'Last Attendance',          width: 14, value: r => formatDMY(r.lastAttendance) },
  { head: 'Service',                 width: 20, value: r => r.service },
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
export function exportSettlementList(rows: SettlementRow[], filename: string): void {
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
  XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One settlement's bill: every earning and deduction line with its basis. */
export function exportSettlementBill(f: EmployeeFormData, s: Settlement, filename: string): void {
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
  const rows: (string | number)[][] = [
    ['Employee', f.employeeName], ['Card No', f.cardNo], ['Designation', f.designation], ['Section', f.section], ['Settlement type', f.terminationType],
    ['Joining date', formatDMY(f.joiningDate)], ['Last attendance', formatDMY(f.lastAttendance)], ['Settlement date', formatDMY(f.settlementDate)],
    ['Service', `${s.years} y ${s.months} m ${s.days} d (benefit years ${s.benefitYears})`], ['Total monthly wage', Number(f.totalMonthlyWage) || 0],
    [H_STATUS, statusBn(f.paymentStatus)],
    [H_SALARY_DATE, dateOrDash(salaryDate)],
    [H_OTHER_DATE, dateOrDash(otherDate)],
    [],
    ['EARNINGS', 'Basis', 'Amount (Tk)'], ...earn.filter(e => e[2] > 0), ['Total payable (A)', '', s.totalReceivable], [],
    ['DEDUCTIONS', 'Basis', 'Amount (Tk)'], ...ded.filter(d => d[2] > 0), ['Total deduction (B)', '', s.totalDeductions], [],
    ['NET PAYABLE (A − B)', '', s.finalTotal],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  widths(ws, [52, 34, 16]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payment Bill');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}