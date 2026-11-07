// ─────────────────────────────────────────────────────────────────────────────
// EmployeeForm.tsx — ONE combined, professional personal-file form.
// Path: src/components/modules/employeePersonalFile/EmployeeForm.tsx
//
// Replaces the old 8-step wizard (identity / employment / contact / education / previous / nominee / supervisor / photo)
// with a single scrolling form:
//   • Header card   — photo upload, name / card / designation summary, required-field progress and a "what is missing" list
//   • Section bar   — sticky pills with a count per section; the current section is highlighted while scrolling
//   • 9 cards       — personal · family · contact & address · employment · salary & bank · education · experience ·
//                     nominee · reference. Each card shows "filled / required" and can be collapsed.
//   • Smart helpers — same-address switch that keeps the permanent address in step, nominee address copy + auto line,
//                     salary breakdown, under-18 notice, education / experience tables with automatic start date.
//
// Required (*) fields are exactly the ones the print documents read (Appointment Letter, Nominee Form, Medical
// Fitness, Recruitment Verification). A field turns red only after the person has left it empty (on blur),
// never while they are still typing. Save itself stays governed by EmployeeFileSystem (name + joining date).
//
// react-hook-form / zod were only used for dirty tracking in the old file; they are no longer needed here —
// any edit calls onDirtyChange(true) directly.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EmployeeFormData, EducationEntry, PreviousJobEntry, generateEntryId } from './employee.types';
import { PhotoUploadField } from './PrintFiles/PhotoAttach';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployeeFormProps {
  formData:          EmployeeFormData;
  handleInputChange: (e: FieldChange) => void;
  setFormData:       (updater: (prev: EmployeeFormData) => EmployeeFormData) => void;
  onDirtyChange?:    (dirty: boolean) => void;
  photo?:            string;
  onPhotoChange?:    (dataUrl: string | undefined) => void;
}

type SectionKey = 'personal' | 'family' | 'contact' | 'employment' | 'salary' | 'education' | 'experience' | 'nominee' | 'reference';
type FieldChange = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
interface Opt { value: string; label: string }
interface FieldOpts {
  type?: string; required?: boolean; placeholder?: string; options?: Opt[]; disabled?: boolean; readOnly?: boolean;
  span?: 1 | 2 | 3 | 4; hint?: string; value?: string; textarea?: boolean; onChange?: (e: FieldChange) => void;
}

// ── Sections and the fields each print document needs ────────────────────────

const SECTIONS: { key: SectionKey; title: string; sub: string }[] = [
  { key: 'personal',   title: 'ব্যক্তিগত তথ্য',            sub: 'নাম, জন্ম, পরিচয়পত্র ও শারীরিক তথ্য' },
  { key: 'family',     title: 'পরিবার ও সন্তান',           sub: 'স্বামী/স্ত্রী ও সন্তানের তথ্য' },
  { key: 'contact',    title: 'যোগাযোগ ও ঠিকানা',          sub: 'মোবাইল, বর্তমান ও স্থায়ী ঠিকানা, জরুরি যোগাযোগ' },
  { key: 'employment', title: 'চাকরির তথ্য',               sub: 'আইডি, কার্ড, পদবি, বিভাগ ও যোগদান' },
  { key: 'salary',     title: 'বেতন ও ব্যাংক',             sub: 'মাসিক বেতন বিভাজন, টিন ও ব্যাংক হিসাব' },
  { key: 'education',  title: 'শিক্ষাগত যোগ্যতা',          sub: 'পরীক্ষা, প্রতিষ্ঠান ও ফলাফল' },
  { key: 'experience', title: 'পূর্ববর্তী অভিজ্ঞতা',        sub: 'আগের চাকরির বিবরণ' },
  { key: 'nominee',    title: 'নমিনি',                    sub: 'নমিনির পরিচয় ও ঠিকানা' },
  { key: 'reference',  title: 'সুপারিশকারী / রেফারেন্স',    sub: 'সুপারিশকারীর তথ্য' },
];

const REQUIRED: Record<SectionKey, { name: string; label: string }[]> = {
  personal: [
    { name: 'fullName', label: 'পূর্ণ নাম (ইংরেজি)' }, { name: 'fullNameBengali', label: 'পূর্ণ নাম (বাংলা)' },
    { name: 'fatherName', label: 'পিতার নাম' }, { name: 'motherName', label: 'মাতার নাম' },
    { name: 'dateOfBirth', label: 'জন্ম তারিখ' }, { name: 'gender', label: 'লিঙ্গ' }, { name: 'bloodGroup', label: 'রক্তের গ্রুপ' },
    { name: 'height', label: 'উচ্চতা' }, { name: 'weight', label: 'ওজন' }, { name: 'identificationMark', label: 'সনাক্তকরণ চিহ্ন' },
  ],
  family: [{ name: 'spouseName', label: 'স্বামী/স্ত্রীর নাম' }],
  contact: [
    { name: 'presentHouseNo', label: 'বর্তমান: বাড়ি/রাস্তা' }, { name: 'presentVillage', label: 'বর্তমান: গ্রাম' },
    { name: 'presentPostOffice', label: 'বর্তমান: ডাকঘর' }, { name: 'presentThana', label: 'বর্তমান: থানা' }, { name: 'presentDistrict', label: 'বর্তমান: জেলা' },
    { name: 'permanentHouseNo', label: 'স্থায়ী: বাড়ি/রাস্তা' }, { name: 'permanentVillage', label: 'স্থায়ী: গ্রাম' },
    { name: 'permanentPostOffice', label: 'স্থায়ী: ডাকঘর' }, { name: 'permanentThana', label: 'স্থায়ী: থানা' }, { name: 'permanentDistrict', label: 'স্থায়ী: জেলা' },
  ],
  employment: [
    { name: 'idNo', label: 'আইডি নং' }, { name: 'cardNo', label: 'কার্ড নং' }, { name: 'proximityNumber', label: 'প্রক্সিমিটি নম্বর' },
    { name: 'grade', label: 'গ্রেড' }, { name: 'otCategory', label: 'ওভারটাইম ক্যাটাগরি' }, { name: 'wagesSchedule', label: 'মজুরি তফসিল' },
    { name: 'sectionLine', label: 'সেকশন/লাইন' }, { name: 'designation', label: 'পদবি' }, { name: 'department', label: 'বিভাগ' },
    { name: 'joiningDate', label: 'যোগদানের তারিখ' },
  ],
  salary: [{ name: 'grossSalary', label: 'মাসিক বেতন (মোট)' }],
  education: [],
  experience: [],
  nominee: [
    { name: 'nomineeName', label: 'নমিনির নাম' }, { name: 'nomineeRelation', label: 'সম্পর্ক' }, { name: 'nomineeNid', label: 'নমিনির এনআইডি' },
    { name: 'nomineeDob', label: 'নমিনির জন্ম তারিখ' }, { name: 'nomineePercentage', label: 'অংশের শতাংশ' }, { name: 'nomineeEducation', label: 'নমিনির শিক্ষা' },
    { name: 'nomineeProfession', label: 'নমিনির পেশা' }, { name: 'nomineePhone', label: 'নমিনির মোবাইল' }, { name: 'nomineeVillage', label: 'নমিনির গ্রাম' },
    { name: 'nomineePostOffice', label: 'নমিনির ডাকঘর' }, { name: 'nomineeThana', label: 'নমিনির থানা' }, { name: 'nomineeDistrict', label: 'নমিনির জেলা' },
  ],
  reference: [],
};
const SECTION_OF: Record<string, SectionKey> = {};
(Object.keys(REQUIRED) as SectionKey[]).forEach(k => REQUIRED[k].forEach(f => { SECTION_OF[f.name] = k; }));
const ALL_REQUIRED = (Object.keys(REQUIRED) as SectionKey[]).flatMap(k => REQUIRED[k]);

const PRESENT_PERM = ['HouseNo', 'Union', 'Village', 'PostOffice', 'Thana', 'District', 'Division'];

const GENDER: Opt[] = [{ value: 'Male', label: 'পুরুষ' }, { value: 'Female', label: 'নারী' }, { value: 'Other', label: 'তৃতীয় লিঙ্গ' }];
const MARITAL: Opt[] = [{ value: 'Single', label: 'অবিবাহিত' }, { value: 'Married', label: 'বিবাহিত' }, { value: 'Divorced', label: 'তালাকপ্রাপ্ত' }];
const BLOOD: Opt[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => ({ value: g, label: g }));
const OT_CAT: Opt[] = [{ value: 'Elegible', label: 'Elegible' }, { value: 'নন ওভারটাইম', label: 'নন ওভারটাইম' }];
const SCHEDULE: Opt[] = [{ value: 'তফসিল-ক', label: 'তফসিল-ক' }, { value: 'তফসিল-খ', label: 'তফসিল-খ' }, { value: 'তফসিল-বহির্ভূত', label: 'তফসিল-বহির্ভূত' }];

// ── Styles (scoped by the epf- prefix) ───────────────────────────────────────

const FONT = "'Segoe UI', 'Noto Sans Bengali', system-ui, sans-serif";
const NAVY = '#1e3a5f';
const ACCENT = '#2563eb';

const CSS = `
  .epf { font-family: ${FONT}; color: #0f172a; display: flex; flex-direction: column; gap: 14px; width: 100%; }
  .epf * { box-sizing: border-box; }

  /* header card */
  .epf-hero { display: grid; grid-template-columns: 210px minmax(0,1fr); gap: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
  .epf-hero-main { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
  .epf-name { font-size: 20px; font-weight: 800; color: ${NAVY}; line-height: 1.25; word-break: break-word; }
  .epf-name.empty { color: #94a3b8; font-weight: 600; }
  .epf-meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .epf-tag { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 2px 10px; font-size: 12px; color: #334155; }
  .epf-prog { margin-top: auto; }
  .epf-prog-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 12.5px; color: #475569; margin-bottom: 5px; }
  .epf-prog-top b { font-size: 18px; color: ${NAVY}; }
  .epf-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .epf-bar > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f59e0b, #22c55e); transition: width .3s; }
  .epf-miss-btn { margin-top: 8px; background: none; border: none; padding: 0; color: ${ACCENT}; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; text-align: left; }
  .epf-miss { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow: auto; }
  .epf-chip { border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 999px; padding: 2px 10px; font: inherit; font-size: 11.5px; cursor: pointer; }
  .epf-chip:hover { background: #fee2e2; }
  .epf-ok { color: #15803d; font-size: 12.5px; font-weight: 600; margin-top: 8px; }

  /* section bar */
  .epf-nav { position: sticky; top: 0; z-index: 12; background: rgba(248,250,252,.96); backdrop-filter: blur(4px); border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 9px; display: flex; gap: 6px; align-items: center; overflow-x: auto; }
  .epf-pill { flex: none; display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; background: transparent; border-radius: 999px; padding: 5px 11px; font: inherit; font-size: 12.5px; color: #475569; cursor: pointer; white-space: nowrap; }
  .epf-pill:hover { background: #eef2f7; }
  .epf-pill.on { background: ${NAVY}; color: #fff; }
  .epf-dot { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; }
  .epf-dot.done { background: #22c55e; } .epf-dot.part { background: #f59e0b; }
  .epf-collapse { margin-left: auto; flex: none; background: none; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px 10px; font: inherit; font-size: 12px; color: #475569; cursor: pointer; }

  /* section cards */
  .epf-sec { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 3px rgba(15,23,42,.05); scroll-margin-top: 64px; overflow: hidden; }
  .epf-sec-h { width: 100%; display: flex; align-items: center; gap: 11px; padding: 12px 16px; background: linear-gradient(180deg,#f8fafc,#f1f5f9); border: none; border-bottom: 1px solid #e2e8f0; cursor: pointer; font: inherit; text-align: left; }
  .epf-sec.closed .epf-sec-h { border-bottom-color: transparent; }
  .epf-no { flex: none; width: 26px; height: 26px; border-radius: 50%; background: ${NAVY}; color: #fff; font-size: 12.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .epf-sec-t, .epf-sec-s { display: block; }
  .epf-sec-t { font-size: 14.5px; font-weight: 800; color: ${NAVY}; }
  .epf-sec-s { font-size: 11.5px; color: #64748b; margin-top: 1px; }
  .epf-sec-r { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .epf-count { font-size: 11.5px; font-weight: 700; border-radius: 999px; padding: 2px 10px; background: #fef3c7; color: #92400e; white-space: nowrap; }
  .epf-count.done { background: #dcfce7; color: #166534; }
  .epf-caret { color: #64748b; font-size: 12px; transition: transform .15s; }
  .epf-sec.closed .epf-caret { transform: rotate(-90deg); }
  .epf-body { padding: 16px; }
  .epf-sub { font-size: 12.5px; font-weight: 800; color: ${NAVY}; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 1px dashed #cbd5e1; }
  .epf-sub:first-child { margin-top: 0; }

  /* fields */
  .epf-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 13px 16px; }
  .epf-grid.two { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .epf-f { min-width: 0; } .epf-f.s2 { grid-column: span 2; } .epf-f.s3 { grid-column: span 3; } .epf-f.s4 { grid-column: 1 / -1; }
  .epf-l { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
  .epf-req { color: #dc2626; margin-left: 3px; font-weight: 800; }
  .epf-in { width: 100%; height: 34px; padding: 5px 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #0f172a; font: inherit; font-size: 13.5px; outline: none; transition: border-color .12s, box-shadow .12s; }
  textarea.epf-in { height: auto; resize: vertical; line-height: 1.5; padding: 8px 10px; }
  .epf-in:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  .epf-in.bad { border-color: #dc2626; background: #fff7f7; }
  .epf-in.ro { background: #f1f5f9; color: #64748b; cursor: default; }
  .epf-err { margin-top: 3px; font-size: 11.5px; color: #dc2626; font-weight: 600; }
  .epf-hint { margin-top: 3px; font-size: 11px; color: #94a3b8; }

  /* address */
  .epf-addr { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 22px; }
  .epf-addr-h { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
  .epf-sw { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: #334155; cursor: pointer; }
  .epf-sw input { width: 16px; height: 16px; accent-color: ${ACCENT}; cursor: pointer; }
  .epf-btn { border: 1px solid ${ACCENT}; background: #eff6ff; color: ${ACCENT}; border-radius: 8px; padding: 5px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; }
  .epf-btn:hover { background: #dbeafe; }

  /* notices */
  .epf-warn { margin-top: 14px; display: flex; gap: 9px; align-items: flex-start; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 9px 12px; }
  .epf-info { margin: 0 0 14px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 10px; padding: 8px 12px; font-size: 12.5px; }

  /* tables */
  .epf-tw { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
  .epf-t { width: 100%; border-collapse: collapse; font-size: 13px; }
  .epf-t th { background: #f1f5f9; color: #475569; font-size: 11.5px; font-weight: 700; padding: 8px 10px; text-align: left; white-space: nowrap; border-bottom: 1px solid #e2e8f0; }
  .epf-t td { padding: 0; border-bottom: 1px solid #edf2f7; border-right: 1px solid #edf2f7; }
  .epf-t td.c { padding: 4px 8px; text-align: center; color: #94a3b8; font-size: 12px; }
  .epf-t tr:nth-child(even) td { background: #fafbfd; }
  .epf-t input { width: 100%; padding: 8px 10px; border: none; outline: none; background: transparent; font: inherit; font-size: 13px; color: #0f172a; }
  .epf-t input:focus { background: #eff6ff; }
  .epf-t input[readonly] { color: #64748b; background: #f1f5f9; cursor: default; }
  .epf-x { background: none; border: none; color: #dc2626; font-size: 14px; font-weight: 700; cursor: pointer; padding: 4px 8px; }
  .epf-tb { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .epf-tb-title { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 800; color: ${NAVY}; }
  .epf-badge { background: #e0e7ff; color: #3730a3; border-radius: 999px; padding: 1px 9px; font-size: 11.5px; font-weight: 700; }
  .epf-search { width: 210px; height: 32px; padding: 4px 12px; border: 1px solid #cbd5e1; border-radius: 999px; font: inherit; font-size: 13px; outline: none; background: #fff; }
  .epf-search:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
  .epf-tb-count { font-size: 12px; color: #64748b; }
  .epf-tb-gap { flex: 1; }
  .epf-btn.ghost { background: #fff; border-color: #cbd5e1; color: #334155; }
  .epf-btn.ghost:hover, .epf-btn.ghost.on { background: #eff6ff; border-color: ${ACCENT}; color: ${ACCENT}; }
  .epf-btn.solid { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
  .epf-btn.solid:hover { background: #1d4ed8; }
  .epf-btn:disabled { opacity: .5; cursor: not-allowed; }
  .epf-paste { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
  .epf-paste-help { font-size: 12.5px; color: #1e3a5f; line-height: 1.6; }
  .epf-paste textarea { font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; }
  .epf-paste-act { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .epf-note { font-size: 12.5px; font-weight: 600; }
  .epf-note.ok { color: #15803d; } .epf-note.bad { color: #b91c1c; }
  .epf-empty { padding: 22px !important; text-align: center; color: #94a3b8; font-size: 13px; }

  @media (max-width: 1100px) { .epf-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } .epf-f.s3 { grid-column: span 2; } }
  @media (max-width: 720px) {
    .epf-hero { grid-template-columns: 1fr; } .epf-addr { grid-template-columns: 1fr; }
    .epf-grid, .epf-grid.two { grid-template-columns: 1fr; } .epf-f.s2, .epf-f.s3 { grid-column: auto; } .epf-sec-s { display: none; }
  }
`;

// ── Small helpers ────────────────────────────────────────────────────────────

const toText = (v: unknown): string => String(v ?? '');

function Section({ id, no, title, sub, done, total, open, onToggle, children }: {
  id: string; no: number; title: string; sub: string; done: number; total: number; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  const complete = total > 0 && done >= total;
  return (
    <section id={`sec-${id}`} className={`epf-sec${open ? '' : ' closed'}`} aria-labelledby={`sec-h-${id}`}>
      <button type="button" className="epf-sec-h" onClick={onToggle} aria-expanded={open}>
        <span className="epf-no">{no}</span>
        <span style={{ minWidth: 0 }}><span id={`sec-h-${id}`} className="epf-sec-t">{title}</span><span className="epf-sec-s">{sub}</span></span>
        <span className="epf-sec-r">
          {total > 0 && <span className={`epf-count${complete ? ' done' : ''}`}>{complete ? '✓ সম্পূর্ণ' : `${done}/${total} আবশ্যক`}</span>}
          <span className="epf-caret" aria-hidden="true">▼</span>
        </span>
      </button>
      {open && <div className="epf-body">{children}</div>}
    </section>
  );
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toEnDigits = (v: string) => v.replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
const normText = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');

/** dd-mm-yyyy, dd/mm/yyyy or yyyy-mm-dd (Bangla digits allowed) → yyyy-mm-dd, or '' when it is not a date. */
function toIsoDate(raw: string): string {
  const t = toEnDigits(raw.trim());
  const two = (n: string) => n.padStart(2, '0');
  let m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${two(m[2])}-${two(m[1])}`;
  m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${two(m[2])}-${two(m[3])}`;
  return '';
}

/** Previous-job rows: start date = end date minus the years of service (only when both are known). */
function withAutoStart(row: Record<string, unknown>): Record<string, unknown> {
  if (!('prevEndDate' in row) || !('prevServiceYears' in row)) return row;
  const years = parseFloat(toText(row.prevServiceYears));
  const endStr = toText(row.prevEndDate);
  if (!endStr || isNaN(years) || years <= 0) return row;
  const end = new Date(endStr);
  if (isNaN(end.getTime())) return row;
  end.setFullYear(end.getFullYear() - Math.floor(years));
  end.setMonth(end.getMonth() - Math.round((years % 1) * 12));
  return { ...row, prevStartDate: end.toISOString().split('T')[0] };
}

interface TableField<T> { key: keyof T; label: string; placeholder: string; type?: string; width?: string; auto?: boolean }

/** Education / experience table: search, add, remove, and "Paste from Excel" (header row skipped, new rows on top). */
function ArrayTable<T extends { id: string }>({ entries, fields, blankEntry, onChange, addLabel, title }: {
  entries: T[]; fields: TableField<T>[]; blankEntry: () => T; onChange: (entries: T[]) => void; addLabel: string; title: string;
}) {
  const [query, setQuery] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { if (entries.length === 0) onChange([blankEntry()]); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const rec = (row: T) => row as unknown as Record<string, unknown>;
  const cell = (row: T, key: keyof T) => toText(rec(row)[String(key)]);
  const isBlank = (row: T) => fields.every(f => !cell(row, f.key).trim());
  const pasteCols = fields.filter(f => !f.auto);   // computed columns (start date) are not part of the Excel order

  const updateCell = (rowId: string, key: keyof T, value: string) => {
    onChange(entries.map(row => {
      if (row.id !== rowId) return row;
      let next: Record<string, unknown> = { ...rec(row), [String(key)]: value };
      if (String(key) === 'prevEndDate' || String(key) === 'prevServiceYears') next = withAutoStart(next);
      return next as unknown as T;
    }));
  };
  const removeRow = (rowId: string) => { const next = entries.filter(r => r.id !== rowId); onChange(next.length ? next : [blankEntry()]); };
  const addRow = () => { setQuery(''); onChange([blankEntry(), ...entries]); };

  const importRows = () => {
    const lines = pasteText.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '');
    if (!lines.length) { setNote({ ok: false, text: 'কিছু পেস্ট করা হয়নি — Excel থেকে সারি কপি করে এখানে পেস্ট করুন।' }); return; }
    let rows = lines.map(l => l.split('\t'));
    const headerWords = new Set(fields.flatMap(f => [normText(f.label), normText(String(f.key))]));
    const hadHeader = rows[0].some(c => headerWords.has(normText(c)));
    if (hadHeader) rows = rows.slice(1);

    let badDates = 0;
    const made: T[] = [];
    rows.forEach(cells => {
      if (cells.every(c => !c.trim())) return;
      let next: Record<string, unknown> = { ...rec(blankEntry()) };
      pasteCols.forEach((f, i) => {
        const raw = (cells[i] ?? '').trim();
        if (f.type === 'date') {
          const iso = raw ? toIsoDate(raw) : '';
          if (raw && !iso) badDates += 1;
          next = { ...next, [String(f.key)]: iso };
        } else {
          next = { ...next, [String(f.key)]: raw };
        }
      });
      made.push(withAutoStart(next) as unknown as T);
    });

    if (!made.length) { setNote({ ok: false, text: 'কোনো ডেটা সারি পাওয়া যায়নি।' }); return; }
    onChange([...made, ...entries.filter(r => !isBlank(r))]);
    setPasteText('');
    setQuery('');
    setNote({ ok: true, text: `${made.length} টি সারি উপরে যোগ হয়েছে${hadHeader ? ' (হেডার সারি বাদ দেওয়া হয়েছে)' : ''}${badDates ? ` — ${badDates} টি তারিখ পড়া যায়নি, ফাঁকা রাখা হয়েছে` : ''}।` });
  };

  const q = normText(query);
  const shown = entries.map((row, i) => ({ row, i })).filter(({ row }) => !q || fields.some(f => normText(cell(row, f.key)).includes(q)));
  const filled = entries.filter(r => !isBlank(r)).length;
  if (entries.length === 0) return null;

  return (
    <div>
      <div className="epf-tb">
        <div className="epf-tb-title">{title}<span className="epf-badge">{filled}</span></div>
        <input className="epf-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="খুঁজুন…" aria-label={`${title} খুঁজুন`} />
        <span className="epf-tb-count">{shown.length} / {entries.length} সারি</span>
        <span className="epf-tb-gap" />
        <button type="button" className={`epf-btn ghost${pasteOpen ? ' on' : ''}`} onClick={() => { setPasteOpen(o => !o); setNote(null); }} aria-expanded={pasteOpen}>Excel থেকে পেস্ট</button>
        <button type="button" className="epf-btn solid" onClick={addRow}>+ {addLabel}</button>
      </div>

      {pasteOpen && (
        <div className="epf-paste">
          <div className="epf-paste-help">
            Excel থেকে সারি কপি করে এখানে পেস্ট করুন। কলামের ক্রম:{' '}
            {pasteCols.map((f, i) => <span key={String(f.key)}>{i > 0 && ' · '}<b>{f.label}</b></span>)}.
            {' '}হেডার সারি নিজে থেকে বাদ যায়; নতুন সারি উপরে যোগ হয়।{fields.some(f => f.auto) ? ' শুরুর তারিখ শেষ তারিখ ও বছর থেকে স্বয়ংক্রিয় হয়।' : ''} তারিখ DD-MM-YYYY লেখা যাবে।
          </div>
          <textarea className="epf-in" rows={5} value={pasteText} onChange={e => { setPasteText(e.target.value); setNote(null); }} placeholder="এখানে Ctrl+V চাপুন…" aria-label="Excel থেকে কপি করা সারি" />
          <div className="epf-paste-act">
            <button type="button" className="epf-btn solid" onClick={importRows} disabled={!pasteText.trim()}>সারি যোগ করুন</button>
            {note && <span className={`epf-note${note.ok ? ' ok' : ' bad'}`} role="status">{note.text}</span>}
          </div>
        </div>
      )}

      <div className="epf-tw">
        <table className="epf-t">
          <thead><tr><th style={{ width: 44 }}>SL</th>{fields.map(f => <th key={String(f.key)} style={{ width: f.width }}>{f.label}</th>)}<th style={{ width: 44 }} aria-label="মুছুন" /></tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={fields.length + 2} className="epf-empty">কোনো সারি মেলেনি</td></tr>}
            {shown.map(({ row, i }) => (
              <tr key={row.id}>
                <td className="c">{i + 1}</td>
                {fields.map(f => (
                  <td key={String(f.key)}>
                    <input type={f.type ?? 'text'} value={cell(row, f.key)} onChange={e => updateCell(row.id, f.key, e.target.value)}
                      placeholder={f.auto ? 'স্বয়ংক্রিয়' : f.placeholder} readOnly={f.auto} aria-label={`${f.label} — সারি ${i + 1}`} />
                  </td>
                ))}
                <td className="c"><button type="button" className="epf-x" onClick={() => removeRow(row.id)} aria-label={`${i + 1} নং সারি মুছুন`}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── The form ─────────────────────────────────────────────────────────────────

const EmployeeForm: React.FC<EmployeeFormProps> = ({ formData, handleInputChange, setFormData, onDirtyChange, photo, onPhotoChange }) => {
  const fd = formData as unknown as Record<string, unknown>;
  const val = (name: string) => toText(fd[name]);

  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<SectionKey>('personal');
  const [showMissing, setShowMissing] = useState(false);
  const [sameAddr, setSameAddr] = useState<boolean>(() =>
    PRESENT_PERM.every(p => val(`present${p}`) === val(`permanent${p}`)) && Boolean(val('presentVillage').trim()));

  const isOpen = (k: string) => !closed[k];
  const markDirty = () => onDirtyChange?.(true);
  const change = (e: FieldChange) => { handleInputChange(e); markDirty(); };
  const patch = (p: Record<string, string>) => { setFormData(prev => ({ ...prev, ...p })); markDirty(); };

  // A field is flagged only after the person has been in it and left it empty.
  const onBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (name) setTouched(prev => (prev.has(name) ? prev : new Set(prev).add(name)));
  };

  // ── progress ──
  const filledOf = (k: SectionKey) => REQUIRED[k].filter(f => val(f.name).trim()).length;
  const totalFilled = ALL_REQUIRED.filter(f => val(f.name).trim()).length;
  const missing = ALL_REQUIRED.filter(f => !val(f.name).trim());
  const pct = Math.round((totalFilled / ALL_REQUIRED.length) * 100);

  const jump = (name: string) => {
    setClosed(c => ({ ...c, [SECTION_OF[name]]: false }));
    setTimeout(() => {
      const el = document.getElementById(`ef-${name}`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    }, 80);
  };
  const goSection = (k: SectionKey) => {
    setClosed(c => ({ ...c, [k]: false }));
    setTimeout(() => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  // highlight the section currently in view
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) setActive(en.target.id.replace('sec-', '') as SectionKey); });
    }, { rootMargin: '-15% 0px -70% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(`sec-${s.key}`); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // nominee address line (read-only) is composed from its four parts
  const nomVillage = val('nomineeVillage'), nomPostOffice = val('nomineePostOffice'), nomThana = val('nomineeThana'), nomDistrict = val('nomineeDistrict'), nomAddress = val('nomineeAddress');
  useEffect(() => {
    const composed = [nomVillage, nomPostOffice, nomThana, nomDistrict].filter(v => v.trim()).join(', ');
    if (composed !== nomAddress) setFormData(prev => ({ ...prev, nomineeAddress: composed }));
  }, [nomVillage, nomPostOffice, nomThana, nomDistrict, nomAddress, setFormData]);

  // ── one field ──
  const field = (name: string, label: string, o: FieldOpts = {}) => {
    const id = `ef-${name}`;
    const v = o.value ?? val(name);
    const invalid = Boolean(o.required && !o.disabled && !o.readOnly && touched.has(name) && !v.trim());
    const base = {
      id, name, disabled: o.disabled, 'aria-required': o.required || undefined, 'aria-invalid': invalid || undefined,
      className: `epf-in${invalid ? ' bad' : ''}${o.disabled || o.readOnly ? ' ro' : ''}`,
    };
    const onCh = o.onChange ?? change;
    return (
      <div key={name} className={`epf-f${o.span ? ` s${o.span}` : ''}`}>
        <label htmlFor={id} className="epf-l">{label}{o.required && <span className="epf-req" aria-hidden="true">*</span>}</label>
        {o.options ? (
          <select {...base} value={v} onChange={onCh}><option value="">নির্বাচন করুন</option>{o.options.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select>
        ) : o.textarea ? (
          <textarea rows={3} {...base} value={v} onChange={onCh} readOnly={o.readOnly} placeholder={o.placeholder ?? ''} />
        ) : (
          <input type={o.type ?? 'text'} {...base} value={v} onChange={onCh} readOnly={o.readOnly} placeholder={o.placeholder ?? ''} />
        )}
        {invalid && <div className="epf-err" role="alert">{label} আবশ্যক</div>}
        {o.hint && !invalid && <div className="epf-hint">{o.hint}</div>}
      </div>
    );
  };

  // ── address helpers ──
  const presentChange = (e: FieldChange) => {
    const { name, value } = e.target;
    handleInputChange(e); markDirty();
    if (sameAddr) patch({ [name.replace('present', 'permanent')]: value });
  };
  const toggleSame = (checked: boolean) => {
    setSameAddr(checked);
    if (checked) patch(Object.fromEntries(PRESENT_PERM.map(p => [`permanent${p}`, val(`present${p}`)])));
  };
  const addrField = (side: 'present' | 'permanent', part: string, label: string, required: boolean) => field(`${side}${part}`, label, {
    required, disabled: side === 'permanent' && sameAddr, onChange: side === 'present' ? presentChange : change, placeholder: label,
  });
  const addrBlock = (side: 'present' | 'permanent') => (
    <div role="group" aria-label={side === 'present' ? 'বর্তমান ঠিকানা' : 'স্থায়ী ঠিকানা'}>
      <div className="epf-addr-h">
        <span>{side === 'present' ? 'বর্তমান ঠিকানা' : 'স্থায়ী ঠিকানা'}</span>
        {side === 'permanent' && <label className="epf-sw"><input type="checkbox" checked={sameAddr} onChange={e => toggleSame(e.target.checked)} />বর্তমান ঠিকানার মতোই</label>}
      </div>
      <div className="epf-grid two">
        {addrField(side, 'HouseNo', 'বাড়ি / বাড়ি নং / রাস্তা', true)}
        {addrField(side, 'Union', 'ইউনিয়ন / পৌরসভা', false)}
        {addrField(side, 'Village', 'গ্রাম', true)}
        {addrField(side, 'PostOffice', 'ডাকঘর', true)}
        {addrField(side, 'Thana', 'থানা', true)}
        {addrField(side, 'District', 'জেলা', true)}
        {addrField(side, 'Division', 'বিভাগ', false)}
      </div>
    </div>
  );
  const copyNomineeFromPermanent = () => patch({
    nomineeVillage: val('permanentVillage'), nomineePostOffice: val('permanentPostOffice'),
    nomineeThana: val('permanentThana'), nomineeDistrict: val('permanentDistrict'),
  });

  // ── salary breakdown (same formula as before) ──
  const gross = parseFloat(val('grossSalary') || '0') || 0;
  const allow = (['medicalAllowance', 'transportAllowance', 'foodAllowance'] as const).reduce((s, k) => s + (parseFloat(val(k) || '0') || 0), 0);
  const basicSalary = useMemo(() => (gross > 0 ? ((gross - allow) / 1.5).toFixed(2) : ''), [gross, allow]);
  const houseRent = useMemo(() => (basicSalary ? (parseFloat(basicSalary) / 2).toFixed(2) : ''), [basicSalary]);

  // under-18 notice
  const underAge = useMemo(() => {
    if (!formData.joiningDate || !formData.dateOfBirth) return null;
    const dob = new Date(formData.dateOfBirth), join = new Date(formData.joiningDate);
    const bday = new Date(join.getFullYear(), dob.getMonth(), dob.getDate());
    const age = join.getFullYear() - dob.getFullYear() - (join < bday ? 1 : 0);
    return age < 18 ? age : null;
  }, [formData.joiningDate, formData.dateOfBirth]);

  const heroName = val('fullNameBengali') || val('fullName');
  const sectionDot = (k: SectionKey) => {
    const t = REQUIRED[k].length;
    if (!t) return '';
    const d = filledOf(k);
    return d >= t ? 'done' : d > 0 ? 'part' : '';
  };
  const allClosed = SECTIONS.every(s => closed[s.key]);

  return (
    <div className="epf" onBlurCapture={onBlurCapture}>
      <style>{CSS}</style>

      {/* ── header: photo + summary + progress ── */}
      <div className="epf-hero">
        <div><PhotoUploadField value={photo} onChange={dataUrl => { onPhotoChange?.(dataUrl); markDirty(); }} label="কর্মীর ছবি" /></div>
        <div className="epf-hero-main">
          <div className={`epf-name${heroName ? '' : ' empty'}`}>{heroName || 'নতুন কর্মী — নাম লিখুন'}</div>
          <div className="epf-meta">
            {val('cardNo') && <span className="epf-tag">কার্ড: {val('cardNo')}</span>}
            {val('designation') && <span className="epf-tag">{val('designation')}</span>}
            {val('department') && <span className="epf-tag">{val('department')}</span>}
            {val('joiningDate') && <span className="epf-tag">যোগদান: {val('joiningDate')}</span>}
          </div>
          <div className="epf-prog">
            <div className="epf-prog-top"><span>আবশ্যক তথ্য পূরণ ({totalFilled}/{ALL_REQUIRED.length})</span><b>{pct}%</b></div>
            <div className="epf-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
            {missing.length === 0 ? (
              <div className="epf-ok">✓ সব আবশ্যক তথ্য পূরণ হয়েছে — প্রিন্ট ডকুমেন্টের জন্য প্রস্তুত</div>
            ) : (
              <>
                <button type="button" className="epf-miss-btn" onClick={() => setShowMissing(s => !s)} aria-expanded={showMissing}>
                  {showMissing ? '▾' : '▸'} এখনও বাকি আছে ({missing.length}) — ক্লিক করলে ঘরে নিয়ে যাবে
                </button>
                {showMissing && <div className="epf-miss">{missing.map(m => <button key={m.name} type="button" className="epf-chip" onClick={() => jump(m.name)}>{m.label}</button>)}</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── section bar ── */}
      <nav className="epf-nav" aria-label="ফর্মের অংশসমূহ">
        {SECTIONS.map((s, i) => (
          <button key={s.key} type="button" className={`epf-pill${active === s.key ? ' on' : ''}`} onClick={() => goSection(s.key)}>
            <span className={`epf-dot ${sectionDot(s.key)}`} />{i + 1}. {s.title}
          </button>
        ))}
        <button type="button" className="epf-collapse" onClick={() => setClosed(allClosed ? {} : Object.fromEntries(SECTIONS.map(s => [s.key, true])))}>
          {allClosed ? 'সব খুলুন' : 'সব বন্ধ করুন'}
        </button>
      </nav>

      <div className="epf-info">সংরক্ষণ করতে ন্যূনতম <b>নাম</b> ও <b>যোগদানের তারিখ</b> লাগবে। নিয়োগপত্র, নমিনি ফরম, মেডিকেল ফিটনেস ও যাচাইকরণ ফরমে ব্যবহৃত ঘরগুলো <span className="epf-req">*</span> চিহ্নিত।</div>

      {SECTIONS.map((s, i) => {
        const sec = (children: ReactNode) => (
          <Section key={s.key} id={s.key} no={i + 1} title={s.title} sub={s.sub} done={filledOf(s.key)} total={REQUIRED[s.key].length}
            open={isOpen(s.key)} onToggle={() => setClosed(c => ({ ...c, [s.key]: !c[s.key] }))}>{children}</Section>
        );
        switch (s.key) {
          case 'personal': return sec(
            <div className="epf-grid">
              {field('fullName', 'পূর্ণ নাম (ইংরেজি)', { required: true, span: 2, placeholder: 'Full Name' })}
              {field('fullNameBengali', 'পূর্ণ নাম (বাংলা)', { required: true, span: 2, placeholder: 'বাংলা নাম' })}
              {field('fatherName', 'পিতার নাম', { required: true, span: 2 })}
              {field('motherName', 'মাতার নাম', { required: true, span: 2 })}
              {field('dateOfBirth', 'জন্ম তারিখ', { required: true, type: 'date' })}
              {field('gender', 'লিঙ্গ', { required: true, options: GENDER })}
              {field('bloodGroup', 'রক্তের গ্রুপ', { required: true, options: BLOOD })}
              {field('maritalStatus', 'বৈবাহিক অবস্থা', { options: MARITAL })}
              {field('nationality', 'জাতীয়তা', { placeholder: 'যেমন: বাংলাদেশি' })}
              {field('religion', 'ধর্ম', { placeholder: 'যেমন: ইসলাম' })}
              {field('height', 'উচ্চতা (ইঞ্চি/সে:মি:)', { required: true, placeholder: 'যেমন: 65' })}
              {field('weight', 'ওজন (কেজি)', { required: true, placeholder: 'যেমন: 60' })}
              {field('nid', 'জাতীয় পরিচয়পত্র নং', { placeholder: 'NID নম্বর' })}
              {field('birthRegistrationNo', 'জন্ম নিবন্ধন নং')}
              {field('passportNumber', 'পাসপোর্ট নং')}
              {field('drivingLicense', 'ড্রাইভিং লাইসেন্স নং')}
              {field('identificationMark', 'সনাক্তকরণ চিহ্ন', { required: true, span: 2 })}
            </div>);
          case 'family': return sec(
            <div className="epf-grid">
              {field('spouseName', 'স্বামী/স্ত্রীর নাম', { required: true, span: 2 })}
              {field('spouseDob', 'স্বামী/স্ত্রীর জন্ম তারিখ', { type: 'date' })}
              {field('spouseBloodGroup', 'রক্তের গ্রুপ')}
              {field('spouseProfession', 'পেশা')}
              {field('spousePhone', 'মোবাইল', { type: 'tel' })}
              {field('spouseEducation', 'শিক্ষাগত যোগ্যতা')}
              {field('numberOfSons', 'পুত্র সন্তান', { type: 'number', placeholder: 'সংখ্যা' })}
              {field('numberOfDaughters', 'কন্যা সন্তান', { type: 'number', placeholder: 'সংখ্যা' })}
            </div>);
          case 'contact': return sec(<>
            <div className="epf-sub">যোগাযোগ</div>
            <div className="epf-grid">
              {field('mobile', 'মোবাইল নম্বর', { type: 'tel', placeholder: '01700000000' })}
              {field('email', 'ইমেইল ঠিকানা', { type: 'email', span: 2, placeholder: 'email@example.com' })}
              {field('onnano', 'অন্যান্য যোগাযোগ')}
            </div>
            <div className="epf-sub">ঠিকানা</div>
            <div className="epf-addr">{addrBlock('present')}{addrBlock('permanent')}</div>
            <div className="epf-sub">জরুরি যোগাযোগ</div>
            <div className="epf-grid">
              {field('emergencyName', 'নাম', { span: 2 })}
              {field('emergencyRelation', 'সম্পর্ক')}
              {field('emergencyMobile', 'মোবাইল নম্বর', { type: 'tel' })}
              {field('emergencyProfession', 'পেশা')}
            </div>
          </>);
          case 'employment': return sec(<>
            <div className="epf-grid">
              {field('idNo', 'আইডি নং', { required: true })}
              {field('cardNo', 'কার্ড নং', { required: true, placeholder: 'যেমন: EMP-0042' })}
              {field('proximityNumber', 'প্রক্সিমিটি নম্বর', { required: true })}
              {field('grade', 'গ্রেড', { required: true })}
              {field('otCategory', 'ওভারটাইম ক্যাটাগরি', { required: true, options: OT_CAT })}
              {field('wagesSchedule', 'মজুরি তফসিল', { required: true, options: SCHEDULE })}
              {field('sectionLine', 'সেকশন/লাইন', { required: true })}
              {field('designation', 'পদবি', { required: true })}
              {field('department', 'বিভাগ', { required: true })}
              {field('joiningDate', 'যোগদানের তারিখ', { required: true, type: 'date' })}
              {field('attendanceBonus', 'হাজিরা বোনাস', { type: 'number', disabled: true })}
              {field('jobSource', 'নিয়োগ সূত্র')}
            </div>
            {underAge !== null && (
              <div className="epf-warn" role="alert" aria-live="assertive">
                <span style={{ fontSize: 16, lineHeight: 1 }}>🚫</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 13 }}>অপ্রাপ্তবয়স্ক — যোগদানের অনুমতি নেই</div>
                  <div style={{ color: '#7f1d1d', fontSize: 12, marginTop: 2 }}>যোগদানের তারিখে বয়স ছিল {underAge} বছর। বাংলাদেশ শ্রম আইন, ধারা ৩৪ অনুযায়ী ১৮ বছরের কম বয়সী কর্মী নিয়োগ নিষিদ্ধ।</div>
                </div>
              </div>
            )}
          </>);
          case 'salary': return sec(<>
            <div className="epf-sub">বেতন বিভাজন</div>
            <div className="epf-grid">
              {field('grossSalary', 'মাসিক বেতন (মোট) (৳)', { required: true, type: 'number', placeholder: 'মোট মাসিক বেতন' })}
              {field('medicalAllowance', 'চিকিৎসা ভাতা (৳)', { type: 'number', disabled: true })}
              {field('transportAllowance', 'যাতায়াত ভাতা (৳)', { type: 'number', disabled: true })}
              {field('foodAllowance', 'খাদ্য ভাতা (৳)', { type: 'number', disabled: true })}
              {field('basicSalaryCalc', 'মূল বেতন (৳)', { readOnly: true, value: basicSalary, placeholder: 'স্বয়ংক্রিয় হিসাব', hint: '(মোট − ভাতা) ÷ ১.৫' })}
              {field('houseRentCalc', 'বাড়ি ভাড়া (৳)', { readOnly: true, value: houseRent, placeholder: 'স্বয়ংক্রিয় হিসাব', hint: 'মূল বেতনের ৫০%' })}
            </div>
            <div className="epf-sub">টিন ও ব্যাংক</div>
            <div className="epf-grid">
              {field('tinNumber', 'টিন নম্বর')}
              {field('bankName', 'ব্যাংকের নাম')}
              {field('bankAccountNo', 'হিসাব নম্বর')}
              {field('bankBranch', 'শাখার নাম')}
            </div>
          </>);
          case 'education': return sec(
            <ArrayTable<EducationEntry>
              entries={formData.educationHistory}
              onChange={list => { setFormData(prev => ({ ...prev, educationHistory: list })); markDirty(); }}
              addLabel="নতুন যোগ্যতা"
              title="শিক্ষাগত যোগ্যতা"
              blankEntry={() => ({ id: generateEntryId(), education: '', institution: '', educationGroup: '', educationResult: '', educationBoard: '', passingYear: '' })}
              fields={[
                { key: 'education', label: 'শিক্ষাগত যোগ্যতা', placeholder: 'যেমন: এইচএসসি' },
                { key: 'institution', label: 'প্রতিষ্ঠানের নাম', placeholder: 'কলেজ/বিশ্ববিদ্যালয়' },
                { key: 'educationGroup', label: 'গ্রুপ / বিষয়', placeholder: 'যেমন: বিজ্ঞান' },
                { key: 'educationResult', label: 'ফলাফল / জিপিএ', placeholder: 'যেমন: GPA 4.50' },
                { key: 'educationBoard', label: 'বোর্ড / বিশ্ববিদ্যালয়', placeholder: 'যেমন: ঢাকা বোর্ড' },
                { key: 'passingYear', label: 'পাসের সন', placeholder: 'যেমন: ২০১৮', width: '90px' },
              ]} />);
          case 'experience': return sec(
            <ArrayTable<PreviousJobEntry>
              entries={formData.previousJobs}
              onChange={list => { setFormData(prev => ({ ...prev, previousJobs: list })); markDirty(); }}
              addLabel="নতুন অভিজ্ঞতা"
              title="পূর্ববর্তী চাকরি"
              blankEntry={() => ({ id: generateEntryId(), prevCompanyName: '', prevDesignation: '', prevSection: '', prevCompanyPhone: '', prevServiceYears: '', prevStartDate: '', prevEndDate: '', prevLeaveReason: '', prevRefDetails: '' })}
              fields={[
                { key: 'prevCompanyName', label: 'প্রতিষ্ঠানের নাম', placeholder: 'কোম্পানির নাম' },
                { key: 'prevDesignation', label: 'পদবি', placeholder: 'যেমন: অপারেটর' },
                { key: 'prevSection', label: 'সেকশন / বিভাগ', placeholder: 'যেমন: সুইং' },
                { key: 'prevServiceYears', label: 'চাকরির বছর', placeholder: 'যেমন: ২', width: '80px' },
                { key: 'prevEndDate', label: 'শেষ তারিখ', placeholder: 'তারিখ', type: 'date', width: '140px' },
                { key: 'prevStartDate', label: 'শুরুর তারিখ', placeholder: 'auto', width: '140px', auto: true },
                { key: 'prevCompanyPhone', label: 'প্রতিষ্ঠানের ফোন', placeholder: 'ফোন নম্বর' },
                { key: 'prevLeaveReason', label: 'ছাড়ার কারণ', placeholder: 'কারণ লিখুন' },
                { key: 'prevRefDetails', label: 'রেফারেন্স বিস্তারিত', placeholder: 'নাম, পদবি, ফোন' },
              ]} />);
          case 'nominee': return sec(<>
            <div className="epf-grid">
              {field('nomineeName', 'নমিনির নাম', { required: true, span: 2 })}
              {field('nomineeRelation', 'কর্মীর সাথে সম্পর্ক', { required: true })}
              {field('nomineePercentage', 'অংশের শতাংশ', { required: true, type: 'number', placeholder: '%' })}
              {field('nomineeNid', 'নমিনির এনআইডি', { required: true })}
              {field('nomineeDob', 'নমিনির জন্ম তারিখ', { required: true, type: 'date' })}
              {field('nomineeEducation', 'নমিনির শিক্ষা', { required: true })}
              {field('nomineeProfession', 'নমিনির পেশা', { required: true })}
              {field('nomineePhone', 'নমিনির মোবাইল', { required: true, type: 'tel' })}
              {field('nomineeBloodGroup', 'নমিনির রক্তের গ্রুপ')}
            </div>
            <div className="epf-addr-h" style={{ marginTop: 18 }}>
              <span>নমিনির ঠিকানা</span>
              <button type="button" className="epf-btn" onClick={copyNomineeFromPermanent}>স্থায়ী ঠিকানা থেকে নিন</button>
            </div>
            <div className="epf-grid">
              {field('nomineeVillage', 'গ্রাম', { required: true })}
              {field('nomineePostOffice', 'ডাকঘর', { required: true })}
              {field('nomineeThana', 'থানা', { required: true })}
              {field('nomineeDistrict', 'জেলা', { required: true })}
              {field('nomineeAddress', 'সম্পূর্ণ ঠিকানা (স্বয়ংক্রিয়)', { readOnly: true, span: 4, placeholder: 'গ্রাম/ডাকঘর/থানা/জেলা পূরণ করলে এখানে আসবে' })}
            </div>
          </>);
          case 'reference': return sec(
            <div className="epf-grid">
              {field('supervisorName', 'সুপারিশকারীর নাম', { span: 2 })}
              {field('supervisorOrg', 'প্রতিষ্ঠানের নাম', { span: 2 })}
              {field('supervisorDesignation', 'পদবি')}
              {field('supervisorProfession', 'পেশা')}
              {field('supervisorPhone', 'মোবাইল নম্বর', { type: 'tel' })}
              {field('supervisorRelation', 'সম্পর্ক')}
              {field('supervisorAddress', 'ঠিকানা', { span: 4, textarea: true, placeholder: 'সম্পূর্ণ ঠিকানা লিখুন' })}
            </div>);
          default: return null;
        }
      })}
    </div>
  );
};

export default EmployeeForm;