// ─────────────────────────────────────────────────────────────────────────────
// Leftnoticeexcel.ts — Excel export AND bulk import for the Left Worker Notice module.
//   exportNoticeList        : the filtered Statement, one row per absent worker.
//   NOTICE_FIELDS           : every column the bulk import knows (key · Bangla / English caption · type · section).
//   downloadNoticeTemplate  : blank file with the chosen columns, in the chosen order (+ a short instruction sheet).
//   readNoticeFile          : uploaded .xlsx / .xls / .csv  → rows (columns are found by their header names, any order).
//   parseNoticePasted       : cells copied from Excel      → rows (by the chosen column order, header row optional).
// Cells are cleaned per type (dates from Excel serials or dd-mm-yyyy / dd/mm/yyyy, Bangla digits, gender words). A cell that
// cannot be understood is NOT applied and is reported as an issue instead.
// Path: src/components/modules/LeftEmployeeNotice/Leftnoticeexcel.ts
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { NoticeRow } from './leftNoticeModel';
import { STAGE_STYLE, formatDMY, summarize, normalizeGender } from './leftNoticeModel';

/** The filtered Statement: one row per absent worker with the three letter dates, stage and both addresses. */
export function exportNoticeList(rows: NoticeRow[], filename: string): void {
  const head = ['SL', 'Card No', 'Name', 'Designation', 'Section', 'Gender', 'Father', 'Husband', 'Joining Date', 'Absent From', 'Days Absent',
    'Notice-1 Date', 'Notice-2 Date', 'Notice-3 (Final) Date', 'Stage', 'Present Address', 'Permanent Address'];
  const body = rows.map((r, i) => [
    i + 1, r.cardNo, r.name, r.designation, r.section, r.gender, r.fatherName, r.husbandName, formatDMY(r.joining), formatDMY(r.absence), r.daysAbsent ?? '',
    formatDMY(r.n1.date), formatDMY(r.n2.date), formatDMY(r.n3.date), STAGE_STYLE[r.stage].label, r.presentAddress, r.permanentAddress,
  ]);
  const s = summarize(rows);
  const ws = XLSX.utils.aoa_to_sheet([head, ...body, [], ['', '', `Total ${s.count}`, '', '', '', '', '', '', '', '', `Notice-1: ${s.n1}`, `Notice-2: ${s.n2}`, `Final: ${s.final}`, `Waiting: ${s.waiting}`]]);
  ws['!cols'] = [5, 10, 24, 18, 16, 9, 20, 20, 12, 12, 9, 13, 13, 16, 20, 40, 40].map(wch => ({ wch }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: head.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Left Notice');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── Bulk import ─────────────────────────────────────────────────────────────

export type NoticeKind = 'text' | 'date' | 'gender';
export interface NoticeFieldDef { key: string; bn: string; en: string; kind: NoticeKind; section: string; required?: boolean }

const ADDR: [string, string, string][] = [['HouseNo', 'বাড়ি / রাস্তা', 'House / Road'], ['Village', 'গ্রাম', 'Village'], ['PostOffice', 'ডাকঘর', 'Post Office'], ['Thana', 'থানা', 'Thana'], ['District', 'জেলা', 'District']];
export const NOTICE_FIELDS: NoticeFieldDef[] = [
  { key: 'name',             bn: 'কর্মীর নাম',            en: 'Name',                kind: 'text',   section: 'কর্মীর তথ্য', required: true },
  { key: 'cardNo',           bn: 'কার্ড নং',              en: 'Card No',             kind: 'text',   section: 'কর্মীর তথ্য', required: true },
  { key: 'designation',      bn: 'পদবী',                  en: 'Designation',         kind: 'text',   section: 'কর্মীর তথ্য', required: true },
  { key: 'section',          bn: 'সেকশন',                 en: 'Section',             kind: 'text',   section: 'কর্মীর তথ্য' },
  { key: 'gender',           bn: 'লিঙ্গ',                  en: 'Gender',              kind: 'gender', section: 'কর্মীর তথ্য' },
  { key: 'fatherName',       bn: 'পিতার নাম',             en: "Father's Name",       kind: 'text',   section: 'কর্মীর তথ্য' },
  { key: 'motherName',       bn: 'মাতার নাম',             en: "Mother's Name",       kind: 'text',   section: 'কর্মীর তথ্য' },
  { key: 'husbandName',      bn: 'স্বামীর নাম',            en: "Husband's Name",      kind: 'text',   section: 'কর্মীর তথ্য' },
  { key: 'joiningDate',      bn: 'যোগদানের তারিখ',        en: 'Joining Date',        kind: 'date',   section: 'অনুপস্থিতি' },
  { key: 'absenceStartDate', bn: 'অনুপস্থিতির শুরুর তারিখ', en: 'Absent From',         kind: 'date',   section: 'অনুপস্থিতি', required: true },
  ...ADDR.map(([k, bn, en]): NoticeFieldDef => ({ key: `present${k}`, bn: `বর্তমান — ${bn}`, en: `Present ${en}`, kind: 'text', section: 'বর্তমান ঠিকানা' })),
  ...ADDR.map(([k, bn, en]): NoticeFieldDef => ({ key: `permanent${k}`, bn: `স্থায়ী — ${bn}`, en: `Permanent ${en}`, kind: 'text', section: 'স্থায়ী ঠিকানা' })),
];
export const NOTICE_REQUIRED = NOTICE_FIELDS.filter(f => f.required).map(f => f.key);

export interface NoticeIssue { key: string; text: string }
export interface ImportedNotice { row: number; values: Record<string, string>; issues: NoticeIssue[] }

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const asciiDigits = (s: string) => s.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[\s_\-().,:;'’"*/—–]+/g, '');
const pad2 = (x: number) => String(x).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => {
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad2(m)}-${pad2(d)}` : '';
};
function toIsoDate(raw: unknown): string {
  if (raw instanceof Date) return ymd(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  if (typeof raw === 'number') { const p = XLSX.SSF.parse_date_code(raw); return p ? ymd(p.y, p.m, p.d) : ''; }
  const t = asciiDigits(String(raw ?? '').trim());
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(t);
  return m ? ymd(Number(m[3]), Number(m[2]), Number(m[1])) : '';
}
function cellText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'number') return Number.isFinite(raw) ? (Math.abs(raw) >= 1e15 ? raw.toLocaleString('fullwide', { useGrouping: false }) : String(raw)) : '';
  if (raw instanceof Date) return toIsoDate(raw);
  return String(raw).trim();
}
function cleanCell(d: NoticeFieldDef, raw: unknown): { value: string; warn?: string } {
  const t = cellText(raw);
  if (t === '') return { value: '' };
  if (d.kind === 'date') { const iso = toIsoDate(raw); return iso ? { value: iso } : { value: '', warn: 'তারিখ বোঝা যায়নি (dd-mm-yyyy ব্যবহার করুন)' }; }
  if (d.kind === 'gender') { const g = normalizeGender(t); return ['male', 'female', 'third'].includes(g) ? { value: g } : { value: '', warn: `লিঙ্গ বোঝা যায়নি: ${t}` }; }
  return { value: t };
}

const ALIASES: Record<string, string> = {
  employeename: 'name', নাম: 'name', card: 'cardNo', cardnumber: 'cardNo', কার্ড: 'cardNo', id: 'cardNo', পদ: 'designation', department: 'section', বিভাগ: 'section',
  father: 'fatherName', mother: 'motherName', husband: 'husbandName', joining: 'joiningDate', doj: 'joiningDate', dateofjoining: 'joiningDate',
  absent: 'absenceStartDate', absentfrom: 'absenceStartDate', absencedate: 'absenceStartDate', অনুপস্থিত: 'absenceStartDate',
};
const fieldIndex = (() => {
  const m = new Map<string, NoticeFieldDef>();
  for (const d of NOTICE_FIELDS) for (const k of [d.key, d.bn, d.en]) m.set(norm(k), d);
  for (const [a, key] of Object.entries(ALIASES)) { const d = NOTICE_FIELDS.find(x => x.key === key); if (d && !m.has(norm(a))) m.set(norm(a), d); }
  return m;
})();
const defOf = (key: string) => NOTICE_FIELDS.find(d => d.key === key);
const blankRow = (r: unknown[]) => r.every(c => cellText(c) === '');

function rowToNotice(defs: (NoticeFieldDef | undefined)[], cells: unknown[], row: number): ImportedNotice | null {
  const values: Record<string, string> = {}, issues: NoticeIssue[] = [];
  defs.forEach((d, i) => {
    if (!d) return;
    const n = cleanCell(d, cells[i]);
    if (n.warn) issues.push({ key: d.key, text: n.warn });
    if (n.value !== '' && values[d.key] === undefined) values[d.key] = n.value;
  });
  return Object.keys(values).length || issues.length ? { row, values, issues } : null;
}

/** Blank template with only the chosen columns, in the chosen order, plus a short instruction sheet. */
export function downloadNoticeTemplate(keys: string[], filename = 'Left_Notice_Import'): void {
  const defs = keys.map(defOf).filter((d): d is NoticeFieldDef => !!d);
  const ws = XLSX.utils.aoa_to_sheet([defs.map(d => d.bn)]);
  ws['!cols'] = defs.map(d => ({ wch: Math.max(16, d.bn.length + 4) }));
  const help = XLSX.utils.aoa_to_sheet([
    ['কলাম', 'ইংরেজি নাম', 'ধরন', 'আবশ্যক'],
    ...defs.map(d => [d.bn, d.en, d.kind === 'date' ? 'তারিখ: dd-mm-yyyy' : d.kind === 'gender' ? 'পুরুষ / মহিলা / তৃতীয় লিঙ্গ' : 'লেখা', d.required ? 'হ্যাঁ' : '']),
    [], ['নোট: পত্র নং-১/২/৩ এর তারিখ অনুপস্থিতির শুরুর তারিখ থেকে সিস্টেম নিজে হিসাব করবে।'],
  ]);
  help['!cols'] = [{ wch: 30 }, { wch: 26 }, { wch: 30 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Table');
  XLSX.utils.book_append_sheet(wb, help, 'নির্দেশনা');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Uploaded .xlsx / .xls / .csv: the first sheet with recognisable column names; columns may be in any order. */
export async function readNoticeFile(file: File): Promise<{ rows: ImportedNotice[]; sheet: string; unknown: string[] }> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  for (const name of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: '' });
    const hi = grid.slice(0, 10).findIndex(r => r.filter(c => fieldIndex.has(norm(c))).length >= 2);
    if (hi < 0) continue;
    const defs = grid[hi].map(c => fieldIndex.get(norm(c)));
    const unknown = grid[hi].filter((c, i) => cellText(c) !== '' && !defs[i]).map(cellText);
    const rows: ImportedNotice[] = [];
    grid.slice(hi + 1).forEach((r, ri) => { if (!blankRow(r)) { const n = rowToNotice(defs, r, hi + ri + 2); if (n) rows.push(n); } });
    if (rows.length) return { rows, sheet: name, unknown };
  }
  throw new Error('কোনো চেনা কলাম পাওয়া যায়নি — টেমপ্লেট ডাউনলোড করে সেটিতে তথ্য দিন (প্রথম সারিতে কলামের নাম থাকতে হবে)।');
}

/** Pasted cells (tab separated, as copied from Excel; comma separated is accepted too). Header row is optional. */
export function parseNoticePasted(text: string, keys: string[]): { rows: ImportedNotice[]; headerSkipped: boolean } {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '');
  const delim = lines.some(l => l.includes('\t')) ? '\t' : ',';
  let grid = lines.map(l => l.split(delim));
  let defs = keys.map(defOf);
  const first = grid[0] ?? [];
  const byHead = first.map(c => fieldIndex.get(norm(c)));
  const headerSkipped = byHead.filter(Boolean).length >= 2;
  if (headerSkipped) { defs = byHead; grid = grid.slice(1); }          // a pasted header row decides the order
  const rows: ImportedNotice[] = [];
  grid.forEach((cells, ri) => { const n = rowToNotice(defs, cells.map(c => c.trim()), ri + 1 + (headerSkipped ? 1 : 0)); if (n) rows.push(n); });
  return { rows, headerSkipped };
}