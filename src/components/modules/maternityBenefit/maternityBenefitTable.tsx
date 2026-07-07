// ─────────────────────────────────────────────────────────────────────────────
// maternityBenefitTable.tsx
// Path: src/components/maternityBenefit/maternityBenefitTable.tsx
//
// Changes from original:
//  - CompanyInfoTable REMOVED (factory fills from context in ModuleShell header)
//  - Date fields MOVED from EmployeeInfoTable into ServiceDurationTable
//  - DatePillInput: local useState so digits show immediately; fires parent
//    onChange only when all 3 parts are complete; useEffect syncs back auto-dates
//  - maternityLeavenoticedDate added as editable date field
//  - maternityLeaveStartDate + maternityLeaveEndDate are readOnly (auto-calculated)
//  - Tailwind gradient decorations replaced with plain inline styles
//  - Imports from global types file (../../types/MaternityBenefitTypes)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import type { TableProps, CalculationTableProps, MaternityFormData } from './MaternityBenefitTypes';
import {
  STATIC_DATA,
  filterAvailableInstallments,
  getActiveInstallmentDraft,
} from './MaternityBenefitTypes';
import { MaternityFormula } from './MaternityFormula';
import { LAW_REFERENCES } from '../../common/Lawreferences';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const S = {
  section: (): React.CSSProperties => ({
    marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 10,
    overflow: 'hidden', background: '#fff',
  }),
  header: (): React.CSSProperties => ({
    background: '#0f2442', color: '#fff', padding: '10px 16px',
    fontSize: 13, fontWeight: 700, fontFamily: font,
    display: 'flex', alignItems: 'center', gap: 8,
  }),
  table: (): React.CSSProperties => ({
    width: '100%', borderCollapse: 'collapse' as const, fontFamily: font,
  }),
  labelCell: (): React.CSSProperties => ({
    background: '#f8fafc', borderRight: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0', padding: '8px 14px',
    fontWeight: 600, fontSize: 13, color: '#374151',
    width: '38%', whiteSpace: 'nowrap' as const,
  }),
  inputCell: (): React.CSSProperties => ({
    borderBottom: '1px solid #e2e8f0', padding: '6px 12px',
  }),
  input: (readOnly = false): React.CSSProperties => ({
    width: '100%', padding: '6px 10px',
    border: `1.5px solid ${readOnly ? '#e2e8f0' : '#d1d5db'}`,
    borderRadius: 7, fontSize: 13, fontFamily: font,
    background: readOnly ? '#f1f5f9' : '#fff',
    color: '#1e293b', outline: 'none', boxSizing: 'border-box' as const,
  }),
  select: (): React.CSSProperties => ({
    padding: '6px 10px', border: '1.5px solid #d1d5db', borderRadius: 7,
    fontSize: 13, fontFamily: font, background: '#fff',
    color: '#1e293b', outline: 'none', cursor: 'pointer',
  }),
  readonlyBox: (): React.CSSProperties => ({
    padding: '7px 12px', background: '#f1f5f9', border: '1.5px solid #e2e8f0',
    borderRadius: 7, fontSize: 14, fontWeight: 700, fontFamily: font,
    color: '#1e293b', textAlign: 'center' as const, minWidth: 72,
  }),
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <tr>
    <td style={S.labelCell()}>{label}</td>
    <td style={S.inputCell()}>{children}</td>
  </tr>
);

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <div style={S.header()}>
    <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
    {title}
  </div>
);

// ── Inject date grid CSS once ─────────────────────────────────────────────────

const DATE_STYLE_ID = 'mbf-date-section-styles';
const injectDateStyles = () => {
  if (typeof document === 'undefined' || document.getElementById(DATE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DATE_STYLE_ID;
  el.textContent = `
    .mbf-date-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
    .mbf-date-card { padding:12px 16px 14px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; background:#fff; box-sizing:border-box; min-width:0; }
    .mbf-date-card:nth-child(even) { border-right:none; }
    .mbf-date-card:nth-last-child(-n+2) { border-bottom:none; }
    .mbf-date-card.mbf-readonly { background:#fafbfc; }
    .mbf-date-card-label { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#374151; margin-bottom:9px; line-height:1.4; flex-wrap:wrap; }
    .mbf-date-card-label.mbf-readonly-label { color:#6b7280; }
    .mbf-auto-badge { font-size:10px; font-weight:600; color:#94a3b8; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:1px 5px; white-space:nowrap; flex-shrink:0; }
    .mbf-pill-row { display:flex; gap:6px; align-items:center; }
    .mbf-pill { flex:1; min-width:0; padding:8px 6px; border:1.5px solid #d1d5db; border-radius:50px; font-size:13px; background:#fff; color:#1e293b; outline:none; text-align:center; box-sizing:border-box; -moz-appearance:textfield; font-family:'Noto Sans Bengali',Arial,sans-serif; }
    .mbf-pill::placeholder { color:#9ca3af; font-size:11px; }
    .mbf-pill.mbf-pill-year { flex:1.5; }
    .mbf-pill.mbf-pill-readonly { border-color:#e2e8f0; background:#f1f5f9; color:#94a3b8; }
    .mbf-pill:not(.mbf-pill-readonly):focus { border-color:#0f2442; box-shadow:0 0 0 2px rgba(15,36,66,.08); }
    .mbf-pill::-webkit-outer-spin-button, .mbf-pill::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
    @media (max-width:767px) {
      .mbf-date-grid { grid-template-columns:1fr; }
      .mbf-date-card { border-right:none; border-bottom:1px solid #e2e8f0; }
      .mbf-date-card:nth-child(even) { border-right:none; }
      .mbf-date-card:nth-last-child(-n+2) { border-bottom:1px solid #e2e8f0; }
      .mbf-date-card:last-child { border-bottom:none !important; }
    }
    @media (max-width:479px) {
      .mbf-date-card { padding:10px 12px 14px; }
      .mbf-date-card-label { font-size:11px; margin-bottom:8px; }
      .mbf-pill { padding:9px 4px; font-size:13px; }
    }
  `;
  document.head.appendChild(el);
};

// ── DatePillInput ─────────────────────────────────────────────────────────────

interface DatePillProps {
  name:      keyof MaternityFormData;
  value:     string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const DatePillInput: React.FC<DatePillProps> = ({ name, value, onChange, readOnly = false }) => {
  const parse = (v: string) => {
    const p = v ? v.split('-') : ['', '', ''];
    return {
      year:  p[0] || '',
      month: p[1] ? String(parseInt(p[1], 10)) : '',
      day:   p[2] ? String(parseInt(p[2], 10)) : '',
    };
  };

  const [local, setLocal] = React.useState(() => parse(value));
  React.useEffect(() => { setLocal(parse(value)); }, [value]);

  const digitsOnly = (v: string) => v.replace(/[^0-9]/g, '');

  const handlePart = (field: 'day' | 'month' | 'year', raw: string) => {
    const digits = digitsOnly(raw);
    const next   = { ...local, [field]: digits };
    setLocal(next);
    if (!onChange) return;
    const { year: y, month: m, day: d } = next;
    if (y.length === 4 && m.length >= 1 && d.length >= 1) {
      const mNum = Math.min(Math.max(parseInt(m, 10), 1), 12);
      const dNum = Math.min(Math.max(parseInt(d, 10), 1), 31);
      onChange({
        target: { name: name as string, value: `${y}-${String(mNum).padStart(2,'0')}-${String(dNum).padStart(2,'0')}` },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const cls = `mbf-pill${readOnly ? ' mbf-pill-readonly' : ''}`;
  return (
    <div className="mbf-pill-row">
      <input type="text" inputMode="numeric" placeholder="দিন"  maxLength={2} value={local.day}   readOnly={readOnly} className={cls}                    onChange={readOnly ? undefined : e => handlePart('day',   e.target.value)} />
      <input type="text" inputMode="numeric" placeholder="মাস"  maxLength={2} value={local.month} readOnly={readOnly} className={cls}                    onChange={readOnly ? undefined : e => handlePart('month', e.target.value)} />
      <input type="text" inputMode="numeric" placeholder="বছর"  maxLength={4} value={local.year}  readOnly={readOnly} className={`${cls} mbf-pill-year`} onChange={readOnly ? undefined : e => handlePart('year',  e.target.value)} />
    </div>
  );
};

// ── 1. Employee Information Table ─────────────────────────────────────────────
// Date fields have been moved to ServiceDurationTable.
// CompanyInfoTable removed — factory auto-fills from context.

export const EmployeeInfoTable: React.FC<TableProps> = ({ formData, handleChange }) => (
  <div style={S.section()}>
    <SectionHeader title="কর্মীর অফিসিয়াল তথ্য" icon="ti-user-circle" />
    <table style={S.table()}>
      <colgroup><col style={{ width: '38%' }} /><col /></colgroup>
      <tbody>
        {([
          ['নাম',                  'employeeName'],
          ['কার্ড নং',             'cardNo'],
          ['পদবী / ক্যাটাগরি',    'designation'],
          ['সেকশন',               'section'],
          ['জীবিত সন্তান সংখ্যা', 'aliveChildren'],
        ] as [string, keyof MaternityFormData][]).map(([label, name]) => (
          <Row key={name} label={label}>
            <input name={name} value={formData[name] as string} onChange={handleChange} style={S.input()} />
          </Row>
        ))}
      </tbody>
    </table>
  </div>
);

// ── 2. Service Duration Table ─────────────────────────────────────────────────

export const ServiceDurationTable: React.FC<TableProps> = ({ formData, handleChange }) => {
  React.useEffect(() => { injectDateStyles(); }, []);

  const serviceYears  = parseInt(formData.serviceYears)  || 0;
  const serviceMonths = parseInt(formData.serviceMonths) || 0;
  const aliveChildren = parseInt(formData.aliveChildren) || 0;
  const eligibility   = MaternityFormula.checkCombinedEligibility(serviceYears, serviceMonths, aliveChildren);
  const isEligible    = eligibility === 'অধিকারী';

  const dateFields: [string, keyof MaternityFormData, boolean][] = [
    ['যোগদানের তারিখ',                  'joiningDate',             false],
    ['নোটিশের তারিখ',                   'maternityLeavenoticedDate', false],
    ['প্রসূতি লক্ষণের তারিখ',          'maternitySymptomDate',    false],
    ['সম্ভাব্য প্রসবের তারিখ',         'possibleDeliveryDate',    false],
    ['মাতৃত্বকালীন ছুটি শুরুর তারিখ', 'maternityLeaveStartDate',  true ],
    ['মাতৃত্বকালীন ছুটি শেষের তারিখ', 'maternityLeaveEndDate',    true ],
  ];

  return (
    <>
      {/* Date card grid */}
      <div style={S.section()}>
        <SectionHeader title="তারিখ সমূহ" icon="ti-calendar" />
        <div className="mbf-date-grid">
          {dateFields.map(([label, name, ro]) => (
            <div key={name} className={`mbf-date-card${ro ? ' mbf-readonly' : ''}`}>
              <div className={`mbf-date-card-label${ro ? ' mbf-readonly-label' : ''}`} style={{ fontFamily: font }}>
                {label}
                {ro && <span className="mbf-auto-badge">স্বয়ংক্রিয়</span>}
              </div>
              <DatePillInput name={name} value={formData[name] as string} onChange={ro ? undefined : handleChange} readOnly={ro} />
            </div>
          ))}
        </div>
      </div>

      {/* Service duration & eligibility */}
      <div style={S.section()}>
        <SectionHeader title="সেবার মেয়াদ ও যোগ্যতা যাচাই" icon="ti-calendar-stats" />
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const }}>
            {([['বছর','serviceYears'],['মাস','serviceMonths'],['দিন','serviceDays']] as [string, 'serviceYears' | 'serviceMonths' | 'serviceDays'][]).map(([label, name]) => (
              <div key={name} style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', fontFamily: font, marginBottom: 4, textTransform: 'uppercase' as const }}>{label}</div>
                <div style={S.readonlyBox()}>{formData[name] || '0'}</div>
              </div>
            ))}
            <div style={{ flex: 2, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', fontFamily: font, marginBottom: 4, textTransform: 'uppercase' as const }}>সুবিধা প্রাপ্তির ধরণ</div>
              <div style={{ padding: '7px 14px', borderRadius: 7, fontSize: 14, fontWeight: 700, fontFamily: font, textAlign: 'center' as const, border: `1.5px solid ${isEligible ? '#16a34a' : '#dc2626'}`, background: isEligible ? '#f0fdf4' : '#fef2f2', color: isEligible ? '#15803d' : '#b91c1c' }}>
                {eligibility || '—'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: font, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            যোগ্যতার শর্ত: ন্যূনতম ৬ মাস চাকরির মেয়াদ এবং জীবিত সন্তান সংখ্যা ১ বা তার কম।
          </div>
        </div>
      </div>
    </>
  );
};

// ── 3. Wage Table ─────────────────────────────────────────────────────────────

export const WageTable: React.FC<TableProps> = ({ formData, handleChange }) => {
  const serviceYears  = parseInt(formData.serviceYears)  || 0;
  const serviceMonths = parseInt(formData.serviceMonths) || 0;
  const aliveChildren = parseInt(formData.aliveChildren) || 0;
  const isEligible    = MaternityFormula.checkCombinedEligibility(serviceYears, serviceMonths, aliveChildren) === 'অধিকারী';
  const yearOptions   = MaternityFormula.getYearOptions();

  return (
    <div style={S.section()}>
      <SectionHeader title="সর্বশেষ ধার্যকৃত মোট মজুরির বিবরণ" icon="ti-cash" />
      <table style={S.table()}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ ...S.labelCell(), fontWeight: 700, fontSize: 12, textTransform: 'uppercase' as const }}>মাস - বছর</th>
            <th style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 14px', fontSize: 12, fontWeight: 700, textAlign: 'left' as const, fontFamily: font, color: '#374151', textTransform: 'uppercase' as const }}>মোট মজুরি (টাকা)</th>
            {isEligible && <th style={{ borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', padding: '8px 14px', fontSize: 12, fontWeight: 700, textAlign: 'left' as const, fontFamily: font, color: '#374151', textTransform: 'uppercase' as const }}>এক দিনের গড় মজুরি</th>}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.labelCell()}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                <select name="latestMonth" value={formData.latestMonth} onChange={handleChange} style={{ ...S.select(), flex: 1, minWidth: 90 }}>
                  <option value="">--মাস--</option>
                  {STATIC_DATA.bengaliMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select name="latestYear" value={formData.latestYear} onChange={handleChange} style={{ ...S.select(), width: 72 }}>
                  <option value="">বছর</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </td>
            <td style={S.inputCell()}>
              <input name="totalMonthlyWage" value={formData.totalMonthlyWage} onChange={handleChange} placeholder="0" style={{ ...S.input(), textAlign: 'right' as const, fontWeight: 700, fontSize: 15, maxWidth: 180 }} />
            </td>
            {isEligible && (
              <td style={{ ...S.inputCell(), borderLeft: '1px solid #e2e8f0' }}>
                <div style={{ padding: '6px 10px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 7, fontSize: 13, fontFamily: font, color: '#1d4ed8', fontWeight: 600 }}>
                  ({formData.totalMonthlyWage || '0'} ÷ 26) = {formData.dailyGross || '0'}
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>

  );
};

// ── 4. Benefit Calculation Table ──────────────────────────────────────────────
//
// Spec:
//  • বিলের তারিখ section REMOVED
//  • প্রসূতি কল্যাণ সুবিধা dropdown shows only UNPAID installment options
//  • REDESIGN (2nd round): salary/others now shown+editable for EVERY
//    installment (no more hiding for দ্বিতীয় কিস্তি) — each independently
//    empty until entered, per explicit request ("management can think in
//    both installment will provide salary or other").
//  • কিস্তি ব্যবস্থাপনা: READ-ONLY history table now — no ✏️/🗑. All
//    edits happen through these form fields + the main Save button.

export const BenefitCalculationTable: React.FC<CalculationTableProps> = ({
  formData,
  handleChange,
  calculateTotalPayable,
  onInstallmentFieldChange,
}) => {
  // ── derived booleans ──────────────────────────────────────────────────────
  const serviceYears  = parseInt(formData.serviceYears)  || 0;
  const serviceMonths = parseInt(formData.serviceMonths) || 0;
  const aliveChildren = parseInt(formData.aliveChildren) || 0;
  const isEligible    = MaternityFormula.checkCombinedEligibility(serviceYears, serviceMonths, aliveChildren) === 'অধিকারী';

  // AUDIT FIX (consolidation): inst1Paid/inst2Paid/isCombinedPaid/
  // bothPaidIndividually and the availableOptions filter used to be
  // computed inline here, completely independently of the same rules
  // needed by maternityBenefit.tsx's recordToFormData() — the two could
  // (and did) drift apart. Both now call the same shared functions in
  // MaternityBenefitTypes.ts.
  //
  // REDESIGN: inst1Paid/inst2Paid/isCombinedPaid used to be destructured
  // here too, feeding the old 3-branch paidRows construction — no longer
  // needed now that paidRows maps directly over formData.installments
  // (see below). filterAvailableInstallments() still computes eligibility
  // internally for the dropdown filter.

  // ── filtered installment options ─────────────────────────────────────────
  // REDESIGN: now always returns all options — revisiting an already-paid
  // installment to edit it is the intended flow.
  const availableOptions = filterAvailableInstallments(formData.installments);

  const inst        = formData.activeInstallmentType;
  const isCombined  = inst === '১ম+২য় কিস্তি';
  // REDESIGN (2nd round): showSalaryOthers removed — salary/others now show
  // for EVERY installment type, each independently empty until entered.
  const yearOptions = MaternityFormula.getYearOptions();
  const dailyGross  = Number(formData.dailyGross || 0);
  // AUDIT FIX: was `isCombined ? 120 : 60` — defaulted to a real 60-day
  // amount even when activeInstallmentType is still the placeholder ('',
  // per the "always require active confirmation" fix), showing a
  // computed টাকা figure (৬০ দিন × দৈনিক মজুরি) before the user has
  // confirmed ANY installment. Now correctly shows 0 (৳0.00) until an
  // actual choice is made.
  const days        = inst === '' ? 0 : (isCombined ? 120 : 60);
  const benefitCalc = (days * dailyGross).toFixed(2);

  // REDESIGN (2nd round): earnedLeaveDays/currentMonth/currentYear/
  // otherBenefits* now live INSIDE the currently-selected installment's
  // entry (or a blank draft, if none exists yet) — not shared top-level
  // fields. Switching installments switches which draft these read from,
  // so a fresh/unselected installment starts genuinely empty.
  const draft = getActiveInstallmentDraft(formData.installments, inst);

  const earnedWage  = MaternityFormula.calculateEarnedWage(
    draft.earnedLeaveDays, formData.dailyGross, draft.currentMonth, draft.currentYear,
  ).toFixed(2);
  const otherAmount = MaternityFormula.calculateOtherBenefits(
    draft.otherBenefitsValue, draft.otherBenefitsType, formData.totalMonthlyWage,
  ).toFixed(2);

  // REDESIGN (2nd round, explicit request): removed all inline edit/delete
  // state (editingKey, editValues, deletingKey, saving, deleting) and their
  // handlers (startEdit, cancelEdit, confirmEdit, startDelete, cancelDelete,
  // confirmDelete) — কিস্তি ব্যবস্থাপনা no longer has ✏️/🗑 buttons. It's a
  // read-only history log; all edits happen through the main form fields,
  // saved via the main Save button (see maternityBenefit.tsx's onSave).

  // ── law-reference accordion ───────────────────────────────────────────────
  const [openRef, setOpenRef] = useState<string | null>(null);
  const toggleRef = (id: string) => setOpenRef(prev => (prev === id ? null : id));

  const InfoBtn = ({ id }: { id: string }) => (
    <button
      type="button"
      onClick={() => toggleRef(id)}
      aria-label="আইনি রেফারেন্স দেখুন"
      aria-expanded={openRef === id}
      style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 16, height: 16, flexShrink: 0,
        color: openRef === id ? '#2563eb' : '#94a3b8',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </button>
  );

  const LawRow = ({ text }: { text: string }) => (
    <tr>
      <td colSpan={2} style={{ padding: '8px 14px', fontSize: 12, color: '#1e3a8a', background: '#eff6ff', borderBottom: '1px solid #dbeafe', fontFamily: font, lineHeight: 1.6 }}>
        {text}
      </td>
    </tr>
  );

  // ── helper: build paid-installment rows (read-only history) ──────────────
  type PaidRow = {
    key:         number;
    label:       string;
    date:        string;
    amount:      string;
    salary:      string;
    others:      string;
    othersLabel: string;
    // AUDIT FIX: প্রাপ্য অর্জিত ছুটি was missing from কিস্তি ব্যবস্থাপনা
    // entirely — added here, same pattern as amount/salary/others.
    payableEarnedLeaveDays:  string;
    payableEarnedLeaveAmount: string;
  };

  const paidRows: PaidRow[] = formData.installments
    .map((i, index) => ({ i, index }))          // capture ORIGINAL index first
    .filter(({ i }) => i.status === 'paid')      // then filter — so `key` below
    .map(({ i, index }) => ({                    // still points at the right
      key:         index,                        // entry in formData.installments
      label:       i.type,
      date:        i.date,
      amount:      i.amount || (dailyGross * (i.type === '১ম+২য় কিস্তি' ? 120 : 60)).toFixed(0),
      salary:      i.salary || '0',
      others:      i.others || '0',
      othersLabel: i.othersLabel || '',
      payableEarnedLeaveDays:   i.payableEarnedLeaveDays || '0',
      payableEarnedLeaveAmount: MaternityFormula.calculatePayableEarnedLeave(i.payableEarnedLeaveDays, formData.dailyGross).toFixed(2),
    }));

  // ── shared cell styles ────────────────────────────────────────────────────
  const thS: React.CSSProperties = {
    padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
    color: '#fff', background: '#1e3a5f', textAlign: 'left' as const,
    borderRight: '1px solid rgba(255,255,255,.12)', whiteSpace: 'nowrap' as const,
  };
  const tdS: React.CSSProperties = {
    padding: '8px 10px', fontSize: 12, fontFamily: font, color: '#1e293b',
    borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
    verticalAlign: 'middle' as const,
  };
  const thStyle: React.CSSProperties = {
    padding: '9px 14px', fontSize: 12, fontWeight: 700, fontFamily: font,
    color: '#374151', background: '#f8fafc', textTransform: 'uppercase' as const,
    borderBottom: '1px solid #e2e8f0', textAlign: 'left' as const,
  };
  const tdLabel: React.CSSProperties = {
    ...S.labelCell(), width: '70%', whiteSpace: 'normal' as const, verticalAlign: 'top' as const,
  };
  const tdAmount: React.CSSProperties = {
    borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0',
    padding: '10px 14px', textAlign: 'right' as const,
    fontWeight: 700, fontSize: 14, fontFamily: font, color: '#1e293b',
    verticalAlign: 'middle' as const,
  };

  return (
    <>
      {/* ── Benefit calc table ─────────────────────────────────────────────── */}
      <div style={S.section()}>
        <SectionHeader title="মাতৃত্বকালীন সুবিধার হিসাব" icon="ti-calculator" />
        <table style={S.table()}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '70%' }}>বিবরণ</th>
              <th style={{ ...thStyle, borderLeft: '1px solid #e2e8f0', textAlign: 'right' as const }}>টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>

            {/* প্রসূতি কল্যাণ সুবিধা — only for eligible, only unpaid options */}
            {isEligible && availableOptions.length > 0 && (
              <>
              <tr>
                <td style={tdLabel}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: font }}>প্রসূতি কল্যাণ সুবিধা</span>
                    <InfoBtn id="maternityBenefit" />
                    <select
                      name="activeInstallmentType"
                      value={formData.activeInstallmentType}
                      onChange={handleChange}
                      style={S.select()}
                    >
                      {availableOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontFamily: font }}>
                    ({days} দিন × {formData.dailyGross || '0'} টাকা)
                  </div>
                </td>
                <td style={tdAmount}>{benefitCalc}</td>
              </tr>
              {openRef === "maternityBenefit" && <LawRow text={LAW_REFERENCES.maternityBenefit} />}
              </>
            )}

            {/* Salary row — REDESIGN: shown for EVERY installment now, no
               longer hidden on দ্বিতীয় কিস্তি. Reads/writes the currently-
               selected installment's own draft (independently empty per
               installment). */}
            <>
              <tr>
                <td style={tdLabel}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: font }}>বর্তমান মাস</span>
                    <InfoBtn id="currentMonthWage" />
                    <select name="currentMonth" value={draft.currentMonth} onChange={e => onInstallmentFieldChange('currentMonth', e.target.value)} style={S.select()}>
                      <option value="">--মাস--</option>
                      {STATIC_DATA.bengaliMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select name="currentYear" value={draft.currentYear} onChange={e => onInstallmentFieldChange('currentYear', e.target.value)} style={{ ...S.select(), width: 72 }}>
                      <option value="">বছর</option>
                      {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <span style={{ fontSize: 13, fontFamily: font }}>এর</span>
                    <input
                      name="earnedLeaveDays"
                      value={draft.earnedLeaveDays}
                      onChange={e => onInstallmentFieldChange('earnedLeaveDays', e.target.value)}
                      placeholder="দিন"
                      style={{ ...S.input(), width: 56, textAlign: 'center' as const }}
                    />
                    <span style={{ fontSize: 13, fontFamily: font }}>দিনের প্রাপ্য মজুরি</span>
                  </div>
                </td>
                <td style={tdAmount}>{earnedWage}</td>
              </tr>
              {openRef === "currentMonthWage" && <LawRow text={LAW_REFERENCES.maternityCurrentMonthWage} />}

              {/* REDESIGN: প্রাপ্য অর্জিত ছুটি — now its own independent row
                 (own input, own info icon, own টাকা column), matching how
                 বর্তমান মাস / অন্যান্য are structured — was previously just
                 a small subtext line with no independent input or amount. */}
              <tr>
                <td style={tdLabel}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: font }}>প্রাপ্য অর্জিত ছুটি (</span>
                    <input
                      name="payableEarnedLeaveDays"
                      value={draft.payableEarnedLeaveDays || ''}
                      onChange={e => onInstallmentFieldChange('payableEarnedLeaveDays', e.target.value)}
                      placeholder="0"
                      style={{ ...S.input(), width: 56, textAlign: 'center' as const }}
                    />
                    <span style={{ fontSize: 13, fontFamily: font }}>দিন)</span>
                    <InfoBtn id="payableEarnedLeave" />
                  </div>
                </td>
                <td style={tdAmount}>{MaternityFormula.calculatePayableEarnedLeave(draft.payableEarnedLeaveDays, formData.dailyGross).toFixed(2)}</td>
              </tr>
              {openRef === "payableEarnedLeave" && <LawRow text={LAW_REFERENCES.maternityCurrentMonthWage} />}
              </>

            {/* Others row — REDESIGN: shown for EVERY installment now, single
               line (per explicit request), independently empty per
               installment. */}
            <tr>
              <td style={tdLabel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: font }}>অন্যান্য:</span>
                  <input
                    name="othersLabel"
                    value={draft.othersLabel}
                    onChange={e => onInstallmentFieldChange('othersLabel', e.target.value)}
                    placeholder="বিবরণ লিখুন"
                    style={{ ...S.input(), width: 140 }}
                  />
                  <input
                    name="otherBenefitsValue"
                    value={draft.otherBenefitsValue}
                    onChange={e => onInstallmentFieldChange('otherBenefitsValue', e.target.value)}
                    type="number"
                    placeholder="সংখ্যা"
                    style={{ ...S.input(), width: 70, textAlign: 'center' as const }}
                  />
                  <select name="otherBenefitsType" value={draft.otherBenefitsType} onChange={e => onInstallmentFieldChange('otherBenefitsType', e.target.value)} style={S.select()}>
                    {STATIC_DATA.benefitTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </td>
              <td style={tdAmount}>{otherAmount}</td>
            </tr>

            {/* Total row */}
            <tr>
              <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 15, fontFamily: font, color: '#fff', background: '#0f2442', textAlign: 'right' as const }}>
                সর্বমোট প্রাপ্য
              </td>
              <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 16, fontFamily: font, color: '#fff', background: '#0f2442', textAlign: 'right' as const, borderLeft: '1px solid rgba(255,255,255,.15)' }}>
                ৳ {calculateTotalPayable()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── কিস্তি ব্যবস্থাপনা — paid installments table ──────────────────── */}
      <div style={{ ...S.section(), marginTop: 14 }}>
        <div style={{ ...S.header(), background: '#1e3a5f', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-cash-banknote" style={{ fontSize: 15 }} aria-hidden="true" />
            কিস্তি ব্যবস্থাপনা
          </span>
          <span style={{ fontSize: 10, opacity: .7, fontWeight: 400 }}>
            {paidRows.length > 0 ? `${paidRows.length}টি কিস্তি পরিশোধিত` : 'কোনো কিস্তি পরিশোধিত হয়নি'}
          </span>
        </div>

        {paidRows.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13, fontFamily: font }}>
            <i className="ti ti-clock" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true" />
            এখনো কোনো কিস্তি সংরক্ষণ করা হয়নি
          </div>
        ) : (
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ ...S.table(), minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={thS}>বিলের তারিখ</th>
                  <th style={thS}>কিস্তি</th>
                  <th style={{ ...thS, textAlign: 'right' as const }}>সুবিধার পরিমাণ</th>
                  <th style={{ ...thS, textAlign: 'right' as const }}>মজুরি</th>
                  <th style={{ ...thS, textAlign: 'right' as const }}>অর্জিত ছুটি</th>
                  <th style={{ ...thS, textAlign: 'right' as const, borderRight: 'none' }}>অন্যান্য</th>
                </tr>
              </thead>
              <tbody>
                {paidRows.map(row => {
                  const fmtDate = row.date
                    ? new Date(row.date).toLocaleDateString('bn-BD', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '——';
                  return (
                    <tr key={row.key} style={{ background: '#fff' }}>
                      <td style={{ ...tdS, fontWeight: 500 }}>{fmtDate}</td>
                      <td style={{ ...tdS }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#f0fdf4', color: '#15803d',
                          border: '1px solid #86efac', borderRadius: 20,
                          padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: font,
                        }}>
                          ✓ {row.label}
                        </span>
                      </td>
                      <td style={{ ...tdS, textAlign: 'right' as const, fontWeight: 700 }}>৳ {Number(row.amount).toLocaleString('bn-BD')}</td>
                      <td style={{ ...tdS, textAlign: 'right' as const }}>৳ {Number(row.salary).toLocaleString('bn-BD')}</td>
                      <td style={{ ...tdS, textAlign: 'right' as const }}>৳ {Number(row.payableEarnedLeaveAmount).toLocaleString('bn-BD')}</td>
                      <td style={{ ...tdS, textAlign: 'right' as const, borderRight: 'none' }}>৳ {Number(row.others).toLocaleString('bn-BD')}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* totals footer */}
              {paidRows.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#0f2442' }}>
                    <td colSpan={2} style={{ padding: '8px 10px', fontWeight: 700, fontSize: 12, fontFamily: font, color: '#fff', textAlign: 'right' as const }}>
                      সর্বমোট
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: 13, fontFamily: font, color: '#fff', textAlign: 'right' as const }}>
                      ৳ {paidRows.reduce((s, r) => s + Number(r.amount), 0).toLocaleString('bn-BD')}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: 13, fontFamily: font, color: '#fff', textAlign: 'right' as const }}>
                      ৳ {paidRows.reduce((s, r) => s + Number(r.salary), 0).toLocaleString('bn-BD')}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: 13, fontFamily: font, color: '#fff', textAlign: 'right' as const }}>
                      ৳ {paidRows.reduce((s, r) => s + Number(r.payableEarnedLeaveAmount), 0).toLocaleString('bn-BD')}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: 13, fontFamily: font, color: '#fff', textAlign: 'right' as const, borderRight: 'none' }}>
                      ৳ {paidRows.reduce((s, r) => s + Number(r.others), 0).toLocaleString('bn-BD')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
};