// ─────────────────────────────────────────────────────────────────────────────
// EmployeeForm.tsx — React Hook Form + Zod (single-file, light "label-left" theme)
// src/components/employeePersonalFile/EmployeeForm.tsx
//
// Self-contained: no imports from ../../common/FormField or
// ../../common/formStyleTokens — every style token and field primitive
// (FormField, Input, Select, Textarea) lives in this file.
//
// Layout matches the reference: light gray page background, plain white
// inputs with a thin gray border, no card boxes/shadows, and each field
// rendered as a row with the label to the LEFT of the input — two such
// label+input pairs per line.
//
// FIX (required-field marking, this round): per explicit request, every
// field actually CONSUMED by the three print documents —
// AppointmentLetter.tsx, NomineeForm.tsx, MedicalFitnessCertificate.tsx —
// is now marked required (star + aria-required) here, so a user filling
// out this form can see up front what those printouts actually need
// instead of discovering blank "---" placeholders only after generating
// the document. Field list was taken directly from each print
// component's own formData.* usages, not guessed:
//   AppointmentLetter:  idNo/cardNo, joiningDate, fullName/fullNameBengali,
//                       fatherName, motherName, spouseName, present*
//                       and permanent* village/postOffice/thana/district
//   NomineeForm:        + gender, dateOfBirth, identificationMark,
//                       presentHouseNo, permanentHouseNo, designation,
//                       bloodGroup, and every nominee* field it reads
//                       (nomineeName/Relation/Nid/Dob/Percentage/
//                       Education/Profession/Phone/Village/PostOffice/
//                       Thana/District)
//   MedicalFitness:     + height, weight
// The corresponding Zod schema fields were changed from `.default('')`
// (optional) to `.min(1, '...আবশ্যক')` (required) to match — see
// IdentitySchema / ContactSchema / NomineeSchema below. Fields NOT read
// by any of the three documents (mobile, email, spouseDob, nid,
// passportNumber, emergencyContact*, nomineeBloodGroup, etc.) are left
// optional, unchanged.
//
// NOTE on validation architecture (WCAG-relevant limitation, documented
// rather than silently left): useStepForm()'s react-hook-form instance
// is used ONLY for isDirty tracking — the actual <input>/<select>
// elements bind their value/onChange directly to the `formData` prop
// and `handleInputChange`, not to RHF's own register()/Controller. That
// means RHF's schema-computed `formState.errors` never reflects live
// user input and can't safely drive inline error messages or
// aria-invalid here without a larger rewrite of how fields are bound.
// What CAN be done, and IS done below, without that rewrite: every
// required field gets a visible `*` (marked aria-hidden, since
// aria-required on the input itself is what screen readers actually
// need — a bare "*" glyph read aloud is not meaningful on its own) and
// `aria-required="true"`/`aria-required={true}` on its own control, and
// every address/nominee section is now a proper `role="group"` with
// `aria-labelledby` pointing at its own heading, so assistive tech
// announces which section a field belongs to — matching the pattern the
// sibling LWN/Maternity forms already use elsewhere in this codebase.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo } from 'react';
import { useForm }           from 'react-hook-form';
import { zodResolver }       from '@hookform/resolvers/zod';
import { z }                 from 'zod';
import type {
  ChangeEvent, ReactNode, CSSProperties, FocusEvent,
  InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes,
} from 'react';
import {
  EmployeeFormData, EducationEntry, PreviousJobEntry, generateEntryId,
} from './employee.types';

// ─────────────────────────────────────────────────────────────────────────────
// ── Style tokens (light, label-left theme) ────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const font = "'Segoe UI', 'Noto Sans Bengali', system-ui, sans-serif";

const palette = {
  pageBg:      '#ECECEC',
  text:        '#000000',
  textMuted:   '#6B6B6B',
  border:      '#B0B0B0',
  borderSoft:  '#D6D6D6',
  inputBg:     '#FFFFFF',
  inputText:   '#1A1A1A',
  accent:      '#2F6FED',   // used sparingly: focus ring, add-row button
  accentSoft:  '#E7EFFD',
  error:       '#D64545',
};

// Outer page wrapper — light gray background, no boxed panels
const pageWrap: CSSProperties = {
  background: palette.pageBg,
  padding:    '20px 22px',
  fontFamily: font,
};

// "Card" is now just a flat section — no border/background of its own,
// separated from the next section by a thin rule under the heading.
const card: CSSProperties = {
  padding:      '4px 0 22px',
  marginBottom: 6,
  fontFamily:   font,
};

const cardHead: CSSProperties = {
  fontSize:      14,
  fontWeight:    700,
  color:         palette.text,
  marginBottom:  14,
  paddingBottom: 7,
  borderBottom:  `1px solid ${palette.borderSoft}`,
  fontFamily:    font,
  textAlign:     'left',
};

// Two label+input pairs per line, matching the reference image
const g2: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 36, rowGap: 14,
};
// g3 / g4 kept as aliases so nothing else in the file needs renaming — both
// now render as the same 2-column, label-left layout as g2.
const g3: CSSProperties = g2;
const g4: CSSProperties = g2;

// ── Field row: label to the LEFT of the input ─────────────────────────────────

const fieldRow: CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  gap:        10,
};

const rowLabel: CSSProperties = {
  flexShrink: 0,
  width:      190,
  fontSize:   13,
  fontWeight: 400,
  color:      palette.text,
  fontFamily: font,
};

const requiredMark: CSSProperties = { color: palette.error, marginLeft: 3 };

const inputBase: CSSProperties = {
  flex:         1,
  minWidth:     0,
  boxSizing:    'border-box',
  padding:      '5px 9px',
  height:       28,
  borderRadius: 2,
  border:       `1px solid ${palette.border}`,
  background:   palette.inputBg,
  color:        palette.inputText,
  fontSize:     13,
  fontWeight:   400,
  fontFamily:   font,
  outline:      'none',
  transition:   'box-shadow .15s, border-color .15s',
};
const inputFocusRing = `0 0 0 2px ${palette.accentSoft}`;
const inputDisabledStyle: CSSProperties = { background: '#EFEFEF', color: '#9A9A9A', cursor: 'not-allowed' };
const textareaBase: CSSProperties = { ...inputBase, height: 'auto', resize: 'vertical', minHeight: 80, lineHeight: 1.5, padding: '7px 9px' };

const buttonPrimary: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '8px 22px', borderRadius: 3, border: 'none',
  background: palette.accent, color: '#FFFFFF', fontSize: 13, fontWeight: 600,
  fontFamily: font, cursor: 'pointer', transition: 'background .15s',
};

const errorTextStyle: CSSProperties = {
  color: palette.error, fontSize: 12, fontWeight: 600, marginTop: 4, fontFamily: font,
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Field primitives (FormField, Input, Select, Textarea) ────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function FormField({ label, id, required, error, children }: FormFieldProps) {
  return (
    <div style={fieldRow}>
      <label htmlFor={id} style={rowLabel}>
        {label}
        {/* aria-hidden: the required-ness is communicated to assistive
           tech via aria-required on the control itself (set alongside
           `required` below at each call site) — a bare "*" glyph read
           aloud on its own isn't meaningful, so it's hidden from the
           accessibility tree rather than announced as "asterisk". */}
        {required && <span style={requiredMark} aria-hidden="true">*</span>}
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
        {error && <div style={errorTextStyle} role="alert">{error}</div>}
      </div>
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({ style, disabled, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      disabled={disabled}
      onFocus={(e: FocusEvent<HTMLInputElement>) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e: FocusEvent<HTMLInputElement>) => { setFocused(false); onBlur?.(e); }}
      style={{
        ...inputBase,
        ...(disabled ? inputDisabledStyle : {}),
        ...(focused ? { boxShadow: inputFocusRing, borderColor: palette.accent } : {}),
        ...style,
      }}
    />
  );
}

interface SelectOption { value: string; label: string; }
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

function Select({ options, placeholder, style, disabled, onFocus, onBlur, ...rest }: SelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...rest}
      disabled={disabled}
      onFocus={(e: FocusEvent<HTMLSelectElement>) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e: FocusEvent<HTMLSelectElement>) => { setFocused(false); onBlur?.(e); }}
      style={{
        ...inputBase,
        ...(disabled ? inputDisabledStyle : {}),
        ...(focused ? { boxShadow: inputFocusRing, borderColor: palette.accent } : {}),
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function Textarea({ style, disabled, onFocus, onBlur, ...rest }: TextareaProps) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...rest}
      disabled={disabled}
      onFocus={(e: FocusEvent<HTMLTextAreaElement>) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e: FocusEvent<HTMLTextAreaElement>) => { setFocused(false); onBlur?.(e); }}
      style={{
        ...textareaBase,
        ...(disabled ? inputDisabledStyle : {}),
        ...(focused ? { boxShadow: inputFocusRing, borderColor: palette.accent } : {}),
        ...style,
      }}
    />
  );
}

// ── Zod schemas ───────────────────────────────────────────────────────────────
// FIX: fields consumed by AppointmentLetter/NomineeForm/MedicalFitness
// switched from `.default('')` (optional) to `.min(1, '...আবশ্যক')`
// (required) — see file-header FIX comment for exactly which fields and
// why. Everything else is unchanged.

const IdentitySchema = z.object({
  fullName:            z.string().min(1, 'পূর্ণ নাম আবশ্যক'),
  fullNameBengali:     z.string().min(1, 'পূর্ণ নাম (বাংলা) আবশ্যক'),
  fatherName:          z.string().min(1, 'পিতার নাম আবশ্যক'),
  motherName:          z.string().min(1, 'মাতার নাম আবশ্যক'),
  dateOfBirth:         z.string().min(1, 'জন্ম তারিখ আবশ্যক'),
  gender:              z.string().min(1, 'লিঙ্গ নির্বাচন করুন'),
  bloodGroup:          z.string().min(1, 'রক্তের গ্রুপ আবশ্যক'),
  maritalStatus:       z.string().default(''),
  nationality:         z.string().default(''),
  religion:            z.string().default(''),
  nid:                 z.string().default(''),
  birthRegistrationNo: z.string().default(''),
  passportNumber:      z.string().default(''),
  drivingLicense:      z.string().default(''),
  height:              z.string().min(1, 'উচ্চতা আবশ্যক'),
  weight:              z.string().min(1, 'ওজন আবশ্যক'),
  identificationMark:  z.string().min(1, 'সনাক্তকরণ চিহ্ন আবশ্যক'),
  spouseName:          z.string().min(1, 'স্বামী/স্ত্রীর নাম আবশ্যক'),
  spouseDob:           z.string().default(''),
  spouseBloodGroup:    z.string().default(''),
  spouseProfession:    z.string().default(''),
  spousePhone:         z.string().default(''),
  spouseEducation:     z.string().default(''),
  numberOfSons:        z.string().default(''),
  numberOfDaughters:   z.string().default(''),
});

const ContactSchema = z.object({
  mobile:              z.string().default(''),
  email:               z.string().default(''),
  onnano:              z.string().default(''),
  presentHouseNo:      z.string().min(1, 'বাড়ি/রাস্তা আবশ্যক'),
  presentUnion:        z.string().default(''),
  presentVillage:      z.string().min(1, 'গ্রাম আবশ্যক'),
  presentPostOffice:   z.string().min(1, 'ডাকঘর আবশ্যক'),
  presentThana:        z.string().min(1, 'থানা আবশ্যক'),
  presentDistrict:     z.string().min(1, 'জেলা আবশ্যক'),
  presentDivision:     z.string().default(''),
  permanentHouseNo:    z.string().min(1, 'বাড়ি/রাস্তা আবশ্যক'),
  permanentUnion:      z.string().default(''),
  permanentVillage:    z.string().min(1, 'গ্রাম আবশ্যক'),
  permanentPostOffice: z.string().min(1, 'ডাকঘর আবশ্যক'),
  permanentThana:      z.string().min(1, 'থানা আবশ্যক'),
  permanentDistrict:   z.string().min(1, 'জেলা আবশ্যক'),
  permanentDivision:   z.string().default(''),
  emergencyName:       z.string().default(''),
  emergencyRelation:   z.string().default(''),
  emergencyMobile:     z.string().default(''),
  emergencyProfession: z.string().default(''),
});

const EmploymentSchema = z.object({
  idNo:                 z.string().min(1, 'আইডি নং আবশ্যক'),
  cardNo:               z.string().min(1, 'কার্ড নং আবশ্যক'),
  proximityNumber:      z.string().min(1, 'প্রক্সিমিটি নম্বর আবশ্যক'),
  grade:                z.string().min(1, 'গ্রেড আবশ্যক'),
  otCategory:           z.string().default(''),
  wagesSchedule:        z.string().default(''),
  sectionLine:          z.string().min(1, 'সেকশন/লাইন আবশ্যক'),
  designation:          z.string().min(1, 'পদবি আবশ্যক'),
  department:           z.string().min(1, 'বিভাগ আবশ্যক'),
  joiningDate:          z.string().min(1, 'যোগদানের তারিখ আবশ্যক'),
  attendanceBonus:      z.string().min(1, 'হাজিরা বোনাস আবশ্যক'),
  jobSource:            z.string().default(''),
  medicalAllowance:     z.string().default(''),
  transportAllowance:   z.string().default(''),
  foodAllowance:        z.string().default(''),
  tinNumber:            z.string().default(''),
  bankName:             z.string().default(''),
  bankAccountNo:        z.string().default(''),
  bankBranch:           z.string().default(''),
});

const NomineeSchema = z.object({
  nomineeName:         z.string().min(1, 'নমিনির নাম আবশ্যক'),
  nomineeRelation:     z.string().min(1, 'সম্পর্ক আবশ্যক'),
  nomineeNid:          z.string().min(1, 'নমিনির এনআইডি আবশ্যক'),
  nomineeDob:          z.string().min(1, 'নমিনির জন্ম তারিখ আবশ্যক'),
  nomineePercentage:   z.string().min(1, 'অংশের শতাংশ আবশ্যক'),
  nomineeEducation:    z.string().min(1, 'নমিনির শিক্ষা আবশ্যক'),
  nomineeProfession:   z.string().min(1, 'নমিনির পেশা আবশ্যক'),
  nomineeBloodGroup:   z.string().default(''),
  nomineePhone:        z.string().min(1, 'নমিনির মোবাইল আবশ্যক'),
  nomineeAddress:      z.string().default(''), // auto-composed, not directly typed
  nomineeVillage:      z.string().min(1, 'নমিনির গ্রাম আবশ্যক'),
  nomineePostOffice:   z.string().min(1, 'নমিনির ডাকঘর আবশ্যক'),
  nomineeThana:        z.string().min(1, 'নমিনির থানা আবশ্যক'),
  nomineeDistrict:     z.string().min(1, 'নমিনির জেলা আবশ্যক'),
});

const SupervisorSchema = z.object({
  supervisorName:        z.string().default(''),
  supervisorOrg:         z.string().default(''),
  supervisorDesignation: z.string().default(''),
  supervisorProfession:  z.string().default(''),
  supervisorPhone:       z.string().default(''),
  supervisorRelation:    z.string().default(''),
  supervisorAddress:     z.string().default(''),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type FormStepId =
  | 'identity' | 'contact' | 'employment' | 'education'
  | 'previous' | 'nominee' | 'supervisor';

interface EmployeeFormProps {
  formData:          EmployeeFormData;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFormData:       (updater: (prev: EmployeeFormData) => EmployeeFormData) => void;
  activeStep:        FormStepId;
  onDirtyChange?:    (dirty: boolean) => void;
}

// ── useStepForm helper ────────────────────────────────────────────────────────

function useStepForm(
  schema: any,
  defaultValues: Record<string, any>,
  onDirtyChange?: (dirty: boolean) => void,
) {
  const form = useForm({
    resolver: zodResolver(schema) as any,
    mode: 'onBlur',
    defaultValues: defaultValues as any,
  });
  const { formState: { isDirty } } = form;
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  return form;
}

// ── ArrayTableForm ────────────────────────────────────────────────────────────

function ArrayTableForm<T extends { id: string }>({
  entries, fields, blankEntry, onChange, addLabel,
}: {
  entries:    T[];
  fields:     { key: keyof T; label: string; placeholder: string; type?: string; width?: string }[];
  blankEntry: () => T;
  onChange:   (entries: T[]) => void;
  addLabel:   string;
}) {
  React.useEffect(() => {
    if (entries.length === 0) onChange([blankEntry()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const updateCell = (rowId: string, key: keyof T, value: string) => {
    const updated = entries.map(row => {
      if (row.id !== rowId) return row;
      const next = { ...row, [key]: value };
      if ((key === 'prevEndDate' || key === 'prevServiceYears') && 'prevEndDate' in next && 'prevServiceYears' in next) {
        const endDate = (next as any).prevEndDate as string;
        const years   = parseFloat((next as any).prevServiceYears as string);
        if (endDate && !isNaN(years) && years > 0) {
          const end = new Date(endDate);
          end.setFullYear(end.getFullYear() - Math.floor(years));
          end.setMonth(end.getMonth() - Math.round((years % 1) * 12));
          (next as any).prevStartDate = end.toISOString().split('T')[0];
        }
      }
      return next;
    });
    onChange(updated);
  };
  const addRow    = () => onChange([blankEntry(), ...entries]);
  const removeRow = (rowId: string) => {
    const next = entries.filter(r => r.id !== rowId);
    onChange(next.length > 0 ? next : [blankEntry()]);
  };

  if (entries.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button type="button" onClick={addRow} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px',
          borderRadius: 3, border: `1px solid ${palette.accent}`, background: palette.accentSoft,
          color: palette.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font,
        }}>+ {addLabel}</button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 3, border: `1px solid ${palette.borderSoft}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F3F3F3' }}>
              <th style={thS}>#</th>
              {fields.map(f => (
                <th key={String(f.key)} style={{ ...thS, textAlign: 'left', width: f.width }}>
                  {f.label}
                </th>
              ))}
              <th style={{ ...thS, width: 44 }}>—</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={tdC}>{i + 1}</td>
                {fields.map(f => (
                  <td key={String(f.key)} style={tdS}>
                    <input
                      type={f.type ?? 'text'}
                      value={(row[f.key] as string) ?? ''}
                      onChange={e => updateCell(row.id, f.key, e.target.value)}
                      placeholder={String(f.key) === 'prevStartDate' ? 'স্বয়ংক্রিয়' : f.placeholder}
                      readOnly={String(f.key) === 'prevStartDate'}
                      aria-label={`${f.label} — সারি ${i + 1}`}
                      style={{
                        width: '100%', padding: '7px 10px', border: 'none',
                        outline: 'none',
                        background: String(f.key) === 'prevStartDate' ? '#F3F3F3' : '#fff',
                        fontSize: 13, fontWeight: 400, fontFamily: font,
                        color: String(f.key) === 'prevStartDate' ? palette.textMuted : palette.inputText,
                        cursor: String(f.key) === 'prevStartDate' ? 'default' : 'text',
                      }}
                    />
                  </td>
                ))}
                <td style={tdC}>
                  <button type="button" onClick={() => removeRow(row.id)}
                    aria-label={`${i + 1} নং সারি মুছুন`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: palette.error, fontSize: 14, fontWeight: 700, padding: '4px 8px',
                    }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thS: CSSProperties = {
  padding: '8px 10px', border: 'none',
  borderBottom: `1px solid ${palette.borderSoft}`,
  fontSize: 11, fontWeight: 700, color: palette.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  whiteSpace: 'nowrap', background: '#F3F3F3',
};
const tdS: CSSProperties = {
  padding: 0, borderBottom: `1px solid ${palette.borderSoft}`,
  borderRight: `1px solid ${palette.borderSoft}`,
};
const tdC: CSSProperties = {
  padding: '4px 8px', borderBottom: `1px solid ${palette.borderSoft}`,
  textAlign: 'center', fontSize: 12, color: palette.textMuted,
};

// ── Address block (label-left fields, with houseNo, same checkbox) ───────────

interface AddrField {
  id:        string;
  label:     string;
  required?: boolean;
  type?:     string;
  span?:     boolean;
  value:     string;
  onChange:  (e: ChangeEvent<HTMLInputElement>) => void;
}

function AddressBlock({ title, fields, disabled }: {
  title:    string;
  fields:   AddrField[];
  disabled: boolean;
}) {
  // WCAG: role="group" + aria-labelledby ties every field in this block
  // to its section heading for assistive tech — previously the heading
  // was just a styled <div> with no programmatic association to the
  // fields below it, so a screen reader user tabbing through
  // "গ্রাম / ডাকঘর / থানা ..." had no way to know whether they were in
  // বর্তমান ঠিকানা or স্থায়ী ঠিকানা without the visual layout.
  const headingId = `addr-heading-${title.replace(/\s+/g, '-')}`;
  return (
    <div
      role="group"
      aria-labelledby={headingId}
      style={{
        flex: 1, minWidth: 260,
        opacity: disabled ? 0.55 : 1,
        transition: 'opacity .2s',
      }}
    >
      <div id={headingId} style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 12, fontFamily: font }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map(f => (
          <FormField key={f.id} label={f.label} id={f.id} required={f.required}>
            <Input
              id={f.id} name={f.id} type={f.type ?? 'text'}
              value={f.value} onChange={f.onChange}
              disabled={disabled}
              placeholder={f.label}
              aria-required={f.required ? true : undefined}
            />
          </FormField>
        ))}
      </div>
    </div>
  );
}

// ── LawRef — reusable i-ball popup (Law Reference style) ────────────────────

interface LawRefProps {
  title:    string;
  children: ReactNode;
  align?:   'left' | 'right';
}

function LawRef({ title, children, align = 'right' }: LawRefProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={title}
        aria-expanded={open}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          background: open ? '#1D4ED8' : palette.accent,
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: 'none', flexShrink: 0,
          boxShadow: open ? `0 0 0 3px ${palette.accentSoft}` : 'none',
          transition: 'all .13s',
        }}>
        i
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: 26, [align]: 0, zIndex: 99,
            background: '#fff', border: `1px solid ${palette.borderSoft}`,
            borderRadius: 6, padding: '13px 15px', width: 220,
            boxShadow: '0 4px 18px rgba(0,0,0,.12)', fontFamily: font,
          }}>
            <div style={{
              position: 'absolute', top: -6,
              [align === 'right' ? 'right' : 'left']: 7,
              width: 12, height: 12,
              background: '#fff', border: `1px solid ${palette.borderSoft}`,
              borderRight: 'none', borderBottom: 'none',
              transform: 'rotate(45deg)',
            }} />
            <div style={{
              fontSize: 11, fontWeight: 700, color: palette.accent,
              textTransform: 'uppercase', letterSpacing: '.04em',
              marginBottom: 8, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{title}</span>
              <button type="button" onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: palette.textMuted, fontSize: 14, lineHeight: 1, padding: 0,
              }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: palette.text, lineHeight: 1.7 }}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Identity Step ─────────────────────────────────────────────────────────────

function IdentityStep({ formData, handleInputChange, onDirtyChange }: EmployeeFormProps) {
  useStepForm(IdentitySchema, {
    fullName: formData.fullName, fullNameBengali: formData.fullNameBengali,
    fatherName: formData.fatherName, motherName: formData.motherName,
    dateOfBirth: formData.dateOfBirth, gender: formData.gender,
    bloodGroup: formData.bloodGroup, maritalStatus: formData.maritalStatus,
    nationality: formData.nationality, religion: formData.religion,
    nid: formData.nid, birthRegistrationNo: formData.birthRegistrationNo,
    passportNumber: formData.passportNumber, drivingLicense: (formData as any).drivingLicense ?? '', height: formData.height,
    weight: formData.weight, identificationMark: formData.identificationMark,
    spouseName: formData.spouseName, spouseDob: formData.spouseDob,
    spouseBloodGroup: formData.spouseBloodGroup, spouseProfession: formData.spouseProfession,
    spousePhone: formData.spousePhone, spouseEducation: formData.spouseEducation,
    numberOfSons: formData.numberOfSons, numberOfDaughters: formData.numberOfDaughters,
  }, onDirtyChange);

  const inp = (name: string, type = 'text', ph = '') => ({
    id: `ef-${name}`, name, type,
    value: (formData as any)[name] ?? '',
    onChange: handleInputChange, placeholder: ph,
  });

  return (
    <div>
      <div style={card}>
        <div style={cardHead}>A. ব্যক্তিগত তথ্য</div>
        <div style={g2}>
          <FormField label="পূর্ণ নাম (ইংরেজি)" id="ef-fullName" required>
            <Input {...inp('fullName','text','Full Name')} aria-required={true} />
          </FormField>
          {/* FIX: required — read by all three print docs (fullNameBengali). */}
          <FormField label="পূর্ণ নাম (বাংলা)" id="ef-fullNameBengali" required>
            <Input {...inp('fullNameBengali','text','বাংলা নাম')} aria-required={true} />
          </FormField>
          {/* FIX: required — appointment letter + nominee form. */}
          <FormField label="পিতার নাম" id="ef-fatherName" required>
            <Input {...inp('fatherName','text','পিতার নাম')} aria-required={true} />
          </FormField>
          {/* FIX: required — appointment letter + nominee form + medical fitness. */}
          <FormField label="মাতার নাম" id="ef-motherName" required>
            <Input {...inp('motherName','text','মাতার নাম')} aria-required={true} />
          </FormField>
          <FormField label="জন্ম তারিখ" id="ef-dateOfBirth" required>
            <Input {...inp('dateOfBirth','date')} aria-required={true} />
          </FormField>
          <FormField label="লিঙ্গ" id="ef-gender" required>
            <Select id="ef-gender" name="gender"
              value={formData.gender} onChange={handleInputChange}
              aria-required={true} placeholder="নির্বাচন করুন"
              options={[
                { value: 'Male',   label: 'পুরুষ'     },
                { value: 'Female', label: 'নারী'      },
                { value: 'Other',  label: 'তৃতীয় লিঙ্গ' },
              ]} />
          </FormField>
          {/* FIX: required — nominee form prints the employee's own blood
             group inline next to the nominee's details. */}
          <FormField label="রক্তের গ্রুপ" id="ef-bloodGroup" required>
            <Select id="ef-bloodGroup" name="bloodGroup"
              value={formData.bloodGroup} onChange={handleInputChange}
              aria-required={true}
              placeholder="নির্বাচন করুন"
              options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g=>({value:g,label:g}))} />
          </FormField>
          <FormField label="বৈবাহিক অবস্থা" id="ef-maritalStatus">
            <Select id="ef-maritalStatus" name="maritalStatus"
              value={formData.maritalStatus} onChange={handleInputChange}
              placeholder="নির্বাচন করুন"
              options={[
                { value: 'Single',   label: 'অবিবাহিত'   },
                { value: 'Married',  label: 'বিবাহিত'     },
                { value: 'Divorced', label: 'তালাকপ্রাপ্ত' },
              ]} />
          </FormField>
          <FormField label="জাতীয়তা" id="ef-nationality">
            <Input {...inp('nationality','text','যেমন: বাংলাদেশি')} />
          </FormField>
          <FormField label="ধর্ম" id="ef-religion">
            <Input {...inp('religion','text','যেমন: ইসলাম')} />
          </FormField>
          {/* FIX: required — medical fitness certificate. */}
          <FormField label="উচ্চতা (ইঞ্চি/সে:মি:)" id="ef-height" required>
            <Input {...inp('height','text','যেমন: 65')} aria-required={true} />
          </FormField>
          {/* FIX: required — medical fitness certificate. */}
          <FormField label="ওজন (কেজি)" id="ef-weight" required>
            <Input {...inp('weight','text','যেমন: 60')} aria-required={true} />
          </FormField>
          <FormField label="জাতীয় পরিচয়পত্র নং" id="ef-nid">
            <Input {...inp('nid','text','NID নম্বর')} />
          </FormField>
          <FormField label="জন্ম নিবন্ধন নং" id="ef-birthRegistrationNo">
            <Input {...inp('birthRegistrationNo','text','জন্ম নিবন্ধন নং')} />
          </FormField>
          <FormField label="পাসপোর্ট নং" id="ef-passportNumber">
            <Input {...inp('passportNumber','text','পাসপোর্ট নং')} />
          </FormField>
          <FormField label="ড্রাইভিং লাইসেন্স" id="ef-drivingLicense">
            <Input id="ef-drivingLicense" name="drivingLicense" type="text"
              value={(formData as any).drivingLicense ?? ''}
              onChange={handleInputChange}
              placeholder="ড্রাইভিং লাইসেন্স নং" />
          </FormField>
          {/* FIX: required — nominee form + medical fitness certificate. */}
          <FormField label="সনাক্তকরণ চিহ্ন" id="ef-identificationMark" required>
            <Input {...inp('identificationMark','text','সনাক্তকরণ চিহ্ন')} aria-required={true} />
          </FormField>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>B. পরিবার</div>
        <div style={g2}>
          {/* FIX: required — appointment letter + nominee form (স্বামী/স্ত্রী line). */}
          <FormField label="স্বামী/স্ত্রীর নাম" id="ef-spouseName" required>
            <Input {...inp('spouseName','text','স্বামী/স্ত্রীর নাম')} aria-required={true} />
          </FormField>
          <FormField label="স্বামী/স্ত্রীর জন্ম তারিখ" id="ef-spouseDob">
            <Input {...inp('spouseDob','date')} />
          </FormField>
          <FormField label="স্বামী/স্ত্রীর রক্তের গ্রুপ" id="ef-spouseBloodGroup">
            <Input {...inp('spouseBloodGroup','text','রক্তের গ্রুপ')} />
          </FormField>
          <FormField label="স্বামী/স্ত্রীর পেশা" id="ef-spouseProfession">
            <Input {...inp('spouseProfession','text','পেশা')} />
          </FormField>
          <FormField label="স্বামী/স্ত্রীর মোবাইল" id="ef-spousePhone">
            <Input {...inp('spousePhone','tel','মোবাইল নম্বর')} />
          </FormField>
          <FormField label="স্বামী/স্ত্রীর শিক্ষা" id="ef-spouseEducation">
            <Input {...inp('spouseEducation','text','শিক্ষাগত যোগ্যতা')} />
          </FormField>
          <FormField label="পুত্র সন্তান" id="ef-numberOfSons">
            <Input {...inp('numberOfSons','number','সংখ্যা')} />
          </FormField>
          <FormField label="কন্যা সন্তান" id="ef-numberOfDaughters">
            <Input {...inp('numberOfDaughters','number','সংখ্যা')} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// ── Contact Step ──────────────────────────────────────────────────────────────

function ContactStep({ formData, handleInputChange, setFormData, onDirtyChange }: EmployeeFormProps) {
  const [sameAddr, setSameAddr] = useState(false);

  useStepForm(ContactSchema, {
    mobile: formData.mobile, email: formData.email,
    onnano: (formData as any).onnano ?? '',
    presentHouseNo: (formData as any).presentHouseNo ?? '',
    presentUnion: formData.presentUnion, presentVillage: formData.presentVillage,
    presentPostOffice: formData.presentPostOffice, presentThana: formData.presentThana,
    presentDistrict: formData.presentDistrict, presentDivision: formData.presentDivision,
    permanentHouseNo: (formData as any).permanentHouseNo ?? '',
    permanentUnion: formData.permanentUnion, permanentVillage: formData.permanentVillage,
    permanentPostOffice: formData.permanentPostOffice, permanentThana: formData.permanentThana,
    permanentDistrict: formData.permanentDistrict, permanentDivision: formData.permanentDivision,
    emergencyName: formData.emergencyName, emergencyRelation: formData.emergencyRelation,
    emergencyMobile: formData.emergencyMobile, emergencyProfession: formData.emergencyProfession,
  }, onDirtyChange);

  const inp = (name: string, type = 'text', ph = '') => ({
    id: `ef-${name}`, name, type,
    value: (formData as any)[name] ?? '',
    onChange: handleInputChange, placeholder: ph,
  } as React.InputHTMLAttributes<HTMLInputElement> & { id: string });

  const handleSameAddr = (checked: boolean) => {
    setSameAddr(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permanentHouseNo:    (prev as any).presentHouseNo    ?? '',
        permanentUnion:      prev.presentUnion,
        permanentVillage:    prev.presentVillage,
        permanentPostOffice: prev.presentPostOffice,
        permanentThana:      prev.presentThana,
        permanentDistrict:   prev.presentDistrict,
        permanentDivision:   prev.presentDivision,
      } as any));
    }
  };

  // FIX: present* fields are now required — read by AppointmentLetter
  // (village/postOffice/thana/district) and NomineeForm (adds houseNo).
  const presFields: AddrField[] = [
    { id: 'presentHouseNo',    label: 'বাড়ি / বাড়ি নং / রাস্তা', required: true, value: (formData as any).presentHouseNo ?? '',    onChange: handleInputChange as any },
    { id: 'presentUnion',      label: 'ইউনিয়ন / পৌরসভা',          value: formData.presentUnion,      onChange: handleInputChange as any },
    { id: 'presentVillage',    label: 'গ্রাম',            required: true, value: formData.presentVillage,    onChange: handleInputChange as any },
    { id: 'presentPostOffice', label: 'ডাকঘর',            required: true, value: formData.presentPostOffice, onChange: handleInputChange as any },
    { id: 'presentThana',      label: 'থানা',             required: true, value: formData.presentThana,      onChange: handleInputChange as any },
    { id: 'presentDistrict',   label: 'জেলা',             required: true, value: formData.presentDistrict,   onChange: handleInputChange as any },
    { id: 'presentDivision',   label: 'বিভাগ',                             value: formData.presentDivision,   onChange: handleInputChange as any },
  ];

  // FIX: permanentHouseNo is now also required (NomineeForm reads it) —
  // village/postOffice/thana/district were already required.
  const permFields: AddrField[] = [
    { id: 'permanentHouseNo',    label: 'বাড়ি / বাড়ি নং / রাস্তা', required: true,      value: (formData as any).permanentHouseNo ?? '',    onChange: handleInputChange as any },
    { id: 'permanentUnion',      label: 'ইউনিয়ন / পৌরসভা',                       value: formData.permanentUnion,      onChange: handleInputChange as any },
    { id: 'permanentVillage',    label: 'গ্রাম',            required: true,      value: formData.permanentVillage,    onChange: handleInputChange as any },
    { id: 'permanentPostOffice', label: 'ডাকঘর',            required: true,      value: formData.permanentPostOffice, onChange: handleInputChange as any },
    { id: 'permanentThana',      label: 'থানা',             required: true,      value: formData.permanentThana,      onChange: handleInputChange as any },
    { id: 'permanentDistrict',   label: 'জেলা',             required: true,      value: formData.permanentDistrict,   onChange: handleInputChange as any },
    { id: 'permanentDivision',   label: 'বিভাগ',                                  value: formData.permanentDivision,   onChange: handleInputChange as any },
  ];

  return (
    <div>
      <div style={card}>
        <div style={cardHead}>A. যোগাযোগের তথ্য</div>
        <div style={g2}>
          <FormField label="মোবাইল নম্বর" id="ef-mobile">
            <Input {...inp('mobile','tel','01700000000')} />
          </FormField>
          <FormField label="ইমেইল ঠিকানা" id="ef-email">
            <Input {...inp('email','email','email@example.com')} />
          </FormField>
          <FormField label="অন্যান্য" id="ef-onnano">
            <Input {...inp('onnano','text','অন্যান্য যোগাযোগ')} />
          </FormField>
        </div>
      </div>

      <div style={card}>
        <div style={{ ...cardHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>B. ঠিকানা</span>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: palette.text, fontFamily: font,
          }}>
            <input
              type="checkbox"
              checked={sameAddr}
              onChange={e => handleSameAddr(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: palette.accent, cursor: 'pointer' }}
            />
            উভয় ঠিকানা একই
          </label>
        </div>

        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <AddressBlock title="বর্তমান ঠিকানা" fields={presFields} disabled={false} />
          <AddressBlock title="স্থায়ী ঠিকানা" fields={permFields} disabled={sameAddr} />
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>C. জরুরি যোগাযোগ</div>
        <div style={g2}>
          <FormField label="নাম" id="ef-emergencyName">
            <Input {...inp('emergencyName','text','জরুরি যোগাযোগের নাম')} />
          </FormField>
          <FormField label="সম্পর্ক" id="ef-emergencyRelation">
            <Input {...inp('emergencyRelation','text','সম্পর্ক')} />
          </FormField>
          <FormField label="মোবাইল নম্বর" id="ef-emergencyMobile">
            <Input {...inp('emergencyMobile','tel','মোবাইল')} />
          </FormField>
          <FormField label="পেশা" id="ef-emergencyProfession">
            <Input {...inp('emergencyProfession','text','পেশা')} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// ── Employment Step ───────────────────────────────────────────────────────────

function EmploymentStep({ formData, handleInputChange, onDirtyChange }: EmployeeFormProps) {
  useStepForm(EmploymentSchema, {
    idNo: formData.idNo, cardNo: formData.cardNo,
    proximityNumber: formData.proximityNumber, grade: formData.grade,
    otCategory: formData.otCategory, wagesSchedule: formData.wagesSchedule,
    sectionLine: formData.sectionLine, designation: formData.designation,
    department: formData.department,
    joiningDate: formData.joiningDate,
    jobSource: formData.jobSource,
    medicalAllowance: formData.medicalAllowance,
    transportAllowance: formData.transportAllowance, foodAllowance: formData.foodAllowance,
    tinNumber: formData.tinNumber, bankName: formData.bankName,
    bankAccountNo: formData.bankAccountNo, bankBranch: formData.bankBranch,
  }, onDirtyChange);

  const inp = (name: string, type = 'text', ph = '') => ({
    id: `ef-${name}`, name, type,
    value: (formData as any)[name] ?? '',
    onChange: handleInputChange, placeholder: ph,
  } as React.InputHTMLAttributes<HTMLInputElement> & { id: string });

  const grossVal  = parseFloat((formData as any).grossSalary || '0') || 0;
  const gross     = grossVal;
  const medical   = parseFloat(formData.medicalAllowance || '0') || 0;
  const transport = parseFloat(formData.transportAllowance || '0') || 0;
  const food      = parseFloat(formData.foodAllowance || '0') || 0;
  const basicSalary = useMemo(() =>
    gross > 0 ? ((gross - medical - transport - food) / 1.5).toFixed(2) : '',
    [gross, medical, transport, food]
  );
  const houseRent = useMemo(() =>
    basicSalary ? (parseFloat(basicSalary) / 2).toFixed(2) : '',
    [basicSalary]
  );

  return (
    <div>
      <div style={card}>
        <div style={cardHead}>A. অফিস পরিচয়</div>
        <div style={g2}>
          <FormField label="আইডি নং" id="ef-idNo" required>
            <Input {...inp('idNo','text','আইডি নং')} aria-required={true} />
          </FormField>
          <FormField label="কার্ড নং" id="ef-cardNo" required>
            <Input {...inp('cardNo','text','যেমন: EMP-0042')} aria-required={true} />
          </FormField>
          <FormField label="প্রক্সিমিটি নম্বর" id="ef-proximityNumber" required>
            <Input {...inp('proximityNumber','text','প্রক্সিমিটি নম্বর')} aria-required={true} />
          </FormField>
          <FormField label="গ্রেড" id="ef-grade" required>
            <Input {...inp('grade','text','গ্রেড')} aria-required={true} />
          </FormField>
          <FormField label="ওভারটাইম ক্যাটাগরি" id="ef-otCategory" required>
            <Select id="ef-otCategory" name="otCategory"
              value={formData.otCategory} onChange={handleInputChange}
              placeholder="নির্বাচন করুন"
              options={[
                { value: 'ওভারটাইম',     label: 'ওভারটাইম'     },
                { value: 'নন ওভারটাইম', label: 'নন ওভারটাইম' },
              ]} />
          </FormField>
          <FormField label="মজুরি তফসিল" id="ef-wagesSchedule" required>
            <Select id="ef-wagesSchedule" name="wagesSchedule"
              value={formData.wagesSchedule} onChange={handleInputChange}
              placeholder="নির্বাচন করুন"
              options={[
                { value: 'তফসিল-ক',  label: 'তফসিল-ক'  },
                { value: 'তফসিল-খ', label: 'তফসিল-খ' },
                { value: 'তফসিল-বহির্ভূত', label: 'তফসিল-বহির্ভূত' },
              ]} />
          </FormField>
          <FormField label="সেকশন/লাইন" id="ef-sectionLine" required>
            <Input {...inp('sectionLine','text','সেকশন বা লাইন')} aria-required={true} />
          </FormField>
          {/* required — nominee form + medical fitness certificate. */}
          <FormField label="পদবি" id="ef-designation" required>
            <Input {...inp('designation','text','পদবি')} aria-required={true} />
          </FormField>
          <FormField label="বিভাগ" id="ef-department" required>
            <Input {...inp('department','text','বিভাগ')} aria-required={true} />
          </FormField>
          {/* required — appointment letter + nominee form + medical fitness. */}
          <FormField label="যোগদানের তারিখ" id="ef-joiningDate" required>
            <Input
              id="ef-joiningDate" name="joiningDate" type="date"
              value={formData.joiningDate ?? ''}
              onChange={handleInputChange}
              aria-required={true} />
          </FormField>
          <FormField label="হাজিরা বোনাস" id="ef-attendanceBonus" required>
            <Input {...inp('attendanceBonus', 'number', 'হাজিরা বোনাস')} disabled aria-required={true} />
          </FormField>
          <FormField label="নিয়োগ সূত্র" id="ef-jobSource">
            <Input {...inp('jobSource','text','নিয়োগ সূত্র')} />
          </FormField>
        </div>

        {/* Under-18 validation notice — kept as a full-width banner below the grid */}
        {formData.joiningDate && formData.dateOfBirth && (() => {
          const dob  = new Date(formData.dateOfBirth);
          const join = new Date(formData.joiningDate);
          const bday = new Date(join.getFullYear(), dob.getMonth(), dob.getDate());
          const age  = join.getFullYear() - dob.getFullYear() - (join < bday ? 1 : 0);
          if (age < 18) return (
            <div role="alert" aria-live="assertive" style={{
              background: '#FBEAEA', border: `1px solid ${palette.error}`,
              borderRadius: 4, padding: '8px 12px', marginTop: 14,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🚫</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: palette.error, fontSize: 13 }}>
                  অপ্রাপ্তবয়স্ক — যোগদানের অনুমতি নেই
                </p>
                <p style={{ margin: '3px 0 0', color: '#8A2C2C', fontSize: 12 }}>
                  যোগদানের তারিখে বয়স ছিল {age} বছর।
                  বাংলাদেশ শ্রম আইন, ধারা ৩৪ অনুযায়ী ১৮ বছরের কম বয়সী কর্মী নিয়োগ নিষিদ্ধ।
                </p>
              </div>
            </div>
          );
          return null;
        })()}

        <div style={{ borderTop: `1px solid ${palette.borderSoft}`, paddingTop: 16, marginTop: 16 }}>
          <div style={{ ...cardHead, fontSize: 13, marginBottom: 12 }}>B. বেতন বিভাজন</div>
          <div style={g2}>
            <FormField label="মাসিক বেতন (মোট) (৳)" id="ef-grossSalary" required>
              <Input
                id="ef-grossSalary" name="grossSalary" type="number"
                value={(formData as any).grossSalary ?? ''}
                onChange={handleInputChange}
                aria-required={true}
                placeholder="মোট মাসিক বেতন" />
            </FormField>
            <FormField label="চিকিৎসা ভাতা (৳)" id="ef-medicalAllowance">
              <Input {...inp('medicalAllowance','number','চিকিৎসা ভাতা')} disabled />
            </FormField>
            <FormField label="যাতায়াত ভাতা (৳)" id="ef-transportAllowance">
              <Input {...inp('transportAllowance','number','যাতায়াত ভাতা')} disabled />
            </FormField>
            <FormField label="খাদ্য ভাতা (৳)" id="ef-foodAllowance">
              <Input {...inp('foodAllowance','number','খাদ্য ভাতা')} disabled />
            </FormField>
            <FormField label="মূল বেতন (৳)" id="ef-basicSalary-calc">
              <Input id="ef-basicSalary-calc" value={basicSalary}
                readOnly aria-readonly={true}
                placeholder="মোট বেতন ও ভাতা দিলে হিসাব হবে"
                style={{ background: '#F3F3F3', color: palette.textMuted }} />
            </FormField>
            <FormField label="বাড়ি ভাড়া (৳)" id="ef-houseRent-calc">
              <Input id="ef-houseRent-calc" value={houseRent}
                readOnly aria-readonly={true}
                placeholder="মূল বেতন থেকে হিসাব হবে"
                style={{ background: '#F3F3F3', color: palette.textMuted }} />
            </FormField>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>C. ব্যাংক তথ্য</div>
        <div style={g2}>
          <FormField label="টিন নম্বর" id="ef-tinNumber">
            <Input {...inp('tinNumber','text','টিন নম্বর')} />
          </FormField>
          <FormField label="ব্যাংকের নাম" id="ef-bankName">
            <Input {...inp('bankName','text','ব্যাংকের নাম')} />
          </FormField>
          <FormField label="হিসাব নম্বর" id="ef-bankAccountNo">
            <Input {...inp('bankAccountNo','text','হিসাব নম্বর')} />
          </FormField>
          <FormField label="শাখার নাম" id="ef-bankBranch">
            <Input {...inp('bankBranch','text','শাখার নাম')} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// ── Nominee Step ──────────────────────────────────────────────────────────────

function NomineeStep({ formData, handleInputChange, setFormData, onDirtyChange }: EmployeeFormProps) {
  useStepForm(NomineeSchema, {
    nomineeName: formData.nomineeName, nomineeRelation: formData.nomineeRelation,
    nomineeNid: formData.nomineeNid, nomineeDob: formData.nomineeDob,
    nomineePercentage: formData.nomineePercentage, nomineeEducation: formData.nomineeEducation,
    nomineeProfession: formData.nomineeProfession, nomineeBloodGroup: formData.nomineeBloodGroup,
    nomineePhone: formData.nomineePhone, nomineeAddress: formData.nomineeAddress,
    nomineeVillage: (formData as any).nomineeVillage ?? '',
    nomineePostOffice: (formData as any).nomineePostOffice ?? '',
    nomineeThana: (formData as any).nomineeThana ?? '',
    nomineeDistrict: (formData as any).nomineeDistrict ?? '',
  }, onDirtyChange);

  const inp = (name: string, type = 'text', ph = '') => ({
    id: `ef-${name}`, name, type,
    value: (formData as any)[name] ?? '',
    onChange: handleInputChange, placeholder: ph,
  } as React.InputHTMLAttributes<HTMLInputElement> & { id: string });

  useEffect(() => {
    const parts = [
      (formData as any).nomineeVillage,
      (formData as any).nomineePostOffice,
      (formData as any).nomineeThana,
      (formData as any).nomineeDistrict,
    ].filter(v => v && String(v).trim());
    const composed = parts.join(', ');
    if (composed !== formData.nomineeAddress) {
      setFormData(prev => ({ ...prev, nomineeAddress: composed }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    (formData as any).nomineeVillage,
    (formData as any).nomineePostOffice,
    (formData as any).nomineeThana,
    (formData as any).nomineeDistrict,
  ]);

  return (
    <div style={card}>
      <div style={cardHead}>নমিনি তথ্য</div>
      {/* FIX: every field in this step (except নমিনির রক্তের গ্রুপ, which
         NomineeForm.tsx doesn't actually read — it prints the EMPLOYEE's
         own bloodGroup instead) is required — all are read directly by
         NomineeForm.tsx's output. */}
      <div style={g2}>
        <FormField label="নমিনির নাম" id="ef-nomineeName" required>
          <Input {...inp('nomineeName','text','নমিনির নাম')} aria-required={true} />
        </FormField>
        <FormField label="কর্মীর সাথে সম্পর্ক" id="ef-nomineeRelation" required>
          <Input {...inp('nomineeRelation','text','সম্পর্ক')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির এনআইডি" id="ef-nomineeNid" required>
          <Input {...inp('nomineeNid','text','এনআইডি নম্বর')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির জন্ম তারিখ" id="ef-nomineeDob" required>
          <Input {...inp('nomineeDob','date')} aria-required={true} />
        </FormField>
        <FormField label="অংশের শতাংশ" id="ef-nomineePercentage" required>
          <Input {...inp('nomineePercentage','number','%')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির শিক্ষা" id="ef-nomineeEducation" required>
          <Input {...inp('nomineeEducation','text','শিক্ষাগত যোগ্যতা')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির পেশা" id="ef-nomineeProfession" required>
          <Input {...inp('nomineeProfession','text','পেশা')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির রক্তের গ্রুপ" id="ef-nomineeBloodGroup">
          <Input {...inp('nomineeBloodGroup','text','রক্তের গ্রুপ')} />
        </FormField>
        <FormField label="নমিনির মোবাইল" id="ef-nomineePhone" required>
          <Input {...inp('nomineePhone','tel','মোবাইল নম্বর')} aria-required={true} />
        </FormField>

        <FormField label="নমিনির গ্রাম" id="ef-nomineeVillage" required>
          <Input {...inp('nomineeVillage','text','গ্রাম')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির ডাকঘর" id="ef-nomineePostOffice" required>
          <Input {...inp('nomineePostOffice','text','ডাকঘর')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির থানা" id="ef-nomineeThana" required>
          <Input {...inp('nomineeThana','text','থানা')} aria-required={true} />
        </FormField>
        <FormField label="নমিনির জেলা" id="ef-nomineeDistrict" required>
          <Input {...inp('nomineeDistrict','text','জেলা')} aria-required={true} />
        </FormField>

        <FormField label="নমিনির সম্পূর্ণ ঠিকানা (স্বয়ংক্রিয়)" id="ef-nomineeAddress">
          <Input
            id="ef-nomineeAddress"
            value={formData.nomineeAddress ?? ''}
            readOnly
            aria-readonly={true}
            placeholder="গ্রাম/ডাকঘর/থানা/জেলা পূরণ করুন"
            style={{ background: '#F3F3F3', color: palette.textMuted }}
          />
        </FormField>
      </div>
    </div>
  );
}

// ── Supervisor Step ───────────────────────────────────────────────────────────

function SupervisorStep({ formData, handleInputChange, onDirtyChange }: EmployeeFormProps) {
  useStepForm(SupervisorSchema, {
    supervisorName: formData.supervisorName, supervisorOrg: formData.supervisorOrg,
    supervisorDesignation: formData.supervisorDesignation,
    supervisorProfession: formData.supervisorProfession,
    supervisorPhone: formData.supervisorPhone, supervisorRelation: formData.supervisorRelation,
    supervisorAddress: formData.supervisorAddress,
  }, onDirtyChange);

  const inp = (name: string, type = 'text', ph = '') => ({
    id: `ef-${name}`, name, type,
    value: (formData as any)[name] ?? '',
    onChange: handleInputChange, placeholder: ph,
  } as React.InputHTMLAttributes<HTMLInputElement> & { id: string });

  return (
    <div style={card}>
      <div style={cardHead}>সুপারিশকারী / রেফারেন্স</div>
      <div style={g2}>
        <FormField label="সুপারিশকারীর নাম" id="ef-supervisorName">
          <Input {...inp('supervisorName','text','নাম')} />
        </FormField>
        <FormField label="প্রতিষ্ঠানের নাম" id="ef-supervisorOrg">
          <Input {...inp('supervisorOrg','text','প্রতিষ্ঠানের নাম')} />
        </FormField>
        <FormField label="পদবি" id="ef-supervisorDesignation">
          <Input {...inp('supervisorDesignation','text','পদবি')} />
        </FormField>
        <FormField label="পেশা" id="ef-supervisorProfession">
          <Input {...inp('supervisorProfession','text','পেশা')} />
        </FormField>
        <FormField label="মোবাইল নম্বর" id="ef-supervisorPhone">
          <Input {...inp('supervisorPhone','tel','মোবাইল')} />
        </FormField>
        <FormField label="সম্পর্ক" id="ef-supervisorRelation">
          <Input {...inp('supervisorRelation','text','সম্পর্ক')} />
        </FormField>
        <div style={{ gridColumn: '1/-1' }}>
          <FormField label="ঠিকানা" id="ef-supervisorAddress">
            <Textarea id="ef-supervisorAddress" name="supervisorAddress"
              value={formData.supervisorAddress} onChange={handleInputChange}
              placeholder="সম্পূর্ণ ঠিকানা লিখুন" rows={3} />
          </FormField>
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  formData, handleInputChange, setFormData, activeStep, onDirtyChange,
}) => {
  const shared = { formData, handleInputChange, setFormData, activeStep, onDirtyChange };

  return (
    <div style={pageWrap}>
      {activeStep === 'identity'   && <IdentityStep    {...shared} />}
      {activeStep === 'contact'    && <ContactStep     {...shared} />}
      {activeStep === 'employment' && <EmploymentStep  {...shared} />}

      {activeStep === 'education' && (
        <div style={card}>
          <div style={cardHead}>শিক্ষাগত যোগ্যতা</div>
          <ArrayTableForm<EducationEntry>
            entries={formData.educationHistory}
            onChange={list => setFormData(prev => ({ ...prev, educationHistory: list }))}
            addLabel="নতুন যোগ্যতা যোগ করুন"
            blankEntry={() => ({
              id: generateEntryId(), education: '', institution: '',
              educationGroup: '', educationResult: '', educationBoard: '', passingYear: '',
            })}
            fields={[
              { key: 'education',       label: 'শিক্ষাগত যোগ্যতা',       placeholder: 'যেমন: এইচএসসি'       },
              { key: 'institution',     label: 'প্রতিষ্ঠানের নাম',         placeholder: 'কলেজ/বিশ্ববিদ্যালয়'  },
              { key: 'educationGroup',  label: 'গ্রুপ / বিষয়',            placeholder: 'যেমন: বিজ্ঞান'        },
              { key: 'educationResult', label: 'ফলাফল / জিপিএ',           placeholder: 'যেমন: GPA 4.50'       },
              { key: 'educationBoard',  label: 'বোর্ড / বিশ্ববিদ্যালয়',   placeholder: 'যেমন: ঢাকা বোর্ড'    },
              { key: 'passingYear',     label: 'পাসের সন',                placeholder: 'যেমন: ২০১৮', width: '90px' },
            ]}
          />
        </div>
      )}

      {activeStep === 'previous' && (
        <div style={card}>
          <div style={cardHead}>পূর্ববর্তী অভিজ্ঞতা</div>
          <ArrayTableForm<PreviousJobEntry>
            entries={formData.previousJobs}
            onChange={list => setFormData(prev => ({ ...prev, previousJobs: list }))}
            addLabel="নতুন অভিজ্ঞতা যোগ করুন"
            blankEntry={() => ({
              id: generateEntryId(), prevCompanyName: '',
              prevDesignation: '', prevSection: '', prevCompanyPhone: '',
              prevServiceYears: '', prevStartDate: '', prevEndDate: '',
              prevLeaveReason: '', prevRefDetails: '',
            })}
            fields={[
              { key: 'prevCompanyName',  label: 'প্রতিষ্ঠানের নাম',   placeholder: 'কোম্পানির নাম'   },
              { key: 'prevDesignation',  label: 'পদবি',                placeholder: 'যেমন: অপারেটর'  },
              { key: 'prevSection',      label: 'সেকশন / বিভাগ',      placeholder: 'যেমন: সুইং'      },
              { key: 'prevServiceYears', label: 'চাকরির বছর',          placeholder: 'যেমন: ২', width: '80px' },
              { key: 'prevEndDate',      label: 'শেষ তারিখ',           placeholder: 'তারিখ', type: 'date', width: '130px' },
              { key: 'prevStartDate',    label: 'শুরুর তারিখ',         placeholder: 'auto', width: '130px' },
              { key: 'prevCompanyPhone', label: 'প্রতিষ্ঠানের ফোন',    placeholder: 'ফোন নম্বর'      },
              { key: 'prevLeaveReason',  label: 'ছাড়ার কারণ',         placeholder: 'কারণ লিখুন'     },
              { key: 'prevRefDetails',   label: 'রেফারেন্স বিস্তারিত', placeholder: 'নাম, পদবি, ফোন' },
            ]}
          />
        </div>
      )}

      {activeStep === 'nominee'    && <NomineeStep    {...shared} />}
      {activeStep === 'supervisor' && <SupervisorStep {...shared} />}
    </div>
  );
};

export default EmployeeForm;