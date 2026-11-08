// ─────────────────────────────────────────────────────────────────────────────
// employeeExcel.ts — Excel export AND import for the Employee Personal File module (same shape as maternityExcel.ts).
//   exportEmployeeList      : the filtered Statement, one row per record + a totals row.
//   exportEmployeeProfile   : one employee's full file as a Field / Label / Value sheet + Education + Previous Jobs sheets.
//                             (the same layout the importer reads, so an exported file can be corrected and imported back)
//   downloadEmployeeTemplate: the blank file to fill in.
//   parseEmployeeWorkbook / readEmployeeFile : Excel → form values (see the IMPORT section below).
// Path: src/components/modules/employeePersonalFile/employeeExcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { EmployeeFormData } from './employee.types';
import type { EmployeeRow, FieldKind } from './employeeModel';
import { formatDMY, STATUS_STYLE, FIELD_DEFS, ENTRY_DEFS, REQUIRED_FIELDS } from './employeeModel';

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

// ─── Template + profile export ───────────────────────────────────────────────

const REQUIRED = new Set(REQUIRED_FIELDS.map(f => f.key));
const FIELD_HEAD = ['Field', 'Label', 'Value', 'Note', 'Section'];
const noteOf = (d: typeof FIELD_DEFS[number]): string =>
  [d.en, REQUIRED.has(d.key) ? 'আবশ্যক' : '', d.kind === 'date' ? 'তারিখ: dd-mm-yyyy বা yyyy-mm-dd' : d.kind === 'mobile' ? '১১ ডিজিট' : '', d.note ?? '']
    .filter(Boolean).join(' · ');

/** Field / Label / Value sheet: `values` fills the Value column (empty for the template). */
function fieldSheet(values: Record<string, string>): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([FIELD_HEAD, ...FIELD_DEFS.map(d => [d.key, d.bn, values[d.key] ?? '', noteOf(d), d.section])]);
  widths(ws, [22, 30, 34, 60, 18]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as unknown as XLSX.WorkSheet['!freeze'];
  return ws;
}
function entrySheet(kind: 'education' | 'previous', rows: Record<string, string>[]): XLSX.WorkSheet {
  const defs = ENTRY_DEFS[kind];
  const ws = XLSX.utils.aoa_to_sheet([defs.map(d => d.bn), ...rows.map(r => defs.map(d => r[d.key] ?? ''))]);
  widths(ws, defs.map(() => 22));
  return ws;
}
function tableSheet(): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([FIELD_DEFS.map(d => d.bn)]);
  widths(ws, FIELD_DEFS.map(d => Math.max(14, d.bn.length + 2)));
  return ws;
}

/** The blank file: Employee (one person) · Education · Previous Jobs · Table (many people, one row each). */
export function downloadEmployeeTemplate(filename = 'Employee_Import_Template'): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, fieldSheet({}), 'Employee');
  XLSX.utils.book_append_sheet(wb, entrySheet('education', []), 'Education');
  XLSX.utils.book_append_sheet(wb, entrySheet('previous', []), 'Previous Jobs');
  XLSX.utils.book_append_sheet(wb, tableSheet(), 'Table');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** One employee's file (photo data is left out) in the same layout the importer reads. */
export function exportEmployeeProfile(f: EmployeeFormData, filename: string): void {
  const flat = f as unknown as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const d of FIELD_DEFS) { const v = flat[d.key]; if (v !== null && v !== undefined && typeof v !== 'object') values[d.key] = String(v); }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, fieldSheet(values), 'Employee');
  XLSX.utils.book_append_sheet(wb, entrySheet('education', (f.educationHistory ?? []) as unknown as Record<string, string>[]), 'Education');
  XLSX.utils.book_append_sheet(wb, entrySheet('previous', (f.previousJobs ?? []) as unknown as Record<string, string>[]), 'Previous Jobs');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── IMPORT ──────────────────────────────────────────────────────────────────
// Reads an Excel file into form values. Two layouts are understood (any sheet, the first one that has data wins):
//   Field / Value : a column "Field" (or "Label") and a column "Value", one field per row  → ONE employee   (the template, the export)
//   Table         : a header row of field names, one employee per row                       → MANY employees (the user picks one)
// Column names may be the field key (fullName), the Bangla caption or the English caption — spacing and case do not matter.
// Sheets called Education / শিক্ষা and Previous Jobs / অভিজ্ঞতা fill the two tables (only when the file holds ONE employee).
// Cells are cleaned up per field type (dates from Excel serials or dd-mm-yyyy, Bangla digits, gender / blood group words,
// mobile numbers that lost their leading 0 …). A cell that cannot be understood is NOT applied and is reported instead.

export interface ImportIssue { key: string; text: string }
export interface ImportedEmployee {
  label: string;                          // what the picker shows (name · card no)
  values: Record<string, string>;         // form key → cleaned value (blank cells are left out)
  issues: ImportIssue[];                  // cells skipped or worth a second look
  education: Record<string, string>[];
  previous: Record<string, string>[];
}
export interface ImportResult {
  employees: ImportedEmployee[];
  unknown: string[];                      // column / field names that matched nothing
  sheet: string;
  layout: 'field' | 'table';
  notes: string[];
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const asciiDigits = (s: string) => s.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[\s_\-().,:;'’"*\/]+/g, '');
const pad2 = (x: number) => String(x).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => (y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad2(m)}-${pad2(d)}` : '');

/** Excel serial / Date / text → yyyy-mm-dd ('' when it is not a date). */
function toIsoDate(raw: unknown): string {
  if (raw instanceof Date) return ymd(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  if (typeof raw === 'number') { const p = XLSX.SSF.parse_date_code(raw); return p ? ymd(p.y, p.m, p.d) : ''; }
  const t = asciiDigits(String(raw ?? '').trim());
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(t);
  if (m) return ymd(Number(m[3]), Number(m[2]), Number(m[1]));
  return '';
}
/** A cell as plain text — big numbers (NID, account no) never turn into 1.2E+12. */
function cellText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'number') return Number.isFinite(raw) ? (Math.abs(raw) >= 1e15 ? raw.toLocaleString('fullwide', { useGrouping: false }) : String(raw)) : '';
  if (raw instanceof Date) return toIsoDate(raw);
  return String(raw).trim();
}

const GENDER: Record<string, string> = { male: 'Male', m: 'Male', পুরুষ: 'Male', ছেলে: 'Male', female: 'Female', f: 'Female', নারী: 'Female', মহিলা: 'Female', মেয়ে: 'Female', other: 'Other', তৃতীয়লিঙ্গ: 'Other', hijra: 'Other' };
const MARITAL: Record<string, string> = { single: 'Single', unmarried: 'Single', অবিবাহিত: 'Single', married: 'Married', বিবাহিত: 'Married', divorced: 'Divorced', তালাকপ্রাপ্ত: 'Divorced', তালাকপ্রাপ্তা: 'Divorced' };

/** Cleans ONE cell for its field type. `value` is '' when the cell cannot be used (then `warn` says why). */
export function normalizeCell(kind: FieldKind, raw: unknown): { value: string; warn?: string } {
  if (kind === 'date') {
    if (cellText(raw) === '') return { value: '' };
    const iso = toIsoDate(raw);
    return iso ? { value: iso } : { value: '', warn: 'তারিখ বোঝা যায়নি (dd-mm-yyyy ব্যবহার করুন)' };
  }
  const t = cellText(raw);
  if (t === '') return { value: '' };
  switch (kind) {
    case 'gender': { const g = GENDER[norm(t)]; return g ? { value: g } : { value: '', warn: `লিঙ্গ বোঝা যায়নি: ${t}` }; }
    case 'marital': { const m = MARITAL[norm(t)]; return m ? { value: m } : { value: '', warn: `বৈবাহিক অবস্থা বোঝা যায়নি: ${t}` }; }
    case 'blood': {
      const b = t.toUpperCase().replace(/\s/g, '').replace(/POSITIVE|\+VE|পজিটিভ/g, '+').replace(/NEGATIVE|-VE|নেগেটিভ/g, '-').replace(/[()]/g, '');
      return /^(A|B|AB|O)[+-]$/.test(b) ? { value: b } : { value: '', warn: `রক্তের গ্রুপ বোঝা যায়নি: ${t}` };
    }
    case 'mobile': {
      const d = asciiDigits(t).replace(/\D/g, '');
      const v = d.length === 10 && d.startsWith('1') ? `0${d}` : d;       // the spreadsheet dropped the leading 0
      return v.length === 11 ? { value: v } : { value: v || t, warn: 'মোবাইল নম্বর ১১ ডিজিটের নয়' };
    }
    case 'number': { const x = parseFloat(asciiDigits(t).replace(/,/g, '')); return Number.isFinite(x) ? { value: String(x) } : { value: '', warn: `সংখ্যা বোঝা যায়নি: ${t}` }; }
    case 'email': return t.includes('@') ? { value: t } : { value: t, warn: 'ইমেইল ঠিকানা সঠিক নয়' };
    default: return { value: t };
  }
}

// header text → field definition (key, Bangla and English captions, plus a few common short names)
const ALIASES: Record<string, string> = {
  name: 'fullName', employeename: 'fullName', নাম: 'fullName', card: 'cardNo', cardnumber: 'cardNo', কার্ড: 'cardNo', id: 'idNo',
  phone: 'mobile', mobileno: 'mobile', মোবাইল: 'mobile', dob: 'dateOfBirth', birthdate: 'dateOfBirth', joining: 'joiningDate', doj: 'joiningDate',
  dateofjoining: 'joiningDate', salary: 'grossSalary', gross: 'grossSalary', section: 'sectionLine', line: 'sectionLine',
};
const fieldIndex = (() => {
  const m = new Map<string, typeof FIELD_DEFS[number]>();
  for (const d of FIELD_DEFS) for (const k of [d.key, d.bn, d.en]) m.set(norm(k), d);
  for (const [a, key] of Object.entries(ALIASES)) { const d = FIELD_DEFS.find(x => x.key === key); if (d && !m.has(norm(a))) m.set(norm(a), d); }
  return m;
})();
const entryIndex = (kind: 'education' | 'previous') => {
  const m = new Map<string, typeof ENTRY_DEFS.education[number]>();
  for (const d of ENTRY_DEFS[kind]) for (const k of [d.key, d.bn, d.en]) m.set(norm(k), d);
  return m;
};

type Grid = unknown[][];
const sheetRows = (ws: XLSX.WorkSheet): Grid => XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });
const blankRow = (r: unknown[]) => r.every(c => cellText(c) === '');

function parseEntries(rows: Grid, kind: 'education' | 'previous'): Record<string, string>[] {
  const idx = entryIndex(kind);
  const hi = rows.slice(0, 10).findIndex(r => r.filter(c => idx.has(norm(c))).length >= 2);
  if (hi < 0) return [];
  const cols = rows[hi].map(c => idx.get(norm(c)));
  const out: Record<string, string>[] = [];
  for (const r of rows.slice(hi + 1)) {
    if (blankRow(r)) continue;
    const e: Record<string, string> = {};
    cols.forEach((d, i) => { if (d) { const v = d.kind === 'date' ? normalizeCell('date', r[i]).value : cellText(r[i]); if (v) e[d.key] = v; } });
    if (Object.keys(e).length) out.push(e);
  }
  return out;
}

function finish(values: Record<string, string>, issues: ImportIssue[], fallback: string): ImportedEmployee {
  const name = values.fullNameBengali || values.fullName || '';
  return { label: [name || fallback, values.cardNo].filter(Boolean).join(' · '), values, issues, education: [], previous: [] };
}

/** Field / Value layout → one employee. */
function parseFieldSheet(rows: Grid): { emp: ImportedEmployee; unknown: string[] } | null {
  const hi = rows.slice(0, 10).findIndex(r => r.some(c => ['field', 'key', 'ঘর'].includes(norm(c))) && r.some(c => ['value', 'মান'].includes(norm(c))));
  if (hi < 0) return null;
  const head = rows[hi].map(norm);
  const kc = head.findIndex(h => h === 'field' || h === 'key' || h === 'ঘর'), vc = head.findIndex(h => h === 'value' || h === 'মান');
  const lc = head.findIndex(h => h === 'label');
  const values: Record<string, string> = {}, issues: ImportIssue[] = [], unknown: string[] = [];
  for (const r of rows.slice(hi + 1)) {
    const name = cellText(r[kc]) || (lc >= 0 ? cellText(r[lc]) : '');
    if (!name || cellText(r[vc]) === '') continue;
    const d = fieldIndex.get(norm(name)) ?? (lc >= 0 ? fieldIndex.get(norm(r[lc])) : undefined);
    if (!d) { unknown.push(name); continue; }
    const n = normalizeCell(d.kind, r[vc]);
    if (n.warn) issues.push({ key: d.key, text: n.warn });
    if (n.value !== '') values[d.key] = n.value;
  }
  return { emp: finish(values, issues, 'কর্মী'), unknown };
}

/** Table layout → one employee per row. */
function parseTableSheet(rows: Grid): { emps: ImportedEmployee[]; unknown: string[] } | null {
  const hi = rows.slice(0, 10).findIndex(r => r.filter(c => fieldIndex.has(norm(c))).length >= 2);
  if (hi < 0) return null;
  const cols = rows[hi].map(c => fieldIndex.get(norm(c)));
  const unknown = rows[hi].filter((c, i) => cellText(c) !== '' && !cols[i]).map(cellText);
  const emps: ImportedEmployee[] = [];
  rows.slice(hi + 1).forEach((r, ri) => {
    if (blankRow(r)) return;
    const values: Record<string, string> = {}, issues: ImportIssue[] = [];
    cols.forEach((d, i) => {
      if (!d) return;
      const n = normalizeCell(d.kind, r[i]);
      if (n.warn) issues.push({ key: d.key, text: n.warn });
      if (n.value !== '' && values[d.key] === undefined) values[d.key] = n.value;
    });
    if (Object.keys(values).length) emps.push(finish(values, issues, `সারি ${hi + ri + 2}`));
  });
  return { emps, unknown };
}

/** Pure: a workbook → what to put into the form. Throws a readable message when nothing usable is found. */
export function parseEmployeeWorkbook(wb: XLSX.WorkBook): ImportResult {
  const isEdu = (n: string) => /education|শিক্ষা/i.test(n), isPrev = (n: string) => /previous|experience|অভিজ্ঞতা/i.test(n);
  let result: ImportResult | null = null;
  for (const name of wb.SheetNames.filter(n => !isEdu(n) && !isPrev(n))) {
    const rows = sheetRows(wb.Sheets[name]);
    const fv = parseFieldSheet(rows);
    if (fv) {                                   // a Field / Value sheet: use it, or skip it when still blank (never read it as a table)
      if (Object.keys(fv.emp.values).length) { result = { employees: [fv.emp], unknown: fv.unknown, sheet: name, layout: 'field', notes: [] }; break; }
      continue;
    }
    const tb = parseTableSheet(rows);
    if (tb && tb.emps.length) { result = { employees: tb.emps, unknown: tb.unknown, sheet: name, layout: 'table', notes: [] }; break; }
  }
  if (!result) throw new Error('কোনো চেনা কলাম বা ঘর পাওয়া যায়নি — টেমপ্লেট ডাউনলোড করে সেটিতে তথ্য দিন।');

  const eduName = wb.SheetNames.find(isEdu), prevName = wb.SheetNames.find(isPrev);
  if (result.employees.length === 1) {
    if (eduName) result.employees[0].education = parseEntries(sheetRows(wb.Sheets[eduName]), 'education');
    if (prevName) result.employees[0].previous = parseEntries(sheetRows(wb.Sheets[prevName]), 'previous');
  } else if (eduName || prevName) {
    result.notes.push('একাধিক কর্মী থাকায় শিক্ষা ও পূর্ববর্তী অভিজ্ঞতার শিট বাদ দেওয়া হয়েছে (একজনের ফাইলে সেগুলো আমদানি হয়)।');
  }
  return result;
}

/** Reads an uploaded .xlsx / .xls / .csv file. */
export async function readEmployeeFile(file: File): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  return parseEmployeeWorkbook(XLSX.read(buf, { type: 'array' }));
}

// ─── Column-by-column import (the bulk import page) ──────────────────────────
// The user picks the columns and their order; the template / copied header row / pasted data all follow that order.

const defOf = (key: string) => FIELD_DEFS.find(d => d.key === key);

/** Blank template with only the chosen columns, in the chosen order. */
export function downloadColumnTemplate(keys: string[], filename = 'Employee_Import_Columns'): void {
  const defs = keys.map(defOf).filter((d): d is typeof FIELD_DEFS[number] => !!d);
  const ws = XLSX.utils.aoa_to_sheet([defs.map(d => d.bn)]);
  widths(ws, defs.map(d => Math.max(16, d.bn.length + 4)));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Table');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Pasted cells (tab separated, as copied from Excel; comma separated is accepted too) → one employee per line, by column position. */
export function parsePastedRows(text: string, keys: string[]): { employees: ImportedEmployee[]; headerSkipped: boolean } {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '');
  const delim = lines.some(l => l.includes('\t')) ? '\t' : ',';
  let grid = lines.map(l => l.split(delim));
  const defs = keys.map(defOf);
  const labels = defs.map(d => (d ? new Set([norm(d.bn), norm(d.en), norm(d.key)]) : new Set<string>()));
  const first = grid[0] ?? [];
  const headerSkipped = first.length > 0 && first.filter((c, i) => labels[i]?.has(norm(c))).length >= Math.max(1, Math.ceil(keys.length / 2));
  if (headerSkipped) grid = grid.slice(1);
  const employees: ImportedEmployee[] = [];
  grid.forEach((cells, ri) => {
    const values: Record<string, string> = {}, issues: ImportIssue[] = [];
    defs.forEach((d, i) => {
      if (!d) return;
      const n = normalizeCell(d.kind, (cells[i] ?? '').trim());
      if (n.warn) issues.push({ key: d.key, text: n.warn });
      if (n.value !== '') values[d.key] = n.value;
    });
    employees.push(finish(values, issues, `সারি ${ri + 1 + (headerSkipped ? 1 : 0)}`));
  });
  return { employees, headerSkipped };
}
