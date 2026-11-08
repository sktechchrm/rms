// ─────────────────────────────────────────────────────────────────────────────
// employeeModel.ts — Employee Personal File: record ↔ form helpers and the saved-row list engine
// (rows / file-completeness / filters / sort / summary) for the Statement — same shape as maternityModel.ts.
// Saved data format is unchanged (buildRecord in EmployeeFileSystem.tsx), so old records still open.
// Path: src/components/modules/employeePersonalFile/employeeModel.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { toDateInput } from '../../../utils/dateUtils';

// ─── Small helpers ───────────────────────────────────────────────────────────

const pad2 = (x: number) => String(x).padStart(2, '0');
/** Safe text of any stored value: objects without a usable toString (and null) never throw — they become ''. */
export const text = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') { try { return v instanceof Date ? v.toISOString() : ''; } catch { return ''; } }
  return String(v);
};
const n = (v: unknown): number => { const x = parseFloat(text(v).replace(/,/g, '')); return Number.isFinite(x) ? x : 0; };

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}
export const money = (x: number) => (Number.isFinite(x) ? x : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Whole years / months / days from one ISO date to another (end exclusive of the partial day, calendar-safe). */
export function spanYmd(fromIso: string, toIso: string): { y: number; m: number; d: number } | null {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(fromIso ?? ''), b = /^(\d{4})-(\d{2})-(\d{2})/.exec(toIso ?? '');
  if (!a || !b) return null;
  let y = Number(b[1]) - Number(a[1]), m = Number(b[2]) - Number(a[2]), d = Number(b[3]) - Number(a[3]);
  if (d < 0) { m -= 1; d += new Date(Date.UTC(Number(b[1]), Number(b[2]) - 1, 0)).getUTCDate(); }
  if (m < 0) { y -= 1; m += 12; }
  return y < 0 ? null : { y, m, d };
}

// ─── File completeness ───────────────────────────────────────────────────────
// The fields the printed documents (appointment letter, nominee form, medical certificate, ID card …) actually need.
// ONE list, two users: EmployeeForm.tsx marks exactly these fields as required, and the Statement's file status counts them.
export type SectionId = 'personal' | 'family' | 'contact' | 'job' | 'pay' | 'nominee';
export const REQUIRED_FIELDS: { key: string; label: string; section: SectionId }[] = [
  { key: 'fullName', label: 'নাম (ইংরেজি)', section: 'personal' }, { key: 'fullNameBengali', label: 'নাম (বাংলা)', section: 'personal' },
  { key: 'fatherName', label: 'পিতার নাম', section: 'personal' }, { key: 'motherName', label: 'মাতার নাম', section: 'personal' },
  { key: 'dateOfBirth', label: 'জন্ম তারিখ', section: 'personal' }, { key: 'gender', label: 'লিঙ্গ', section: 'personal' },
  { key: 'bloodGroup', label: 'রক্তের গ্রুপ', section: 'personal' }, { key: 'height', label: 'উচ্চতা', section: 'personal' },
  { key: 'weight', label: 'ওজন', section: 'personal' }, { key: 'identificationMark', label: 'সনাক্তকরণ চিহ্ন', section: 'personal' },
  { key: 'photo', label: 'ছবি', section: 'personal' },
  { key: 'spouseName', label: 'স্বামী/স্ত্রীর নাম', section: 'family' },
  { key: 'presentHouseNo', label: 'বর্তমান বাড়ি/রাস্তা', section: 'contact' }, { key: 'presentVillage', label: 'বর্তমান গ্রাম', section: 'contact' },
  { key: 'presentPostOffice', label: 'বর্তমান ডাকঘর', section: 'contact' }, { key: 'presentThana', label: 'বর্তমান থানা', section: 'contact' },
  { key: 'presentDistrict', label: 'বর্তমান জেলা', section: 'contact' },
  { key: 'permanentHouseNo', label: 'স্থায়ী বাড়ি/রাস্তা', section: 'contact' }, { key: 'permanentVillage', label: 'স্থায়ী গ্রাম', section: 'contact' },
  { key: 'permanentPostOffice', label: 'স্থায়ী ডাকঘর', section: 'contact' }, { key: 'permanentThana', label: 'স্থায়ী থানা', section: 'contact' },
  { key: 'permanentDistrict', label: 'স্থায়ী জেলা', section: 'contact' },
  { key: 'idNo', label: 'আইডি নং', section: 'job' }, { key: 'cardNo', label: 'কার্ড নং', section: 'job' },
  { key: 'proximityNumber', label: 'প্রক্সিমিটি নম্বর', section: 'job' }, { key: 'grade', label: 'গ্রেড', section: 'job' },
  { key: 'sectionLine', label: 'সেকশন/লাইন', section: 'job' }, { key: 'designation', label: 'পদবি', section: 'job' },
  { key: 'department', label: 'বিভাগ', section: 'job' }, { key: 'joiningDate', label: 'যোগদানের তারিখ', section: 'job' },
  { key: 'attendanceBonus', label: 'হাজিরা বোনাস', section: 'job' },
  { key: 'grossSalary', label: 'মোট বেতন', section: 'pay' },
  { key: 'nomineeName', label: 'নমিনির নাম', section: 'nominee' }, { key: 'nomineeRelation', label: 'নমিনির সম্পর্ক', section: 'nominee' },
  { key: 'nomineeNid', label: 'নমিনির NID', section: 'nominee' }, { key: 'nomineeDob', label: 'নমিনির জন্ম তারিখ', section: 'nominee' },
  { key: 'nomineePercentage', label: 'নমিনির অংশ %', section: 'nominee' }, { key: 'nomineeEducation', label: 'নমিনির শিক্ষা', section: 'nominee' },
  { key: 'nomineeProfession', label: 'নমিনির পেশা', section: 'nominee' }, { key: 'nomineePhone', label: 'নমিনির মোবাইল', section: 'nominee' },
  { key: 'nomineeVillage', label: 'নমিনির গ্রাম', section: 'nominee' }, { key: 'nomineePostOffice', label: 'নমিনির ডাকঘর', section: 'nominee' },
  { key: 'nomineeThana', label: 'নমিনির থানা', section: 'nominee' }, { key: 'nomineeDistrict', label: 'নমিনির জেলা', section: 'nominee' },
];

// ─── Saved rows ──────────────────────────────────────────────────────────────

export type FileStatus = 'Complete' | 'Partial' | 'Incomplete';
export const STATUS_STYLE: Record<FileStatus, { bg: string; color: string; label: string }> = {
  Complete:   { bg: '#dcfce7', color: '#166534', label: 'সম্পূর্ণ' },
  Partial:    { bg: '#dbeafe', color: '#1d4ed8', label: 'আংশিক' },
  Incomplete: { bg: '#fef3c7', color: '#92400e', label: 'অসম্পূর্ণ' },
};

export interface EmployeeRow {
  id: string; savedAt: string; name: string; nameEn: string; cardNo: string; idNo: string; designation: string; section: string; department: string;
  grade: string; gender: string; bloodGroup: string; father: string; mother: string; dob: string; age: string; nid: string;
  joining: string; service: string; serviceKey: number; mobile: string; presentDistrict: string; permanentDistrict: string;
  gross: number; hasPhoto: boolean;
  filled: number; total: number; pct: number; missing: string[]; status: FileStatus;
}

export function buildEmployeeRows(records: DbRecord[], today: string = todayIso()): EmployeeRow[] {
  return records.map(rc => {
    const r = rc as unknown as Record<string, unknown>;
    const s = (k: string) => text(r[k]).trim();
    const dt = (k: string) => (r[k] ? toDateInput(r[k]) || '' : '');
    const missing = REQUIRED_FIELDS.filter(f => s(f.key) === '').map(f => f.label);
    const total = REQUIRED_FIELDS.length, filled = total - missing.length;
    const pct = Math.round((filled / total) * 100);
    const status: FileStatus = missing.length === 0 ? 'Complete' : pct >= 50 ? 'Partial' : 'Incomplete';
    const joining = dt('joiningDate'), dob = dt('dateOfBirth');
    const sv = joining ? spanYmd(joining, today) : null, ag = dob ? spanYmd(dob, today) : null;
    const mobileDigits = s('mobile').replace(/\D/g, '');
    return {
      id: s('id'), savedAt: s('savedAt'),
      name: s('fullNameBengali') || s('fullName') || '—', nameEn: s('fullName'),
      cardNo: s('cardNo') || s('idNo'), idNo: s('idNo'), designation: s('designation'), section: s('sectionLine'), department: s('department'),
      grade: s('grade'), gender: s('gender'), bloodGroup: s('bloodGroup'), father: s('fatherName'), mother: s('motherName'),
      dob, age: ag ? `${ag.y} বছর` : '', nid: s('nid'),
      joining, service: sv ? `${sv.y} বছর ${sv.m} মাস ${sv.d} দিন` : '', serviceKey: sv ? sv.y * 372 + sv.m * 31 + sv.d : -1,
      // Google Sheets drops a leading zero: a 10-digit number starting with 1 is a Bangladeshi mobile missing its 0.
      mobile: mobileDigits.length === 10 && mobileDigits.startsWith('1') ? `0${mobileDigits}` : mobileDigits || s('mobile'),
      presentDistrict: s('presentDistrict'), permanentDistrict: s('permanentDistrict'),
      gross: n(r.grossSalary), hasPhoto: s('photo') !== '',
      filled, total, pct, missing, status,
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

// ─── Filters / sort / summary ────────────────────────────────────────────────

export type EmpSortField = 'name' | 'cardNo' | 'joining' | 'service' | 'gross' | 'complete' | '';
/** What the Month-Year filter looks at: the joining date, or the day the record was saved. */
export type MonthBasis = 'joining' | 'saved';
export interface EmployeeFilters {
  search: string;
  status: string[];                        // 'Complete' | 'Partial' | 'Incomplete'; [] = all
  basis: MonthBasis;
  year: string; month: string;             // Month-Year ('' = any; month '01'…'12' needs a year)
  columns: Record<string, string[]>;       // cardNo / designation / section / department / gender / bloodGroup / joining / service / gross
  sort: { field: EmpSortField; dir: 'asc' | 'desc' };
}
export const EMPTY_EMPLOYEE_FILTERS: EmployeeFilters = { search: '', status: [], basis: 'joining', year: '', month: '', columns: {}, sort: { field: '', dir: 'asc' } };
export const BLANK_VALUE = '(Blank)';

export function columnValue(r: EmployeeRow, field: string): string {
  const v = field === 'cardNo' ? r.cardNo
    : field === 'designation' ? r.designation
    : field === 'section' ? r.section
    : field === 'department' ? r.department
    : field === 'gender' ? r.gender
    : field === 'bloodGroup' ? r.bloodGroup
    : field === 'joining' ? formatDMY(r.joining)
    : field === 'service' ? r.service
    : field === 'gross' ? money(r.gross)
    : '';
  return v.trim() || BLANK_VALUE;
}
/** First and last day (ISO) of a year, or of one month of it. */
export function monthRange(year: string, month: string): { from: string; to: string } {
  const y = Number(year), m = Number(month);
  if (!month || !m) return { from: `${year}-01-01`, to: `${year}-12-31` };
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, '0')}` };
}
export function countActiveFilters(f: EmployeeFilters): number {
  return [f.search.trim(), f.status.length > 0, f.year, f.year && f.month].filter(Boolean).length + Object.values(f.columns ?? {}).filter(a => a.length > 0).length;
}

const basisDate = (r: EmployeeRow, b: MonthBasis): string => (b === 'saved' ? (toDateInput(r.savedAt) || '') : r.joining);

export function filterRows(rows: EmployeeRow[], f: EmployeeFilters): EmployeeRow[] {
  const words = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = rows.filter(r => {
    if (f.year) {
      const { from, to } = monthRange(f.year, f.month);
      const d = basisDate(r, f.basis);
      if (!d || d < from || d > to) return false;
    }
    if (f.status.length && !f.status.includes(r.status)) return false;
    for (const [field, sel] of Object.entries(f.columns ?? {})) if (sel.length && !sel.includes(columnValue(r, field))) return false;
    if (words.length) {
      const hay = `${r.name} ${r.nameEn} ${r.cardNo} ${r.designation} ${r.section} ${r.department} ${r.mobile} ${r.nid} ${r.father}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const { field, dir } = f.sort ?? { field: '', dir: 'asc' };
  if (!field) return out;
  const m = dir === 'asc' ? 1 : -1;
  return [...out].sort((a, b) => {
    if (field === 'gross') return m * (a.gross - b.gross);
    if (field === 'complete') return m * (a.pct - b.pct);
    if (field === 'service') {
      if (a.serviceKey < 0 && b.serviceKey < 0) return 0;
      if (a.serviceKey < 0) return 1;      // blanks always last
      if (b.serviceKey < 0) return -1;
      return m * (a.serviceKey - b.serviceKey);
    }
    const x = field === 'name' ? a.name : field === 'cardNo' ? a.cardNo : a.joining;
    const y = field === 'name' ? b.name : field === 'cardNo' ? b.cardNo : b.joining;
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return m * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function summarize(rows: EmployeeRow[]) {
  return {
    count: rows.length, totalGross: rows.reduce((s, r) => s + r.gross, 0),
    completeCount: rows.filter(r => r.status === 'Complete').length,
    incompleteCount: rows.filter(r => r.status !== 'Complete').length,
    photoCount: rows.filter(r => r.hasPhoto).length,
  };
}

// ─── Field catalogue (Excel template / import) ───────────────────────────────
// Every value the form collects, with its Bangla and English caption and how an Excel cell is cleaned up on import.
// ONE list: the template download, the profile export and the importer all read it.
export type FieldKind = 'text' | 'date' | 'gender' | 'marital' | 'blood' | 'mobile' | 'number' | 'email';
export interface FieldDef { key: string; bn: string; en: string; kind: FieldKind; section: string; note?: string }

const sectionFields = (section: string, rows: [string, string, string, FieldKind?, string?][]): FieldDef[] =>
  rows.map(([key, bn, en, kind, note]) => ({ key, bn, en, kind: kind ?? 'text', section, note }));

const BLOOD_NOTE = 'A+ A- B+ B- O+ O- AB+ AB-';
export const FIELD_DEFS: FieldDef[] = [
  ...sectionFields('ব্যক্তিগত তথ্য', [
    ['fullName', 'পূর্ণ নাম (ইংরেজি)', 'Full Name'], ['fullNameBengali', 'পূর্ণ নাম (বাংলা)', 'Full Name (Bengali)'],
    ['fatherName', 'পিতার নাম', "Father's Name"], ['motherName', 'মাতার নাম', "Mother's Name"],
    ['dateOfBirth', 'জন্ম তারিখ', 'Date of Birth', 'date'], ['gender', 'লিঙ্গ', 'Gender', 'gender', 'Male / Female / Other (পুরুষ / নারী / তৃতীয় লিঙ্গ)'],
    ['bloodGroup', 'রক্তের গ্রুপ', 'Blood Group', 'blood', BLOOD_NOTE],
    ['maritalStatus', 'বৈবাহিক অবস্থা', 'Marital Status', 'marital', 'Single / Married / Divorced (অবিবাহিত / বিবাহিত / তালাকপ্রাপ্ত)'],
    ['nationality', 'জাতীয়তা', 'Nationality'], ['religion', 'ধর্ম', 'Religion'], ['height', 'উচ্চতা', 'Height'], ['weight', 'ওজন (কেজি)', 'Weight'],
    ['nid', 'জাতীয় পরিচয়পত্র নং', 'NID'], ['birthRegistrationNo', 'জন্ম নিবন্ধন নং', 'Birth Registration No'],
    ['passportNumber', 'পাসপোর্ট নং', 'Passport No'], ['drivingLicense', 'ড্রাইভিং লাইসেন্স নং', 'Driving License'],
    ['identificationMark', 'সনাক্তকরণ চিহ্ন', 'Identification Mark'],
  ]),
  ...sectionFields('পরিবার ও সন্তান', [
    ['spouseName', 'স্বামী/স্ত্রীর নাম', 'Spouse Name'], ['spouseDob', 'স্বামী/স্ত্রীর জন্ম তারিখ', 'Spouse DOB', 'date'],
    ['spouseBloodGroup', 'স্বামী/স্ত্রীর রক্তের গ্রুপ', 'Spouse Blood Group', 'blood', BLOOD_NOTE],
    ['spouseProfession', 'স্বামী/স্ত্রীর পেশা', 'Spouse Profession'], ['spousePhone', 'স্বামী/স্ত্রীর মোবাইল', 'Spouse Mobile', 'mobile'],
    ['spouseEducation', 'স্বামী/স্ত্রীর শিক্ষাগত যোগ্যতা', 'Spouse Education'], ['numberOfSons', 'পুত্র সন্তান', 'No. of Sons', 'number'],
    ['numberOfDaughters', 'কন্যা সন্তান', 'No. of Daughters', 'number'],
  ]),
  ...sectionFields('যোগাযোগ ও ঠিকানা', [
    ['mobile', 'মোবাইল নম্বর', 'Mobile', 'mobile'], ['email', 'ইমেইল', 'Email', 'email'], ['onnano', 'অন্যান্য যোগাযোগ', 'Other Contact'],
    ['presentHouseNo', 'বর্তমান বাড়ি/রাস্তা', 'Present House / Road'], ['presentUnion', 'বর্তমান ইউনিয়ন', 'Present Union'],
    ['presentVillage', 'বর্তমান গ্রাম', 'Present Village'], ['presentPostOffice', 'বর্তমান ডাকঘর', 'Present Post Office'],
    ['presentThana', 'বর্তমান থানা', 'Present Thana'], ['presentDistrict', 'বর্তমান জেলা', 'Present District'], ['presentDivision', 'বর্তমান বিভাগ', 'Present Division'],
    ['permanentHouseNo', 'স্থায়ী বাড়ি/রাস্তা', 'Permanent House / Road'], ['permanentUnion', 'স্থায়ী ইউনিয়ন', 'Permanent Union'],
    ['permanentVillage', 'স্থায়ী গ্রাম', 'Permanent Village'], ['permanentPostOffice', 'স্থায়ী ডাকঘর', 'Permanent Post Office'],
    ['permanentThana', 'স্থায়ী থানা', 'Permanent Thana'], ['permanentDistrict', 'স্থায়ী জেলা', 'Permanent District'], ['permanentDivision', 'স্থায়ী বিভাগ', 'Permanent Division'],
    ['emergencyName', 'জরুরি যোগাযোগের নাম', 'Emergency Name'], ['emergencyRelation', 'জরুরি যোগাযোগের সম্পর্ক', 'Emergency Relation'],
    ['emergencyMobile', 'জরুরি যোগাযোগের মোবাইল', 'Emergency Mobile', 'mobile'], ['emergencyProfession', 'জরুরি যোগাযোগের পেশা', 'Emergency Profession'],
  ]),
  ...sectionFields('চাকরির তথ্য', [
    ['idNo', 'আইডি নং', 'ID No'], ['cardNo', 'কার্ড নং', 'Card No'], ['proximityNumber', 'প্রক্সিমিটি নম্বর', 'Proximity No'], ['grade', 'গ্রেড', 'Grade'],
    ['otCategory', 'ওভারটাইম ক্যাটাগরি', 'OT Category', 'text', 'Elegible / নন ওভারটাইম'],
    ['wagesSchedule', 'মজুরি তফসিল', 'Wages Schedule', 'text', 'তফসিল-ক / তফসিল-খ / তফসিল-বহির্ভূত'],
    ['sectionLine', 'সেকশন / লাইন', 'Section / Line'], ['designation', 'পদবি', 'Designation'], ['department', 'বিভাগ', 'Department'],
    ['joiningDate', 'যোগদানের তারিখ', 'Joining Date', 'date'], ['jobSource', 'নিয়োগ সূত্র', 'Job Source'],
  ]),
  ...sectionFields('বেতন ও ব্যাংক', [
    ['grossSalary', 'মাসিক বেতন (মোট)', 'Gross Salary', 'number'], ['tinNumber', 'টিন নম্বর', 'TIN'],
    ['bankName', 'ব্যাংকের নাম', 'Bank Name'], ['bankAccountNo', 'হিসাব নম্বর', 'Bank Account No'], ['bankBranch', 'শাখার নাম', 'Bank Branch'],
  ]),
  ...sectionFields('নমিনি তথ্য', [
    ['nomineeName', 'নমিনির নাম', 'Nominee Name'], ['nomineeRelation', 'নমিনির সম্পর্ক', 'Nominee Relation'], ['nomineeNid', 'নমিনির এনআইডি', 'Nominee NID'],
    ['nomineeDob', 'নমিনির জন্ম তারিখ', 'Nominee DOB', 'date'], ['nomineePercentage', 'নমিনির অংশ (%)', 'Nominee Percentage', 'number'],
    ['nomineeEducation', 'নমিনির শিক্ষা', 'Nominee Education'], ['nomineeProfession', 'নমিনির পেশা', 'Nominee Profession'],
    ['nomineeBloodGroup', 'নমিনির রক্তের গ্রুপ', 'Nominee Blood Group', 'blood', BLOOD_NOTE], ['nomineePhone', 'নমিনির মোবাইল', 'Nominee Mobile', 'mobile'],
    ['nomineeVillage', 'নমিনির গ্রাম', 'Nominee Village'], ['nomineePostOffice', 'নমিনির ডাকঘর', 'Nominee Post Office'],
    ['nomineeThana', 'নমিনির থানা', 'Nominee Thana'], ['nomineeDistrict', 'নমিনির জেলা', 'Nominee District'],
  ]),
  ...sectionFields('সুপারিশকারী', [
    ['supervisorName', 'সুপারিশকারীর নাম', 'Referee Name'], ['supervisorOrg', 'সুপারিশকারীর প্রতিষ্ঠান', 'Referee Organisation'],
    ['supervisorDesignation', 'সুপারিশকারীর পদবি', 'Referee Designation'], ['supervisorProfession', 'সুপারিশকারীর পেশা', 'Referee Profession'],
    ['supervisorPhone', 'সুপারিশকারীর মোবাইল', 'Referee Mobile', 'mobile'], ['supervisorRelation', 'সুপারিশকারীর সম্পর্ক', 'Referee Relation'],
    ['supervisorAddress', 'সুপারিশকারীর ঠিকানা', 'Referee Address'],
  ]),
];

/** The two tables of the form (Education / Previous experience): one row per entry. */
export const ENTRY_DEFS: Record<'education' | 'previous', { key: string; bn: string; en: string; kind?: FieldKind }[]> = {
  education: [
    { key: 'education', bn: 'শিক্ষাগত যোগ্যতা', en: 'Education' }, { key: 'institution', bn: 'প্রতিষ্ঠানের নাম', en: 'Institution' },
    { key: 'educationGroup', bn: 'গ্রুপ / বিষয়', en: 'Group' }, { key: 'educationResult', bn: 'ফলাফল / জিপিএ', en: 'Result' },
    { key: 'educationBoard', bn: 'বোর্ড / বিশ্ববিদ্যালয়', en: 'Board' }, { key: 'passingYear', bn: 'পাসের সন', en: 'Passing Year' },
  ],
  previous: [
    { key: 'prevCompanyName', bn: 'প্রতিষ্ঠানের নাম', en: 'Company' }, { key: 'prevDesignation', bn: 'পদবি', en: 'Designation' },
    { key: 'prevSection', bn: 'সেকশন / বিভাগ', en: 'Section' }, { key: 'prevServiceYears', bn: 'চাকরির বছর', en: 'Service Years' },
    { key: 'prevEndDate', bn: 'শেষ তারিখ', en: 'End Date', kind: 'date' }, { key: 'prevStartDate', bn: 'শুরুর তারিখ', en: 'Start Date', kind: 'date' },
    { key: 'prevCompanyPhone', bn: 'প্রতিষ্ঠানের ফোন', en: 'Company Phone' }, { key: 'prevLeaveReason', bn: 'ছাড়ার কারণ', en: 'Reason for Leaving' },
    { key: 'prevRefDetails', bn: 'রেফারেন্স বিস্তারিত', en: 'Reference' },
  ],
};
