// ─────────────────────────────────────────────────────────────────────────────
// EmployeeExcelImport.tsx — import employees from Excel (paste or file) with a column picker and duplicate protection.
// Path: src/components/modules/employeePersonalFile/EmployeeExcelImport.tsx
//
// Flow on one page:
//   1. কলাম নির্বাচন — tick the fields that exist in your sheet (grouped like the form), order them, copy the header row
//                      or download an .xlsx template. Card No, Name and Joining Date are always included.
//   2. ডেটা দিন       — paste rows copied from Excel, or choose an .xlsx / .xls / .csv file.
//   3. যাচাই ও ইমপোর্ট — every row is checked and shown in a preview; only clean rows are saved.
//
// NO DOUBLE ENTRY: a row is blocked when its Card No (or ID No, when that column is present)
//   • already belongs to a saved employee, or
//   • appears earlier in the same file.
// The check runs again right before saving, against the latest saved list.
//
// Not covered on purpose: education and experience tables (form sections 6 and 7) — they are lists of rows per person.
// This file is self-contained: the field list lives inside it (no separate catalog file).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import * as XLSX from 'xlsx';

// ── Field list (every single-value field of the personal file, grouped like the form) ─────────────────
// Education and experience (form sections 6 and 7) are lists of rows, so they are not part of this import.
// Fields the form fills automatically (allowances, attendance bonus, basic wage, house rent, nominee full address)
// are left out; the nominee address line is composed during import.
// When you add or rename a field in EmployeeForm.tsx, update this list too.

type CatalogSection = 'personal' | 'family' | 'contact' | 'employment' | 'salary' | 'nominee' | 'reference';
type FieldKind = 'text' | 'date' | 'number' | 'select';

interface CatalogOption { value: string; label: string; aliases?: string[] }
interface CatalogField {
  key: string;
  label: string;
  section: CatalogSection;
  kind: FieldKind;
  required?: boolean;                // the "*" fields of the form (needed by the print documents)
  options?: CatalogOption[];
  aliases?: string[];                // other column titles that should map to this field (matched case-insensitively)
}

const CATALOG_SECTIONS: { id: CatalogSection; title: string }[] = [
  { id: 'personal',   title: 'ব্যক্তিগত তথ্য' },
  { id: 'family',     title: 'পরিবার ও সন্তান' },
  { id: 'contact',    title: 'যোগাযোগ ও ঠিকানা' },
  { id: 'employment', title: 'চাকরির তথ্য' },
  { id: 'salary',     title: 'বেতন ও ব্যাংক' },
  { id: 'nominee',    title: 'নমিনি' },
  { id: 'reference',  title: 'সুপারিশকারী / রেফারেন্স' },
];

/** These three must always be present: the card no identifies the person, the name and joining date make the record usable. */
const LOCKED_KEYS = ['cardNo', 'fullName', 'joiningDate'];

const GENDER: CatalogOption[] = [
  { value: 'Male', label: 'পুরুষ', aliases: ['male', 'm', 'man'] },
  { value: 'Female', label: 'নারী', aliases: ['female', 'f', 'woman', 'মহিলা'] },
  { value: 'Other', label: 'তৃতীয় লিঙ্গ', aliases: ['other', 'others'] },
];
const MARITAL: CatalogOption[] = [
  { value: 'Single', label: 'অবিবাহিত', aliases: ['single', 'unmarried'] },
  { value: 'Married', label: 'বিবাহিত', aliases: ['married'] },
  { value: 'Divorced', label: 'তালাকপ্রাপ্ত', aliases: ['divorced'] },
];
const BLOOD: CatalogOption[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => {
  const letters = g.replace(/[+-]/g, '').toLowerCase();
  const words = g.endsWith('+') ? ['positive', '+ve', '(+)'] : ['negative', '-ve', '(-)'];
  return { value: g, label: g, aliases: words.map(w => letters + w) };
});
const OT_CAT: CatalogOption[] = [
  { value: 'Elegible', label: 'Elegible', aliases: ['eligible'] },
  { value: 'নন ওভারটাইম', label: 'নন ওভারটাইম', aliases: ['nonovertime', 'non overtime', 'non-ot', 'nonot'] },
];
const SCHEDULE: CatalogOption[] = [
  { value: 'তফসিল-ক', label: 'তফসিল-ক', aliases: ['ক', 'a', 'schedulea'] },
  { value: 'তফসিল-খ', label: 'তফসিল-খ', aliases: ['খ', 'b', 'scheduleb'] },
  { value: 'তফসিল-বহির্ভূত', label: 'তফসিল-বহির্ভূত', aliases: ['বহির্ভূত', 'other', 'excluded'] },
];

const f = (section: CatalogSection, key: string, label: string, kind: FieldKind = 'text', extra: Partial<CatalogField> = {}): CatalogField =>
  ({ key, label, section, kind, ...extra });

const FIELD_CATALOG: CatalogField[] = [
  // personal
  f('personal', 'fullName', 'পূর্ণ নাম (ইংরেজি)', 'text', { required: true, aliases: ['name', 'full name', 'employee name', 'নাম'] }),
  f('personal', 'fullNameBengali', 'পূর্ণ নাম (বাংলা)', 'text', { required: true, aliases: ['bangla name', 'নাম (বাংলা)'] }),
  f('personal', 'fatherName', 'পিতার নাম', 'text', { required: true, aliases: ['father', "father's name", 'father name'] }),
  f('personal', 'motherName', 'মাতার নাম', 'text', { required: true, aliases: ['mother', "mother's name", 'mother name'] }),
  f('personal', 'dateOfBirth', 'জন্ম তারিখ', 'date', { required: true, aliases: ['dob', 'date of birth', 'birth date'] }),
  f('personal', 'gender', 'লিঙ্গ', 'select', { required: true, options: GENDER, aliases: ['sex'] }),
  f('personal', 'bloodGroup', 'রক্তের গ্রুপ', 'select', { required: true, options: BLOOD, aliases: ['blood group', 'blood'] }),
  f('personal', 'maritalStatus', 'বৈবাহিক অবস্থা', 'select', { options: MARITAL, aliases: ['marital status'] }),
  f('personal', 'nationality', 'জাতীয়তা'),
  f('personal', 'religion', 'ধর্ম'),
  f('personal', 'height', 'উচ্চতা', 'text', { required: true }),
  f('personal', 'weight', 'ওজন', 'text', { required: true }),
  f('personal', 'nid', 'জাতীয় পরিচয়পত্র নং', 'text', { aliases: ['nid', 'nid no', 'national id'] }),
  f('personal', 'birthRegistrationNo', 'জন্ম নিবন্ধন নং', 'text', { aliases: ['birth registration'] }),
  f('personal', 'passportNumber', 'পাসপোর্ট নং', 'text', { aliases: ['passport'] }),
  f('personal', 'drivingLicense', 'ড্রাইভিং লাইসেন্স নং', 'text', { aliases: ['driving license'] }),
  f('personal', 'identificationMark', 'সনাক্তকরণ চিহ্ন', 'text', { required: true }),
  // family
  f('family', 'spouseName', 'স্বামী/স্ত্রীর নাম', 'text', { required: true, aliases: ['spouse', 'spouse name'] }),
  f('family', 'spouseDob', 'স্বামী/স্ত্রীর জন্ম তারিখ', 'date'),
  f('family', 'spouseBloodGroup', 'স্বামী/স্ত্রীর রক্তের গ্রুপ'),
  f('family', 'spouseProfession', 'স্বামী/স্ত্রীর পেশা'),
  f('family', 'spousePhone', 'স্বামী/স্ত্রীর মোবাইল'),
  f('family', 'spouseEducation', 'স্বামী/স্ত্রীর শিক্ষাগত যোগ্যতা'),
  f('family', 'numberOfSons', 'পুত্র সন্তান', 'number'),
  f('family', 'numberOfDaughters', 'কন্যা সন্তান', 'number'),
  // contact
  f('contact', 'mobile', 'মোবাইল নম্বর', 'text', { aliases: ['mobile', 'phone', 'mobile no', 'cell'] }),
  f('contact', 'email', 'ইমেইল ঠিকানা', 'text', { aliases: ['email', 'e-mail'] }),
  f('contact', 'onnano', 'অন্যান্য যোগাযোগ'),
  f('contact', 'presentHouseNo', 'বর্তমান: বাড়ি/রাস্তা', 'text', { required: true }),
  f('contact', 'presentUnion', 'বর্তমান: ইউনিয়ন/পৌরসভা'),
  f('contact', 'presentVillage', 'বর্তমান: গ্রাম', 'text', { required: true }),
  f('contact', 'presentPostOffice', 'বর্তমান: ডাকঘর', 'text', { required: true }),
  f('contact', 'presentThana', 'বর্তমান: থানা', 'text', { required: true }),
  f('contact', 'presentDistrict', 'বর্তমান: জেলা', 'text', { required: true }),
  f('contact', 'presentDivision', 'বর্তমান: বিভাগ'),
  f('contact', 'permanentHouseNo', 'স্থায়ী: বাড়ি/রাস্তা', 'text', { required: true }),
  f('contact', 'permanentUnion', 'স্থায়ী: ইউনিয়ন/পৌরসভা'),
  f('contact', 'permanentVillage', 'স্থায়ী: গ্রাম', 'text', { required: true }),
  f('contact', 'permanentPostOffice', 'স্থায়ী: ডাকঘর', 'text', { required: true }),
  f('contact', 'permanentThana', 'স্থায়ী: থানা', 'text', { required: true }),
  f('contact', 'permanentDistrict', 'স্থায়ী: জেলা', 'text', { required: true }),
  f('contact', 'permanentDivision', 'স্থায়ী: বিভাগ'),
  f('contact', 'emergencyName', 'জরুরি যোগাযোগ: নাম'),
  f('contact', 'emergencyRelation', 'জরুরি যোগাযোগ: সম্পর্ক'),
  f('contact', 'emergencyMobile', 'জরুরি যোগাযোগ: মোবাইল'),
  f('contact', 'emergencyProfession', 'জরুরি যোগাযোগ: পেশা'),
  // employment
  f('employment', 'idNo', 'আইডি নং', 'text', { required: true, aliases: ['id', 'id no', 'employee id'] }),
  f('employment', 'cardNo', 'কার্ড নং', 'text', { required: true, aliases: ['card', 'card no', 'card number'] }),
  f('employment', 'proximityNumber', 'প্রক্সিমিটি নম্বর', 'text', { required: true, aliases: ['proximity', 'proximity no'] }),
  f('employment', 'grade', 'গ্রেড', 'text', { required: true, aliases: ['grade'] }),
  f('employment', 'otCategory', 'ওভারটাইম ক্যাটাগরি', 'select', { required: true, options: OT_CAT, aliases: ['ot category'] }),
  f('employment', 'wagesSchedule', 'মজুরি তফসিল', 'select', { required: true, options: SCHEDULE, aliases: ['wages schedule', 'schedule'] }),
  f('employment', 'sectionLine', 'সেকশন/লাইন', 'text', { required: true, aliases: ['section', 'line', 'section/line'] }),
  f('employment', 'designation', 'পদবি', 'text', { required: true, aliases: ['designation'] }),
  f('employment', 'department', 'বিভাগ', 'text', { required: true, aliases: ['department', 'dept'] }),
  f('employment', 'joiningDate', 'যোগদানের তারিখ', 'date', { required: true, aliases: ['joining date', 'doj', 'date of joining'] }),
  f('employment', 'jobSource', 'নিয়োগ সূত্র', 'text', { aliases: ['job source'] }),
  // salary
  f('salary', 'grossSalary', 'মাসিক বেতন (মোট)', 'number', { required: true, aliases: ['gross', 'gross salary', 'salary'] }),
  f('salary', 'tinNumber', 'টিন নম্বর', 'text', { aliases: ['tin'] }),
  f('salary', 'bankName', 'ব্যাংকের নাম', 'text', { aliases: ['bank', 'bank name'] }),
  f('salary', 'bankAccountNo', 'ব্যাংক হিসাব নম্বর', 'text', { aliases: ['account no', 'bank account'] }),
  f('salary', 'bankBranch', 'শাখার নাম', 'text', { aliases: ['branch'] }),
  // nominee
  f('nominee', 'nomineeName', 'নমিনির নাম', 'text', { required: true, aliases: ['nominee', 'nominee name'] }),
  f('nominee', 'nomineeRelation', 'নমিনির সম্পর্ক', 'text', { required: true, aliases: ['nominee relation'] }),
  f('nominee', 'nomineePercentage', 'নমিনির অংশের শতাংশ', 'number', { required: true }),
  f('nominee', 'nomineeNid', 'নমিনির এনআইডি', 'text', { required: true }),
  f('nominee', 'nomineeDob', 'নমিনির জন্ম তারিখ', 'date', { required: true }),
  f('nominee', 'nomineeEducation', 'নমিনির শিক্ষা', 'text', { required: true }),
  f('nominee', 'nomineeProfession', 'নমিনির পেশা', 'text', { required: true }),
  f('nominee', 'nomineePhone', 'নমিনির মোবাইল', 'text', { required: true }),
  f('nominee', 'nomineeBloodGroup', 'নমিনির রক্তের গ্রুপ'),
  f('nominee', 'nomineeVillage', 'নমিনি: গ্রাম', 'text', { required: true }),
  f('nominee', 'nomineePostOffice', 'নমিনি: ডাকঘর', 'text', { required: true }),
  f('nominee', 'nomineeThana', 'নমিনি: থানা', 'text', { required: true }),
  f('nominee', 'nomineeDistrict', 'নমিনি: জেলা', 'text', { required: true }),
  // reference
  f('reference', 'supervisorName', 'সুপারিশকারীর নাম'),
  f('reference', 'supervisorOrg', 'সুপারিশকারীর প্রতিষ্ঠান'),
  f('reference', 'supervisorDesignation', 'সুপারিশকারীর পদবি'),
  f('reference', 'supervisorProfession', 'সুপারিশকারীর পেশা'),
  f('reference', 'supervisorPhone', 'সুপারিশকারীর মোবাইল'),
  f('reference', 'supervisorRelation', 'সুপারিশকারীর সম্পর্ক'),
  f('reference', 'supervisorAddress', 'সুপারিশকারীর ঠিকানা'),
];

const FIELD_BY_KEY: Record<string, CatalogField> = Object.fromEntries(FIELD_CATALOG.map(x => [x.key, x]));

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ExistingEmployee { cardNo: string; idNo: string; name: string }
interface Props {
  existing: ExistingEmployee[];                                  // saved employees (for the duplicate check)
  blankRecord: () => Record<string, string>;                     // a new employee record with the module's defaults
  onImport: (records: Record<string, string>[], onProgress: (done: number) => void) => Promise<{ saved: number; failed: number }>;
  onDone: () => void;                                            // e.g. go to the statement
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toEnDigits = (v: string) => v.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
/** Loose comparison key: lower-case, no spaces / dashes / underscores. */
const looseKey = (v: string) => v.toLowerCase().replace(/[\s\-_]/g, '');
/** Header matching key: also ignores *, :, brackets, dots and slashes. */
const headKey = (v: string) => v.toLowerCase().replace(/[\s*:()._\-/]/g, '');
/** Duplicate key for card / id numbers. */
const idKey = (v: string) => v.toLowerCase().replace(/\s+/g, '');

function toIsoDate(raw: string): string {
  const t = toEnDigits(raw.trim());
  const two = (n: string) => n.padStart(2, '0');
  let m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${two(m[2])}-${two(m[1])}`;
  m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${two(m[2])}-${two(m[3])}`;
  return '';
}

/** Tab-separated text as Excel puts it on the clipboard (handles "quoted" cells that contain tabs or line breaks). */
function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let quoted = false;
  const s = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quoted) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i += 1; } else quoted = false; } else cur += c;
    } else if (c === '"' && cur === '') quoted = true;
    else if (c === '\t') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  row.push(cur);
  rows.push(row);
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** One spreadsheet cell → text. Dates become yyyy-mm-dd. */
function cellToText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    const d = new Date(v.getTime() + 12 * 3600 * 1000);   // +12h so time-zone drift can never change the day
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return String(v);
}

// header text → field
const HEADER_LOOKUP: Map<string, CatalogField> = (() => {
  const m = new Map<string, CatalogField>();
  FIELD_CATALOG.forEach(fl => {
    [fl.label, fl.key, ...(fl.aliases ?? [])].forEach(t => { const k = headKey(t); if (k && !m.has(k)) m.set(k, fl); });
  });
  return m;
})();

interface Normalised { value: string; warn?: string }
function normaliseValue(fl: CatalogField, raw: string): Normalised {
  if (!raw) return { value: '' };
  if (fl.kind === 'date') {
    const iso = toIsoDate(raw);
    return iso ? { value: iso } : { value: '', warn: `${fl.label}: তারিখ পড়া যায়নি (“${raw}”)` };
  }
  if (fl.kind === 'number') {
    const cleaned = toEnDigits(raw).replace(/[,\s৳]/g, '');
    return /^-?\d+(\.\d+)?$/.test(cleaned) ? { value: cleaned } : { value: '', warn: `${fl.label}: সংখ্যা পড়া যায়নি (“${raw}”)` };
  }
  if (fl.kind === 'select' && fl.options) {
    const k = looseKey(raw);
    const hit = fl.options.find(o => looseKey(o.value) === k || looseKey(o.label) === k || (o.aliases ?? []).some(a => looseKey(a) === k));
    return hit ? { value: hit.value } : { value: '', warn: `${fl.label}: “${raw}” মিলেনি` };
  }
  return { value: raw };
}

type Level = 'error' | 'warn';
interface Issue { level: Level; text: string; key?: string; code?: 'dupExisting' | 'dupFile' }
interface ParsedRow { no: number; values: Record<string, string>; issues: Issue[]; status: 'ok' | 'warn' | 'error' }
interface Analysis { rows: ParsedRow[]; columns: CatalogField[]; notes: string[]; fatal: string | null }

interface ExistingIndex { card: Map<string, string>; id: Map<string, string> }
const indexExisting = (list: ExistingEmployee[]): ExistingIndex => {
  const card = new Map<string, string>(), id = new Map<string, string>();
  list.forEach(e => {
    if (e.cardNo.trim()) card.set(idKey(e.cardNo), e.name || e.cardNo);
    if (e.idNo.trim()) id.set(idKey(e.idNo), e.name || e.idNo);
  });
  return { card, id };
};

function analyse(matrix: string[][], selected: CatalogField[], existing: ExistingIndex): Analysis {
  const notes: string[] = [];
  if (matrix.length === 0) return { rows: [], columns: [], notes, fatal: 'কোনো ডেটা পাওয়া যায়নি।' };

  // ── which column is which ──
  const head = matrix[0];
  const mapped = head.map(c => HEADER_LOOKUP.get(headKey(c)) ?? null);
  const recognised = mapped.filter(Boolean).length;
  const hasHeader = recognised >= 2 || (head.length === 1 && recognised === 1);
  let cols: (CatalogField | null)[];
  let body: string[][];
  if (hasHeader) {
    const seen = new Set<string>();
    cols = mapped.map(fl => { if (!fl || seen.has(fl.key)) return null; seen.add(fl.key); return fl; });
    const ignored = head.filter((c, i) => !cols[i] && c.trim()).map(c => c.trim());
    notes.push('হেডার সারি পাওয়া গেছে — কলামের নাম দেখে ঘর মিলানো হয়েছে।');
    if (ignored.length) notes.push(`চেনা যায়নি, তাই বাদ: ${ignored.join(', ')}`);
    body = matrix.slice(1);
  } else {
    cols = selected;
    body = matrix;
    notes.push('হেডার সারি নেই — আপনার নির্বাচিত কলামের ক্রম অনুযায়ী পড়া হয়েছে।');
    const widest = Math.max(...matrix.map(r => r.length));
    if (widest > selected.length) notes.push(`${widest - selected.length} টি অতিরিক্ত কলাম বাদ দেওয়া হয়েছে (নির্বাচিত কলাম ${selected.length} টি)।`);
    if (widest < selected.length) notes.push(`পেস্ট করা ডেটায় ${widest} টি কলাম আছে, নির্বাচিত ${selected.length} টি — শেষের কলামগুলো ফাঁকা ধরা হয়েছে।`);
  }
  const used = cols.filter((c): c is CatalogField => c !== null);
  const missing = LOCKED_KEYS.filter(k => !used.some(u => u.key === k)).map(k => FIELD_BY_KEY[k].label);
  if (missing.length) return { rows: [], columns: used, notes, fatal: `বাধ্যতামূলক কলাম নেই: ${missing.join(', ')}` };

  // ── rows ──
  const firstRowNo = hasHeader ? 2 : 1;
  const rows: ParsedRow[] = [];
  body.forEach((cells, idx) => {
    if (cells.every(c => !c.trim())) return;
    const values: Record<string, string> = {};
    const issues: Issue[] = [];
    cols.forEach((fl, i) => {
      if (!fl) return;
      const res = normaliseValue(fl, (cells[i] ?? '').trim());
      values[fl.key] = res.value;
      if (res.warn) issues.push({ level: 'warn', key: fl.key, text: res.warn });
    });
    if (!values.cardNo) issues.push({ level: 'error', key: 'cardNo', text: 'কার্ড নং নেই' });
    if (!values.fullName) issues.push({ level: 'error', key: 'fullName', text: 'নাম নেই' });
    if (!values.joiningDate) issues.push({ level: 'error', key: 'joiningDate', text: 'যোগদানের তারিখ নেই বা পড়া যায়নি' });
    rows.push({ no: idx + firstRowNo, values, issues, status: 'ok' });
  });

  // ── duplicates: against saved employees, then inside the file (first clean row keeps the number) ──
  const seenCard = new Map<string, number>(), seenId = new Map<string, number>();
  rows.forEach(r => {
    const card = r.values.cardNo ?? '', id = r.values.idNo ?? '';
    if (card && existing.card.has(idKey(card))) r.issues.push({ level: 'error', key: 'cardNo', code: 'dupExisting', text: `কার্ড নং ${card} আগে থেকেই আছে (${existing.card.get(idKey(card))})` });
    if (id && existing.id.has(idKey(id))) r.issues.push({ level: 'error', key: 'idNo', code: 'dupExisting', text: `আইডি নং ${id} আগে থেকেই আছে (${existing.id.get(idKey(id))})` });
  });
  rows.forEach(r => {
    if (r.issues.some(i => i.level === 'error')) return;
    const card = r.values.cardNo ?? '', id = r.values.idNo ?? '';
    const cardFirst = seenCard.get(idKey(card));
    const idFirst = id ? seenId.get(idKey(id)) : undefined;
    if (cardFirst !== undefined) r.issues.push({ level: 'error', key: 'cardNo', code: 'dupFile', text: `কার্ড নং ${card} ফাইলের ${cardFirst} নং সারির সাথে ডুপ্লিকেট` });
    if (idFirst !== undefined) r.issues.push({ level: 'error', key: 'idNo', code: 'dupFile', text: `আইডি নং ${id} ফাইলের ${idFirst} নং সারির সাথে ডুপ্লিকেট` });
    if (cardFirst === undefined && idFirst === undefined) {
      seenCard.set(idKey(card), r.no);
      if (id) seenId.set(idKey(id), r.no);
    }
  });
  rows.forEach(r => { r.status = r.issues.some(i => i.level === 'error') ? 'error' : r.issues.length ? 'warn' : 'ok'; });

  return { rows, columns: used, notes, fatal: rows.length ? null : 'ডেটা সারি পাওয়া যায়নি।' };
}

/** The saved record for one parsed row. */
function toRecord(base: Record<string, string>, values: Record<string, string>): Record<string, string> {
  const rec = { ...base, ...values };
  const parts = [values.nomineeVillage, values.nomineePostOffice, values.nomineeThana, values.nomineeDistrict].filter(v => v && v.trim());
  if (parts.length) rec.nomineeAddress = parts.join(', ');
  return rec;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const NAVY = '#1e3a5f';
const ACCENT = '#2563eb';
const CSS = `
  .epi { font-family: 'Segoe UI','Noto Sans Bengali',system-ui,sans-serif; color: #0f172a; display: flex; flex-direction: column; gap: 14px; width: 100%; }
  .epi * { box-sizing: border-box; }
  .epi-hero { background: linear-gradient(135deg, ${NAVY}, #2c5282); color: #fff; border-radius: 14px; padding: 18px 20px; }
  .epi-hero h2 { margin: 0 0 4px; font-size: 18px; font-weight: 800; }
  .epi-hero p { margin: 0; font-size: 13px; opacity: .9; line-height: 1.6; }
  .epi-flow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .epi-flow span { background: rgba(255,255,255,.16); border-radius: 999px; padding: 3px 12px; font-size: 12px; }

  .epi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 3px rgba(15,23,42,.05); overflow: hidden; }
  .epi-card-h { display: flex; align-items: center; gap: 11px; padding: 12px 16px; background: linear-gradient(180deg,#f8fafc,#f1f5f9); border-bottom: 1px solid #e2e8f0; }
  .epi-no { flex: none; width: 26px; height: 26px; border-radius: 50%; background: ${NAVY}; color: #fff; font-size: 12.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .epi-card-t { font-size: 14.5px; font-weight: 800; color: ${NAVY}; }
  .epi-card-s { font-size: 11.5px; color: #64748b; margin-top: 1px; }
  .epi-body { padding: 16px; }

  .epi-btn { border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 8px; padding: 6px 13px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
  .epi-btn:hover:not(:disabled) { background: #eff6ff; border-color: ${ACCENT}; color: ${ACCENT}; }
  .epi-btn.solid { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
  .epi-btn.solid:hover:not(:disabled) { background: #1d4ed8; color: #fff; }
  .epi-btn.green { background: #16a34a; border-color: #16a34a; color: #fff; }
  .epi-btn.green:hover:not(:disabled) { background: #15803d; color: #fff; }
  .epi-btn:disabled { opacity: .5; cursor: not-allowed; }
  .epi-input { height: 34px; padding: 5px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; font-size: 13px; outline: none; background: #fff; }
  .epi-input:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  textarea.epi-input { height: auto; width: 100%; font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; line-height: 1.5; padding: 10px 12px; resize: vertical; }

  .epi-tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
  .epi-grow { flex: 1; }
  .epi-split { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 16px; align-items: start; }
  .epi-group { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
  .epi-group-h { display: flex; align-items: center; gap: 10px; padding: 7px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; font-weight: 800; color: ${NAVY}; }
  .epi-group-h small { color: #64748b; font-weight: 600; }
  .epi-checks { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 2px 12px; padding: 8px 12px; }
  .epi-check { display: flex; align-items: center; gap: 7px; font-size: 12.5px; padding: 3px 0; cursor: pointer; color: #1e293b; }
  .epi-check input { width: 15px; height: 15px; accent-color: ${ACCENT}; cursor: pointer; flex: none; }
  .epi-check.locked { cursor: default; color: #64748b; }
  .epi-star { color: #dc2626; font-weight: 800; }
  .epi-lock { font-size: 10.5px; color: #94a3b8; }

  .epi-order { position: sticky; top: 8px; border: 1px solid #bfdbfe; background: #f0f7ff; border-radius: 12px; padding: 12px; }
  .epi-order h4 { margin: 0 0 8px; font-size: 13px; color: ${NAVY}; }
  .epi-ol { list-style: none; margin: 0 0 10px; padding: 0; max-height: 330px; overflow: auto; display: flex; flex-direction: column; gap: 4px; }
  .epi-ol li { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #dbeafe; border-radius: 8px; padding: 3px 6px; font-size: 12px; }
  .epi-ol li b { flex: none; width: 20px; color: #64748b; font-weight: 700; text-align: center; }
  .epi-ol li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .epi-mv { border: none; background: none; cursor: pointer; color: #475569; font-size: 12px; padding: 2px 4px; border-radius: 4px; }
  .epi-mv:hover:not(:disabled) { background: #e2e8f0; }
  .epi-mv:disabled { opacity: .3; cursor: default; }
  .epi-order-act { display: flex; flex-direction: column; gap: 6px; }

  .epi-tw { overflow: auto; border: 1px solid #e2e8f0; border-radius: 10px; max-height: 460px; }
  .epi-t { border-collapse: collapse; font-size: 12.5px; min-width: 100%; }
  .epi-t th { position: sticky; top: 0; z-index: 1; background: #eef2f7; color: #334155; font-size: 11.5px; font-weight: 700; padding: 8px 10px; text-align: left; white-space: nowrap; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #e2e8f0; vertical-align: top; }
  .epi-t td { padding: 6px 10px; border-bottom: 1px solid #edf2f7; border-right: 1px solid #f1f5f9; white-space: nowrap; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
  .epi-t tr.error td { background: #fff5f5; } .epi-t tr.warn td { background: #fffbeb; }
  .epi-t td.badcell { background: #fee2e2 !important; color: #b91c1c; }
  .epi-t td.sl { text-align: center; color: #64748b; }
  .epi-t td.empty { color: #cbd5e1; }
  .epi-st { display: inline-block; border-radius: 999px; padding: 1px 9px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .epi-st.ok { background: #dcfce7; color: #166534; } .epi-st.warn { background: #fef3c7; color: #92400e; } .epi-st.error { background: #fee2e2; color: #b91c1c; }
  .epi-why { white-space: normal !important; min-width: 240px; font-size: 11.5px; line-height: 1.5; }
  .epi-why div.e { color: #b91c1c; } .epi-why div.w { color: #92400e; }

  .epi-tabs { display: inline-flex; background: #f1f5f9; border-radius: 10px; padding: 3px; gap: 2px; margin-bottom: 10px; }
  .epi-tab { border: none; background: none; padding: 5px 14px; border-radius: 8px; font: inherit; font-size: 12.5px; font-weight: 600; color: #475569; cursor: pointer; }
  .epi-tab.on { background: #fff; color: ${NAVY}; box-shadow: 0 1px 2px rgba(15,23,42,.12); }
  .epi-drop { border: 2px dashed #bfdbfe; background: #f8fbff; border-radius: 12px; padding: 22px; text-align: center; color: #475569; font-size: 13px; }

  .epi-kpis { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .epi-kpi { flex: 1; min-width: 120px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; }
  .epi-kpi small { display: block; font-size: 11px; color: #64748b; } .epi-kpi b { font-size: 18px; }
  .epi-kpi.good b { color: #15803d; } .epi-kpi.bad b { color: #b91c1c; } .epi-kpi.warn b { color: #b45309; }
  .epi-notes { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 10px; padding: 8px 12px; font-size: 12.5px; line-height: 1.7; margin-bottom: 12px; }
  .epi-fatal { background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600; margin-top: 12px; }
  .epi-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin: 10px 0 4px; }
  .epi-bar i { display: block; height: 100%; background: linear-gradient(90deg, #2563eb, #22c55e); transition: width .2s; }
  .epi-done { background: #f0fdf4; border: 1px solid #86efac; border-radius: 14px; padding: 16px 18px; }
  .epi-done.bad { background: #fffbeb; border-color: #fcd34d; }
  .epi-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
  .epi-msg { font-size: 12px; font-weight: 600; color: #15803d; }

  @media (max-width: 980px) { .epi-split { grid-template-columns: 1fr; } .epi-order { position: static; } }
`;

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_EXTRA = ['idNo', 'designation', 'department', 'grossSalary', 'mobile'];
const SHOW_LIMIT = 300;

export default function EmployeeExcelImport({ existing, blankRecord, onImport, onDone }: Props) {
  const [selected, setSelected] = useState<string[]>(() => {
    const first = FIELD_CATALOG.filter(x => LOCKED_KEYS.includes(x.key)).map(x => x.key);
    return [...first, ...FIELD_CATALOG.filter(x => DEFAULT_EXTRA.includes(x.key)).map(x => x.key)];
  });
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; matrix: string[][] } | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [view, setView] = useState<'all' | 'ok' | 'issues'>('all');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ saved: number; failed: number; skipped: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedFields = useMemo(() => selected.map(k => FIELD_BY_KEY[k]).filter((x): x is CatalogField => Boolean(x)), [selected]);
  const isLocked = (k: string) => LOCKED_KEYS.includes(k);

  // ── column picker ──
  const toggle = (k: string) => {
    if (isLocked(k)) return;
    setSelected(cur => (cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]));
  };
  const setGroup = (sectionId: string, on: boolean) => {
    const keys = FIELD_CATALOG.filter(x => x.section === sectionId).map(x => x.key);
    setSelected(cur => (on ? [...cur, ...keys.filter(k => !cur.includes(k))] : cur.filter(k => !keys.includes(k) || isLocked(k))));
  };
  const preset = (kind: 'required' | 'all' | 'clear') => {
    const order = (keys: string[]) => FIELD_CATALOG.filter(x => keys.includes(x.key)).map(x => x.key);
    if (kind === 'all') setSelected(FIELD_CATALOG.map(x => x.key));
    else if (kind === 'required') setSelected(order(FIELD_CATALOG.filter(x => x.required || isLocked(x.key)).map(x => x.key)));
    else setSelected(order(LOCKED_KEYS));
  };
  const move = (i: number, dir: -1 | 1) => setSelected(cur => {
    const j = i + dir;
    if (j < 0 || j >= cur.length) return cur;
    const next = [...cur];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const q = search.trim().toLowerCase();
  const headerRow = selectedFields.map(x => x.label);
  const copyHeader = async () => {
    try { await navigator.clipboard.writeText(headerRow.join('\t')); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([headerRow]);
    ws['!cols'] = headerRow.map(h => ({ wch: Math.max(14, h.length + 4) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'employee-import-template.xlsx');
  };

  // ── data in ──
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });
      const matrix = raw.map(r => r.map(cellToText)).filter(r => r.some(c => c.trim() !== ''));
      setFileInfo({ name: file.name, matrix });
      setAnalysis(null);
      setResult(null);
    } catch {
      setFileInfo(null);
      setAnalysis({ rows: [], columns: [], notes: [], fatal: 'ফাইলটি পড়া যায়নি — .xlsx, .xls বা .csv ফাইল দিন।' });
    }
  };

  const check = () => {
    const matrix = mode === 'file' ? (fileInfo?.matrix ?? []) : parseTsv(text);
    setResult(null);
    setView('all');
    setAnalysis(analyse(matrix, selectedFields, indexExisting(existing)));
  };
  const removeRow = (no: number) => setAnalysis(a => (a ? { ...a, rows: a.rows.filter(r => r.no !== no) } : a));

  // ── import ──
  const rows = analysis?.rows ?? [];
  const okRows = rows.filter(r => r.status !== 'error');
  const errRows = rows.filter(r => r.status === 'error');
  const dupExisting = rows.filter(r => r.issues.some(i => i.code === 'dupExisting')).length;
  const dupFile = rows.filter(r => r.issues.some(i => i.code === 'dupFile')).length;
  const warnRows = rows.filter(r => r.status === 'warn').length;

  const runImport = async () => {
    if (!analysis || okRows.length === 0 || importing) return;
    // last guard: the saved list may have changed since "যাচাই করুন"
    const fresh = indexExisting(existing);
    const toSave = okRows.filter(r => {
      const card = r.values.cardNo ?? '', id = r.values.idNo ?? '';
      return !(card && fresh.card.has(idKey(card))) && !(id && fresh.id.has(idKey(id)));
    });
    const base = blankRecord();
    setImporting(true);
    setProgress({ done: 0, total: toSave.length });
    const res = await onImport(toSave.map(r => toRecord(base, r.values)), done => setProgress({ done, total: toSave.length }));
    setImporting(false);
    setResult({ saved: res.saved, failed: res.failed, skipped: errRows.length + (okRows.length - toSave.length) });
    setAnalysis(null);
    setText('');
    setFileInfo(null);
  };

  const shown = rows.filter(r => (view === 'all' ? true : view === 'ok' ? r.status !== 'error' : r.status !== 'ok'));
  const canCheck = mode === 'file' ? Boolean(fileInfo) : text.trim().length > 0;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="epi">
      <style>{CSS}</style>

      <div className="epi-hero">
        <h2>Excel থেকে কর্মী ইমপোর্ট</h2>
        <p>আপনার Excel শিটের কলামগুলো টিক দিয়ে বেছে নিন, ডেটা পেস্ট করুন বা ফাইল দিন — সিস্টেম প্রতিটি সারি যাচাই করে শুধু ঠিক সারিগুলো সংরক্ষণ করবে। একই কার্ড নং বা আইডি নং দ্বিতীয়বার কখনো ঢুকবে না।</p>
        <div className="epi-flow"><span>১. কলাম নির্বাচন</span><span>২. ডেটা দিন</span><span>৩. যাচাই ও ইমপোর্ট</span></div>
      </div>

      {/* ── 1. columns ── */}
      <section className="epi-card">
        <div className="epi-card-h"><span className="epi-no">1</span><div><div className="epi-card-t">কলাম নির্বাচন</div><div className="epi-card-s">কার্ড নং, নাম ও যোগদানের তারিখ সবসময় থাকবে। শিক্ষা ও অভিজ্ঞতার টেবিল এই ইমপোর্টে নেই।</div></div></div>
        <div className="epi-body">
          <div className="epi-tools">
            <input className="epi-input" style={{ width: 230 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="ফিল্ড খুঁজুন…" aria-label="ফিল্ড খুঁজুন" />
            <span className="epi-grow" />
            <button type="button" className="epi-btn" onClick={() => preset('required')}>শুধু আবশ্যক (*)</button>
            <button type="button" className="epi-btn" onClick={() => preset('all')}>সব ফিল্ড</button>
            <button type="button" className="epi-btn" onClick={() => preset('clear')}>পরিষ্কার</button>
          </div>

          <div className="epi-split">
            <div>
              {CATALOG_SECTIONS.map(sec => {
                const fields = FIELD_CATALOG.filter(x => x.section === sec.id && (!q || x.label.toLowerCase().includes(q) || x.key.toLowerCase().includes(q)));
                if (!fields.length) return null;
                const all = FIELD_CATALOG.filter(x => x.section === sec.id);
                const count = all.filter(x => selected.includes(x.key)).length;
                const allOn = count === all.length;
                return (
                  <div className="epi-group" key={sec.id}>
                    <div className="epi-group-h">
                      <span>{sec.title}</span><small>{count}/{all.length}</small>
                      <span className="epi-grow" />
                      <button type="button" className="epi-btn" style={{ padding: '2px 10px', fontSize: 11.5 }} onClick={() => setGroup(sec.id, !allOn)}>{allOn ? 'সব বাদ' : 'সব নিন'}</button>
                    </div>
                    <div className="epi-checks">
                      {fields.map(fl => (
                        <label key={fl.key} className={`epi-check${isLocked(fl.key) ? ' locked' : ''}`}>
                          <input type="checkbox" checked={selected.includes(fl.key)} disabled={isLocked(fl.key)} onChange={() => toggle(fl.key)} />
                          <span>{fl.label}{fl.required && <span className="epi-star"> *</span>}</span>
                          {isLocked(fl.key) && <span className="epi-lock">বাধ্যতামূলক</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="epi-order" aria-label="আপনার টেবিলের কলাম">
              <h4>আপনার টেবিল — {selectedFields.length} টি কলাম</h4>
              <ol className="epi-ol">
                {selectedFields.map((fl, i) => (
                  <li key={fl.key}>
                    <b>{i + 1}</b><span title={fl.label}>{fl.label}</span>
                    <button type="button" className="epi-mv" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${fl.label} উপরে`}>▲</button>
                    <button type="button" className="epi-mv" onClick={() => move(i, 1)} disabled={i === selectedFields.length - 1} aria-label={`${fl.label} নিচে`}>▼</button>
                    {!isLocked(fl.key) && <button type="button" className="epi-mv" onClick={() => toggle(fl.key)} aria-label={`${fl.label} বাদ দিন`}>✕</button>}
                  </li>
                ))}
              </ol>
              <div className="epi-order-act">
                <button type="button" className="epi-btn" onClick={copyHeader}>{copied ? '✓ হেডার কপি হয়েছে' : 'হেডার সারি কপি করুন'}</button>
                <button type="button" className="epi-btn" onClick={downloadTemplate}>Excel টেমপ্লেট ডাউনলোড (.xlsx)</button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── 2. data ── */}
      <section className="epi-card">
        <div className="epi-card-h"><span className="epi-no">2</span><div><div className="epi-card-t">ডেটা দিন</div><div className="epi-card-s">ক্রম মিলিয়ে সরাসরি পেস্ট করুন, অথবা প্রথম সারিতে কলামের নাম থাকলে যেকোনো ক্রমে দিতে পারেন — নাম দেখে মিলিয়ে নেওয়া হবে।</div></div></div>
        <div className="epi-body">
          <div className="epi-tw" style={{ maxHeight: 'none', marginBottom: 14 }}>
            <table className="epi-t">
              <thead><tr>{selectedFields.map(fl => <th key={fl.key}>{fl.label}</th>)}</tr></thead>
              <tbody><tr>{selectedFields.map(fl => <td key={fl.key} className="empty">{fl.kind === 'date' ? 'DD-MM-YYYY' : fl.kind === 'number' ? '০–৯' : '…'}</td>)}</tr></tbody>
            </table>
          </div>

          <div className="epi-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'paste'} className={`epi-tab${mode === 'paste' ? ' on' : ''}`} onClick={() => setMode('paste')}>Excel থেকে পেস্ট</button>
            <button type="button" role="tab" aria-selected={mode === 'file'} className={`epi-tab${mode === 'file' ? ' on' : ''}`} onClick={() => setMode('file')}>ফাইল আপলোড</button>
          </div>

          {mode === 'paste' ? (
            <textarea className="epi-input" rows={8} value={text} onChange={e => { setText(e.target.value); setAnalysis(null); }} placeholder="Excel-এ ঘরগুলো সিলেক্ট করে Ctrl+C, তারপর এখানে Ctrl+V…" aria-label="Excel থেকে কপি করা ডেটা" />
          ) : (
            <div className="epi-drop">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={onFile} />
              <button type="button" className="epi-btn solid" onClick={() => fileRef.current?.click()}>ফাইল বাছুন (.xlsx / .xls / .csv)</button>
              <div style={{ marginTop: 8 }}>{fileInfo ? `${fileInfo.name} — ${fileInfo.matrix.length} টি সারি পড়া হয়েছে` : 'প্রথম শিটটি পড়া হবে।'}</div>
            </div>
          )}

          <div className="epi-foot">
            <button type="button" className="epi-btn solid" onClick={check} disabled={!canCheck || importing}>যাচাই করুন</button>
            <span style={{ fontSize: 12, color: '#64748b' }}>যাচাইয়ের পর ডেটা সংরক্ষণ হয় না — আগে প্রিভিউ দেখানো হবে।</span>
          </div>
          {analysis?.fatal && <div className="epi-fatal" role="alert">{analysis.fatal}</div>}
        </div>
      </section>

      {/* ── 3. check + import ── */}
      {analysis && !analysis.fatal && (
        <section className="epi-card">
          <div className="epi-card-h"><span className="epi-no">3</span><div><div className="epi-card-t">যাচাই ও ইমপোর্ট</div><div className="epi-card-s">লাল সারি ইমপোর্ট হবে না; হলুদ সারির কিছু ঘর ফাঁকা রেখে সংরক্ষণ হবে।</div></div></div>
          <div className="epi-body">
            {analysis.notes.length > 0 && <div className="epi-notes">{analysis.notes.map((n, i) => <div key={i}>• {n}</div>)}</div>}

            <div className="epi-kpis">
              <div className="epi-kpi"><small>মোট সারি</small><b>{rows.length}</b></div>
              <div className="epi-kpi good"><small>ইমপোর্ট হবে</small><b>{okRows.length}</b></div>
              <div className="epi-kpi warn"><small>সতর্কতাসহ</small><b>{warnRows}</b></div>
              <div className="epi-kpi bad"><small>বাদ যাবে</small><b>{errRows.length}</b></div>
              <div className="epi-kpi bad"><small>আগে থেকেই আছে</small><b>{dupExisting}</b></div>
              <div className="epi-kpi bad"><small>ফাইলে ডুপ্লিকেট</small><b>{dupFile}</b></div>
            </div>

            <div className="epi-tabs">
              {([['all', `সব (${rows.length})`], ['ok', `ঠিক (${okRows.length})`], ['issues', `সমস্যা (${rows.length - rows.filter(r => r.status === 'ok').length})`]] as const).map(([id, label]) => (
                <button key={id} type="button" className={`epi-tab${view === id ? ' on' : ''}`} onClick={() => setView(id)}>{label}</button>
              ))}
            </div>

            <div className="epi-tw">
              <table className="epi-t">
                <thead>
                  <tr><th>সারি</th><th>অবস্থা</th>{analysis.columns.map(fl => <th key={fl.key}>{fl.label}</th>)}<th>কারণ</th><th aria-label="বাদ দিন" /></tr>
                </thead>
                <tbody>
                  {shown.length === 0 && <tr><td colSpan={analysis.columns.length + 4} className="empty" style={{ textAlign: 'center', padding: 20 }}>এই তালিকায় কোনো সারি নেই</td></tr>}
                  {shown.slice(0, SHOW_LIMIT).map(r => {
                    const badKeys = new Set(r.issues.map(i => i.key));
                    return (
                      <tr key={r.no} className={r.status}>
                        <td className="sl">{r.no}</td>
                        <td><span className={`epi-st ${r.status}`}>{r.status === 'ok' ? 'ঠিক' : r.status === 'warn' ? 'সতর্কতা' : 'বাদ'}</span></td>
                        {analysis.columns.map(fl => (
                          <td key={fl.key} className={badKeys.has(fl.key) ? 'badcell' : r.values[fl.key] ? '' : 'empty'} title={r.values[fl.key]}>{r.values[fl.key] || '—'}</td>
                        ))}
                        <td className="epi-why">{r.issues.map((i, k) => <div key={k} className={i.level === 'error' ? 'e' : 'w'}>{i.level === 'error' ? '✕' : '⚠'} {i.text}</div>)}</td>
                        <td><button type="button" className="epi-mv" onClick={() => removeRow(r.no)} aria-label={`সারি ${r.no} বাদ দিন`}>✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {shown.length > SHOW_LIMIT && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>প্রথম {SHOW_LIMIT} টি সারি দেখানো হচ্ছে — ইমপোর্টে সবগুলো ধরা হবে।</div>}

            {importing && (
              <>
                <div className="epi-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: 12, color: '#475569' }}>সংরক্ষণ হচ্ছে… {progress.done} / {progress.total} — পেজ বন্ধ করবেন না।</div>
              </>
            )}

            <div className="epi-foot">
              <button type="button" className="epi-btn green" onClick={runImport} disabled={okRows.length === 0 || importing}>
                {importing ? 'ইমপোর্ট চলছে…' : `${okRows.length} জন কর্মী ইমপোর্ট করুন`}
              </button>
              {errRows.length > 0 && !importing && <span className="epi-msg" style={{ color: '#b91c1c' }}>{errRows.length} টি সারি বাদ থাকবে।</span>}
            </div>
          </div>
        </section>
      )}

      {result && (
        <div className={`epi-done${result.failed ? ' bad' : ''}`} role="status">
          <div style={{ fontSize: 15, fontWeight: 800, color: result.failed ? '#92400e' : '#166534' }}>
            {result.failed ? 'ইমপোর্ট শেষ — কিছু সারি সংরক্ষণ হয়নি' : '✓ ইমপোর্ট সম্পূর্ণ হয়েছে'}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.8 }}>
            সংরক্ষিত: <b>{result.saved}</b> জন · বাদ (ত্রুটি/ডুপ্লিকেট): <b>{result.skipped}</b> টি{result.failed > 0 && <> · সংরক্ষণ ব্যর্থ: <b>{result.failed}</b> টি (আবার চেষ্টা করুন — যারা সংরক্ষিত হয়েছে তারা ডুপ্লিকেট হিসেবে আটকে যাবে)</>}
          </div>
          <div className="epi-foot">
            <button type="button" className="epi-btn solid" onClick={onDone}>তালিকা দেখুন</button>
            <button type="button" className="epi-btn" onClick={() => setResult(null)}>আরও ইমপোর্ট করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}