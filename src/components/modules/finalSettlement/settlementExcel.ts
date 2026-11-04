import * as XLSX from 'xlsx';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import type { SettlementRow, Settlement } from './settlementModel';
import { summarize, formatDMY } from './settlementModel';

const widths = (ws: XLSX.WorkSheet, w: number[]) => { ws['!cols'] = w.map(wch => ({ wch })); };

/** The filtered Statement: one row per settlement + a totals row. */
export function exportSettlementList(rows: SettlementRow[], filename: string): void {
  const head = ['SL', 'Card No', 'Name', 'Designation', 'Section', 'Settlement Type', 'Joining Date', 'Last Attendance', 'Settlement Date', 'Service', 'Benefit Years',
    'Total Wage', 'Payable (A)', 'Deduction (B)', 'Net Payable', 'Payment Status', 'Payment Date'];
  const body = rows.map((r, i) => [i + 1, r.cardNo, r.name, r.designation, r.section, r.termination, formatDMY(r.joining), formatDMY(r.lastAttendance), formatDMY(r.settlementDate),
    r.service, r.benefitYears, r.wage, r.receivable, r.deductions, r.net, r.status || 'Not tracked', formatDMY(r.paymentDate)]);
  const s = summarize(rows);
  const ws = XLSX.utils.aoa_to_sheet([head, ...body, [], ['', '', 'Total', '', '', '', '', '', '', '', '', '', s.totalReceivable, s.totalDeductions, s.totalNet]]);
  widths(ws, [5, 10, 24, 18, 16, 28, 12, 14, 14, 20, 10, 12, 13, 13, 13, 13, 12]);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One settlement's bill: every earning and deduction line with its basis. */
export function exportSettlementBill(f: EmployeeFormData, s: Settlement, filename: string): void {
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
    ['Service', `${s.years} y ${s.months} m ${s.days} d (benefit years ${s.benefitYears})`], ['Total monthly wage', Number(f.totalMonthlyWage) || 0], [],
    ['EARNINGS', 'Basis', 'Amount (Tk)'], ...earn.filter(e => e[2] > 0), ['Total payable (A)', '', s.totalReceivable], [],
    ['DEDUCTIONS', 'Basis', 'Amount (Tk)'], ...ded.filter(d => d[2] > 0), ['Total deduction (B)', '', s.totalDeductions], [],
    ['NET PAYABLE (A − B)', '', s.finalTotal],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  widths(ws, [38, 34, 16]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payment Bill');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}