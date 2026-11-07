// ─────────────────────────────────────────────────────────────────────────────
// employeeExcel.ts — Excel export for the Employee Personal File module (same shape as maternityExcel.ts).
//   exportEmployeeList    : the filtered Statement, one row per record + a totals row.
//   exportEmployeeProfile : one employee's full file (every field of the open form) as a Field / Value sheet.
// Path: src/components/modules/employeePersonalFile/employeeExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { EmployeeFormData } from './employee.types';
import type { EmployeeRow } from './employeeModel';
import { formatDMY, STATUS_STYLE } from './employeeModel';

const widths = (ws: XLSX.WorkSheet, w: number[]) => { ws['!cols'] = w.map(wch => ({ wch })); };
const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;
const dateOrDash = (iso?: string): string => (iso ? formatDMY(iso) : '—');

/** One Statement column: header, width, how to read it from a row, and whether the totals row sums it. */
interface ListCol { head: string; width: number; value: (r: EmployeeRow, i: number) => string | number; sum?: boolean }

// The order here IS the column order of the sheet; headers, widths, rows and the totals row all come from this one list.
const LIST_COLS: ListCol[] = [
  { head: 'SL',                width: 5,  value: (_r, i) => i + 1 },
  { head: 'Card No',           width: 10, value: r => r.cardNo },
  { head: 'Name',              width: 24, value: r => r.name },
  { head: 'Name (English)',    width: 24, value: r => r.nameEn },
  { head: 'Designation',       width: 18, value: r => r.designation },
  { head: 'Section / Line',    width: 16, value: r => r.section },
  { head: 'Department',        width: 16, value: r => r.department },
  { head: 'Grade',             width: 8,  value: r => r.grade },
  { head: 'Father',            width: 20, value: r => r.father },
  { head: 'Mother',            width: 20, value: r => r.mother },
  { head: 'Date of Birth',     width: 13, value: r => dateOrDash(r.dob) },
  { head: 'Age',               width: 10, value: r => r.age },
  { head: 'Gender',            width: 9,  value: r => r.gender },
  { head: 'Blood Group',       width: 10, value: r => r.bloodGroup },
  { head: 'NID',               width: 18, value: r => r.nid },
  { head: 'Mobile',            width: 14, value: r => r.mobile },
  { head: 'Present District',  width: 16, value: r => r.presentDistrict },
  { head: 'Permanent District', width: 16, value: r => r.permanentDistrict },
  { head: 'Joining Date',      width: 13, value: r => dateOrDash(r.joining) },
  { head: 'Service',           width: 20, value: r => r.service },
  { head: 'Gross Salary',      width: 14, value: r => r.gross, sum: true },
  { head: 'File Status',       width: 12, value: r => STATUS_STYLE[r.status].label },
  { head: 'Fields Filled',     width: 12, value: r => `${r.filled}/${r.total}` },
  { head: 'Photo',             width: 8,  value: r => (r.hasPhoto ? 'Yes' : 'No') },
  { head: 'Missing',           width: 40, value: r => r.missing.join(', ') },
];

/** The filtered Statement: one row per record + a totals row. */
export function exportEmployeeList(rows: EmployeeRow[], filename: string): void {
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
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Files');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One employee's file: every scalar field of the form (photo data is left out), then education and previous jobs. */
export function exportEmployeeProfile(f: EmployeeFormData, filename: string): void {
  const flat = f as unknown as Record<string, unknown>;
  const rows: (string | number)[][] = [['Field', 'Value']];
  for (const [k, v] of Object.entries(flat)) {
    if (k === 'photo' || k === 'educationHistory' || k === 'previousJobs') continue;
    if (v === null || v === undefined || typeof v === 'object') continue;
    rows.push([k, String(v)]);
  }
  rows.push([], ['EDUCATION', '']);
  (f.educationHistory ?? []).forEach(e => rows.push([`${e.education} (${e.educationGroup})`, `${e.institution} · ${e.educationBoard} · ${e.passingYear} · ${e.educationResult}`]));
  rows.push([], ['PREVIOUS EXPERIENCE', '']);
  (f.previousJobs ?? []).forEach(j => rows.push([j.prevCompanyName, `${j.prevDesignation} · ${j.prevServiceYears} · ${j.prevLeaveReason} · ${j.prevRefDetails}`]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  widths(ws, [28, 70]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee File');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
