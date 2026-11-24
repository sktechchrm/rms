// ─────────────────────────────────────────────────────────────────────────────
// settlementImport.ts — column list + importer (parse) for the multi-employee form.
// The template / group download (styled, with the Settlement Type dropdown) lives in settlementImportExcel.ts.
// Path: src/components/modules/finalSettlement/settlementImport.ts
//
// One Excel row = one employee. Group columns (Settlement Type, Settlement Date) are needed on the first row of
// a group only — a blank cell copies the row above. Dates are dd-mm-yyyy (real Excel dates and yyyy-mm-dd also work).
// Importing never saves: rows land in the multi-employee form for review; the normal Save does the rest.
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import { blankSettlement, TERMINATION_OPTIONS } from './settlementModel';
import { newGroup, uid } from './settlementBatch';
import type { BatchGroup, BatchRow } from './settlementBatch';

export const IMPORT_SHEET = 'Settlement Import';

interface Col { key: string; head: string; bn: string; width: number }
export const IMPORT_COLS: Col[] = [
  { key: 'type',                head: 'Settlement Type',         bn: 'চাকরি নিষ্পত্তির ধরন',        width: 30 },
  { key: 'settlementDate',      head: 'Settlement Date',         bn: 'নিষ্পত্তির তারিখ',             width: 15 },
  { key: 'cardNo',              head: 'Card No',                 bn: 'কার্ড নং',                    width: 10 },
  { key: 'name',                head: 'Name',                    bn: 'নাম',                         width: 24 },
  { key: 'designation',         head: 'Designation',             bn: 'পদবি',                        width: 18 },
  { key: 'section',             head: 'Section',                 bn: 'বিভাগ',                       width: 16 },
  { key: 'joining',             head: 'Joining Date',            bn: 'নিয়োগের তারিখ',               width: 14 },
  { key: 'lastAttendance',      head: 'Last Attendance',         bn: 'সর্বশেষ উপস্থিতির তারিখ',      width: 15 },
  { key: 'absentDays',          head: 'Absent Days',             bn: 'অনুপস্থিতির দিন',              width: 12 },
  { key: 'wage',                head: 'Total Monthly Wage',      bn: 'মোট মজুরি',                   width: 16 },
  { key: 'food',                head: 'Food Allowance',          bn: 'খাদ্য ভাতা',                   width: 13 },
  { key: 'medical',             head: 'Medical Allowance',       bn: 'চিকিৎসা ভাতা',                 width: 15 },
  { key: 'transport',           head: 'Transport Allowance',     bn: 'যাতায়াত ভাতা',                width: 16 },
  { key: 'payableDay',          head: 'Payable Days',            bn: 'প্রাপ্য দিন',                  width: 12 },
  { key: 'otHours',             head: 'OT Hours',                bn: 'ওভারটাইম ঘন্টা',               width: 10 },
  { key: 'elDays',              head: 'EL Days',                 bn: 'অর্জিত ছুটি',                  width: 10 },
  { key: 'noticePayDay',        head: 'Notice Pay Days',         bn: 'নোটিশ পে (দিন)',               width: 14 },
  { key: 'noticeDeductionDay',  head: 'Notice Deduction Days',   bn: 'নোটিশ কর্তন (দিন)',            width: 18 },
  { key: 'layOffDays',          head: 'Lay-off Days',            bn: 'লে-অফ (দিন)',                  width: 12 },
  { key: 'method',              head: 'Payment Method',          bn: 'পেমেন্ট পদ্ধতি',               width: 16 },
  { key: 'others',              head: 'Others Amount',           bn: 'অন্যান্য প্রাপ্য',              width: 14 },
  { key: 'othersNote',          head: 'Others Detail',           bn: 'অন্যান্য প্রাপ্যের বিবরণ',      width: 24 },
  { key: 'advance',             head: 'Advance Deduction',       bn: 'অগ্রিম কর্তন',                 width: 16 },
  { key: 'advanceNote',         head: 'Advance Detail',          bn: 'অগ্রিম কর্তনের বিবরণ',          width: 24 },
  { key: 'otherDeduction',      head: 'Other Deduction',         bn: 'অন্যান্য কর্তন',               width: 15 },
  { key: 'otherDeductionNote',  head: 'Other Deduction Detail',  bn: 'অন্যান্য কর্তনের বিবরণ',        width: 24 },
];

// ─── Parsing helpers ─────────────────────────────────────────────────────────

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toAscii = (s: string): string => s.replace(/[০-৯]/g, ch => String(BN_DIGITS.indexOf(ch)));
const normKey = (s: unknown): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
const blank = (v: unknown): boolean => v === '' || v === null || v === undefined || String(v).trim() === '';
const text = (v: unknown): string => (blank(v) ? '' : String(v).trim());

const pad = (x: number) => String(x).padStart(2, '0');
function toIso(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
}
/** '' = empty cell · null = not a valid date · otherwise YYYY-MM-DD. */
function parseDate(v: unknown): string | null {
  if (blank(v)) return '';
  if (v instanceof Date) return toIso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === 'number') { const p = XLSX.SSF.parse_date_code(v); return p ? toIso(p.y, p.m, p.d) : null; }
  const s = toAscii(String(v)).trim();
  let m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m) return toIso(Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return toIso(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}
/** '' for empty · null for text that is not a number. */
function parseNum(v: unknown): string | null {
  if (blank(v)) return '';
  const x = parseFloat(toAscii(String(v)).replace(/,/g, '').trim());
  return Number.isFinite(x) ? String(x) : null;
}
const typeLookup = new Map<string, string>();
for (const o of TERMINATION_OPTIONS) { typeLookup.set(normKey(o.label), o.value); typeLookup.set(normKey(o.value), o.value); }

// ─── Import ──────────────────────────────────────────────────────────────────

/** One line of the preview table in the import dialog. */
export interface PreviewRow { row: number; name: string; cardNo: string; type: string; lastAttendance: string; status: 'ready' | 'review'; note: string }
export interface ImportResult { groups: BatchGroup[]; employees: number; warnings: string[]; preview: PreviewRow[] }

/** Reads the workbook. Throws an Error with a user-facing (Bangla) message when the file cannot be used. */
export function parseSettlementWorkbook(buf: ArrayBuffer, defaultDate: string): ImportResult {
  let wb: XLSX.WorkBook;
  try { wb = XLSX.read(buf, { type: 'array' }); } catch { throw new Error('ফাইলটি পড়া যায়নি — একটি বৈধ .xlsx ফাইল দিন।'); }
  const ws = wb.Sheets[IMPORT_SHEET] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('ফাইলে কোনো শিট পাওয়া যায়নি।');

  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '', blankrows: false });
  if (aoa.length < 2) throw new Error('ফাইলে কোনো কর্মীর সারি নেই — টেমপ্লেটের দ্বিতীয় সারি থেকে তথ্য দিন।');

  // header → column index (English or Bangla heading)
  const head = aoa[0].map(normKey);
  const at: Record<string, number> = {};
  for (const c of IMPORT_COLS) {
    const i = head.findIndex(h => h === normKey(c.head) || h === normKey(c.bn));
    if (i >= 0) at[c.key] = i;
  }
  const missing = ['name', 'joining', 'lastAttendance', 'wage'].filter(k => at[k] === undefined);
  if (missing.length) {
    const names = missing.map(k => IMPORT_COLS.find(c => c.key === k)!.head).join(', ');
    throw new Error(`এই কলাম পাওয়া যায়নি: ${names} — টেমপ্লেট ডাউনলোড করে ব্যবহার করুন।`);
  }

  const warnings: string[] = [];
  const preview: PreviewRow[] = [];
  const groups = new Map<string, BatchGroup>();
  let lastType = '', lastTypeRaw = '', lastDate = defaultDate, employees = 0;
  const defaults = blankSettlement();

  aoa.slice(1).forEach((row, idx) => {
    const xr = idx + 2;                                                        // Excel row number
    const cell = (k: string): unknown => (at[k] === undefined ? '' : row[at[k]]);
    if (row.every(blank)) return;
    if (/^\s*\((উদাহরণ|example)\)/i.test(text(cell('name')))) return;       // the template's example rows are never imported
    const rowWarn: string[] = [];
    const w = (m: string) => { rowWarn.push(m); warnings.push(`সারি ${xr}: ${m}`); };

    // group columns: blank = copy the row above
    if (!blank(cell('type'))) {
      lastTypeRaw = text(cell('type'));
      lastType = typeLookup.get(normKey(lastTypeRaw)) ?? '';
      if (!lastType) w(`"${lastTypeRaw}" চেনা যায়নি — নিষ্পত্তির ধরন ফর্মে নির্বাচন করুন।`);
    } else if (!lastTypeRaw && !lastType) {
      w(`নিষ্পত্তির ধরন নেই — ফর্মে নির্বাচন করুন।`);
      lastTypeRaw = '(none)';
    }
    if (!blank(cell('settlementDate'))) {
      const d = parseDate(cell('settlementDate'));
      if (d === null) w(`নিষ্পত্তির তারিখ "${text(cell('settlementDate'))}" ঠিক নয় — আগের তারিখ ধরা হয়েছে।`);
      else lastDate = d;
    }

    const f: EmployeeFormData = { ...blankSettlement(), terminationType: lastType, settlementDate: lastDate };
    const str = (k: string) => text(cell(k));
    f.cardNo = str('cardNo'); f.employeeName = str('name'); f.designation = str('designation'); f.section = str('section');
    f.otherBenefits = str('othersNote'); f.deductionForAdvance = str('advanceNote'); f.deductionParticularsB = str('otherDeductionNote');

    for (const k of ['joining', 'lastAttendance']) {
      const d = parseDate(cell(k));
      if (d === null) w(`${IMPORT_COLS.find(c => c.key === k)!.head} "${text(cell(k))}" তারিখ হিসেবে ঠিক নয় (dd-mm-yyyy দিন)।`);
      else if (k === 'joining') f.joiningDate = d; else f.lastAttendance = d;
    }
    const num = (k: string, set: (v: string) => void) => {
      const v = parseNum(cell(k));
      if (v === null) w(`${IMPORT_COLS.find(c => c.key === k)!.head} "${text(cell(k))}" সংখ্যা নয়।`);
      else if (v !== '') set(v);
    };
    num('absentDays', v => { f.absentDays = v; });
    num('wage', v => { f.totalMonthlyWage = v; });
    num('food', v => { f.foodAllowance = v; });
    num('medical', v => { f.medicalAllowance = v; });
    num('transport', v => { f.transportAllowance = v; });
    num('payableDay', v => { f.payableDay = v; });
    num('otHours', v => { f.payableHours = v; });
    num('elDays', v => { f.elQty = v; });
    num('noticePayDay', v => { f.noticePayDay = v; });
    num('noticeDeductionDay', v => { f.noticeDeductionDay = v; });
    num('layOffDays', v => { f.layOffDays = v; });
    num('others', v => { f.others = v; });
    num('advance', v => { f.advanceDeduction = v; });
    num('otherDeduction', v => { f.otherDeduction = v; });
    f.paymentMethod = /grat|গ্র্যাচুইটি|গ্রাচুইটি/i.test(str('method')) ? 'gratuity' : defaults.paymentMethod;

    const missing: string[] = [];
    if (!f.employeeName) missing.push('নাম নেই');
    if (!f.terminationType) missing.push('ধরন নেই');
    if (!f.joiningDate) missing.push('নিয়োগের তারিখ নেই');
    if (!f.lastAttendance) missing.push('সর্বশেষ উপস্থিতি নেই');
    if (!(parseFloat(f.totalMonthlyWage) > 0)) missing.push('মোট মজুরি নেই');
    const notes = [...rowWarn, ...missing];
    preview.push({
      row: xr, name: f.employeeName, cardNo: f.cardNo, lastAttendance: f.lastAttendance,
      type: TERMINATION_OPTIONS.find(o => o.value === f.terminationType)?.label ?? lastTypeRaw,
      status: notes.length ? 'review' : 'ready', note: notes.join('; '),
    });

    const key = `${f.terminationType}|${f.settlementDate}`;
    let g = groups.get(key);
    if (!g) { g = { key: uid(), terminationType: f.terminationType, settlementDate: f.settlementDate, rows: [] }; groups.set(key, g); }
    g.rows.push({ key: uid(), f } as BatchRow);
    employees++;
  });

  if (!employees) throw new Error('ফাইলে কোনো কর্মীর সারি নেই — টেমপ্লেটের দ্বিতীয় সারি থেকে তথ্য দিন।');
  const list = [...groups.values()];
  return { groups: list.length ? list : [newGroup(defaultDate)], employees, warnings, preview };
}