// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementForm.tsx — one compact entry form: employee · wages · earnings (A) · deductions (B) · payment dates.
// Everything calculated comes from computeSettlement() (read-only here).
// A death settlement shows BOTH lines: চাকরি অবসানজনিত ক্ষতিপূরণ and মৃত্যুজনিত ক্ষতিপূরণ.
// Payment section: two dates, each filled automatically (salary: 7 working days, others: 30 days from the last
// work day) and still editable. An empty stored value means "follow the automatic date".
// Path: src/components/modules/finalSettlement/FinalSettlementForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode, CSSProperties } from 'react';
import type { EmployeeFormData } from './FinalSettlementDataTypes';
import {
  TERMINATION_OPTIONS, NOTICE_PAY_TYPES, NOTICE_DEDUCTION_TYPES, LAYOFF_TYPE, MONTH_NAMES, yearOptions, isDeathType, money, formatDMY,
} from './settlementModel';
import type { Settlement, SettlementIssues } from './settlementModel';
import { LAW_REFERENCES } from '../../common/Lawreferences';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import InfoBall from '../livingWage/InfoBall';
import { font, labelStyle, inputStyle, btn, FORM_CSS } from '../livingWage/ui';
import { StepCard, IconAction, ExcelIcon, UsersIcon } from './SettlementSectionCard';

interface Props {
  data: EmployeeFormData;
  setData: (d: EmployeeFormData) => void;
  calc: Settlement;
  issues: SettlementIssues;
  showErrors: boolean;
  /** Top-right icons of the first section. Omitted (hidden) while a saved settlement is being edited. */
  onOpenExcel?: () => void;
  onOpenMulti?: () => void;
}

const inline: CSSProperties = { ...inputStyle, width: 64, padding: '4px 6px', textAlign: 'center', fontWeight: 700 };
const inlineWide: CSSProperties = { ...inputStyle, width: 170, padding: '4px 8px', fontSize: 12 };
const amountInput: CSSProperties = { ...inputStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 };
const dateBox = { padding: '7px 10px', fontSize: 12.5 };

const DEATH_SERVICE_NOTE = 'মৃত্যুর ক্ষেত্রে চাকরি অবসানজনিত ক্ষতিপূরণ (প্রতি সুবিধাপ্রাপ্ত বছরে ৩০ দিনের মূল মজুরি) এবং মৃত্যুজনিত ক্ষতিপূরণ — উভয়ই প্রদেয় হিসেবে গণনা করা হয়।';
const lawText = (obj: unknown, key: string, fallback = 'এই নিষ্পত্তির ধরনের জন্য নির্দিষ্ট রেফারেন্স পাওয়া যায়নি।'): string =>
  ((obj as Record<string, string>)?.[key]) || fallback;

/** One money line of the A / B cards: icon + label (+ inline inputs) on the left, the amount (or an input) on the right. */
function Line({ label, amount, amountNode, info, children }: { label: ReactNode; amount?: string; amountNode?: ReactNode; info?: ReactNode; children?: ReactNode }) {
  return (
    <div className="fsf-line" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'center', padding: '7px 4px', borderBottom: '1px solid rgba(15,23,42,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 12.5, fontFamily: font, color: '#1e293b', minWidth: 0 }}>
        {label}{children}{info}
      </div>
      {amountNode ?? <span style={{ fontWeight: 800, fontSize: 14, fontFamily: font, color: '#0f172a', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>৳ {amount}</span>}
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) {
  return <span style={{ padding: '1px 8px', borderRadius: 999, background: bg, color: fg, fontSize: 10.5, fontWeight: 800, fontFamily: font }}>{children}</span>;
}

/** A salary-structure tile: small one-line label over a bold value (a derived amount or an editable one). */
function Tile({ label, hl, order, field, children }: { label: string; hl?: boolean; order?: number; field?: string; children: ReactNode }) {
  return (
    <div className="fsf-tile" data-field={field} style={{ order, padding: '9px 10px', borderRadius: 12, background: hl ? '#eef4ff' : '#f8fafc', border: `1px solid ${hl ? '#c7d7fe' : '#e2e8f0'}`, minWidth: 0 }}>
      <div title={label} style={{ fontSize: 11, color: '#475569', fontFamily: font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, fontWeight: 800, fontSize: 15, color: '#0f172a', fontFamily: font, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', minWidth: 0 }}>{children}</div>
    </div>
  );
}

/** Closing bar of the A / B cards: one neutral bar, only the amount carries the colour. */
function Total({ label, value, tone }: { label: string; value: string; tone: 'green' | 'orange' }) {
  const fg = tone === 'green' ? '#15803d' : '#b45309';
  return (
    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontFamily: font }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{label}</span>
        <span style={{ fontWeight: 900, fontSize: 21, color: fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>৳ {value}</span>
      </div>
    </div>
  );
}

export default function FinalSettlementForm({ data, setData, calc, issues, showErrors, onOpenExcel, onOpenMulti }: Props) {
  const set = (k: keyof EmployeeFormData, v: string) => setData({ ...data, [k]: v });
  const t = data.terminationType;
  const death = isDeathType(t);
  const hasType = t !== '';
  const credit = calc.benefitYears - calc.years;            // 0, 0.5 or 1
  const hasExtra = calc.months > 0 || calc.days > 0;
  const creditedTerm = credit >= 1 ? `${calc.years + 1} বছর` : credit > 0 ? `${calc.years} বছর ৬ মাস` : `${calc.years} বছর`;
  const errorOf = (field: string) => (showErrors ? issues.errors.find(e => e.field === field)?.text : undefined);
  const err = (field: string) => { const m = errorOf(field); return m ? <div role="alert" style={{ marginTop: 3, fontSize: 11.5, color: '#dc2626', fontWeight: 600, fontFamily: font }}>{m}</div> : null; };
  const bad = (field: string): CSSProperties => (errorOf(field) ? { borderColor: '#dc2626' } : {});

  // Payment dates: the stored value is an override; empty = follow the automatic (legal due) date.
  const salaryDate = data.salaryPaymentDate || calc.salaryDueDate;
  const otherDate  = data.paymentDate || calc.otherDueDate;
  const salaryEdited = Boolean(data.salaryPaymentDate) && data.salaryPaymentDate !== calc.salaryDueDate;
  const otherEdited  = Boolean(data.paymentDate) && data.paymentDate !== calc.otherDueDate;
  const linkBtn: CSSProperties = { background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 700, fontSize: 11, fontFamily: font, cursor: 'pointer', textDecoration: 'underline' };
  /** A payment-date field + a status pill: "Auto" (follows the legal due date) or "Edited" (with a one-click way back). */
  const dateBlock = (label: string, value: string, key: 'salaryPaymentDate' | 'paymentDate', edited: boolean, auto: string, rule: string, aria: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <DateFieldDMY value={value} onChange={v => set(key, v)} ariaLabel={aria} min={data.lastAttendance || undefined} clearable boxStyle={dateBox} />
      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11, fontFamily: font }}>
        {!auto ? <span style={{ color: '#64748b' }}>সর্বশেষ উপস্থিতির তারিখ দিলে স্বয়ংক্রিয় তারিখ আসবে</span>
          : edited ? (<><Pill bg="#fef3c7" fg="#92400e">Edited</Pill><span style={{ color: '#92400e' }}>স্বয়ংক্রিয়: {formatDMY(auto) || '—'}</span><button type="button" onClick={() => set(key, '')} style={linkBtn}>স্বয়ংক্রিয় তারিখে ফিরুন</button></>)
          : (<><Pill bg="#dcfce7" fg="#166534">Auto</Pill><span style={{ color: '#64748b' }}>{rule}</span></>)}
      </div>
    </div>
  );
  const setStatus = (v: string) => setData({ ...data, paymentStatus: v, paymentDate: v === 'Paid' && !data.paymentDate ? data.settlementDate : data.paymentDate });

  // Picking the last attendance date fills "last month / year / payable days" once, while they are still untouched.
  const onLastAttendance = (v: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    const untouched = !data.lastMonthName && !data.lastMonthYear && !String(data.payableDay ?? '').trim();
    if (m && untouched) setData({ ...data, lastAttendance: v, lastMonthName: MONTH_NAMES[Number(m[2]) - 1] ?? '', lastMonthYear: m[1], payableDay: String(Number(m[3])) });
    else set('lastAttendance', v);
  };

  const fillLastMonth = () => {
    const [y, m, d] = data.lastAttendance.split('-');
    if (!y || !m || !d) return;
    setData({ ...data, lastMonthName: MONTH_NAMES[Number(m) - 1] ?? '', lastMonthYear: y, payableDay: String(Number(d)) });
  };

  const lastMonthLabel = `${data.lastMonthName || '—'} ${data.lastMonthYear || ''}`.trim();

  const net = calc.finalTotal;
  const negative = net < 0;
  const hasIssues = (showErrors && issues.errors.length > 0) || issues.warnings.length > 0;

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>
      <style>{`
        .fsf-stack { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .fsf-emp { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.1fr) minmax(0, 1.1fr); }
        .fsf-emp > div { padding: 0 14px; min-width: 0; }
        .fsf-emp > div:first-child { padding-left: 0; }
        .fsf-emp > div + div { border-left: 1px solid #e2e8f0; }
        .fsf-emp > div:last-child { padding-right: 0; }
        .fsf-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .fsf-tiles { display: flex; gap: 10px; align-items: stretch; }
        .fsf-tile { flex: 1 1 0; min-width: 0; }
        .fsf-rates { display: flex; align-items: center; gap: 8px; flex: 3 1 0; min-width: 0; border-left: 1px solid #94a3b8; padding-left: 10px; }
        .fsf-rates .fsf-tile { flex: 1 1 0; }
        .fsf-bar { width: 1px; height: 30px; background: #cbd5e1; flex: none; }
        .fsf-ab { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 12px; align-items: stretch; }
        .fsf-pay { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .fsf-tin { border: none; border-bottom: 1.5px dashed #94a3b8; background: transparent; outline: none; width: 100%; min-width: 0; font: inherit; font-weight: 800; color: #0f172a; padding: 0; }
        .fsf-tin:focus { border-bottom: 1.5px solid #2563eb; }
        .fsf-line:last-of-type { border-bottom: none; }
        @media (max-width: 1100px) { .fsf-ab { grid-template-columns: minmax(0, 1fr); } .fsf-tiles { flex-wrap: wrap; } .fsf-tile { flex: 1 1 30%; } .fsf-rates { flex: 1 1 100%; border-left: none; padding: 0; } }
        @media (max-width: 900px) {
          .fsf-emp { grid-template-columns: minmax(0, 1fr); gap: 10px; }
          .fsf-emp > div { padding: 0 !important; border-left: none !important; }
          .fsf-pay { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div className="fsf-stack">

        {hasIssues && (
          <div role="status" style={{ background: showErrors && issues.errors.length ? '#fff5f5' : '#fffbeb', border: `1px solid ${showErrors && issues.errors.length ? '#fecaca' : '#fde68a'}`, borderRadius: 12, padding: '10px 14px', fontFamily: font }}>
            {showErrors && issues.errors.map((e, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontWeight: 600, marginBottom: 2 }}>✕ {e.text}</div>)}
            {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', marginBottom: 2 }}>⚠ {m}</div>)}
          </div>
        )}

        {/* ── 1. Employee information ── */}
        <StepCard title="কর্মীর তথ্য"
          right={(onOpenExcel || onOpenMulti) ? <>
            {onOpenExcel && <IconAction title="Excel দিয়ে তথ্য আপলোড" tone="green" onClick={onOpenExcel}><ExcelIcon /></IconAction>}
            {onOpenMulti && <IconAction title="একাধিক কর্মীর হিসাব — চাকরি নিষ্পত্তির ধরন অনুযায়ী" tone="blue" onClick={onOpenMulti}><UsersIcon /></IconAction>}
          </> : undefined}>
          <div className="fsf-emp">
            <div>
              <div className="fsf-g2">
                <div data-field="employeeName"><label style={labelStyle}>নাম *</label><input value={data.employeeName} onChange={e => set('employeeName', e.target.value)} style={{ ...inputStyle, ...bad('employeeName') }} />{err('employeeName')}</div>
                <div><label style={labelStyle}>কার্ড নং</label><input value={data.cardNo} onChange={e => set('cardNo', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>বিভাগ</label><input value={data.section} onChange={e => set('section', e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>পদবি</label><input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} /></div>
              </div>
            </div>
            <div>
              <div className="fsf-g2">
                <div data-field="joiningDate">
                  <label style={labelStyle}>নিয়োগের তারিখ *</label>
                  <div style={{ display: 'flex' }}><DateFieldDMY value={data.joiningDate} onChange={v => set('joiningDate', v)} ariaLabel="Joining date" max={data.lastAttendance || undefined} clearable invalid={Boolean(errorOf('joiningDate'))} boxStyle={dateBox} /></div>
                  {err('joiningDate')}
                </div>
                <div data-field="lastAttendance">
                  <label style={labelStyle}>সর্বশেষ উপস্থিতি *</label>
                  <div style={{ display: 'flex' }}><DateFieldDMY value={data.lastAttendance} onChange={onLastAttendance} ariaLabel="Last attendance" min={data.joiningDate || undefined} clearable invalid={Boolean(errorOf('lastAttendance'))} boxStyle={dateBox} /></div>
                  {err('lastAttendance')}
                </div>
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 10px', fontFamily: font }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1d4ed8' }}>চাকরির মেয়াদ — স্বয়ংক্রিয়</div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1e3a5f' }}>{calc.years} বছর {calc.months} মাস {calc.days} দিন</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>গণনাযোগ্য {creditedTerm} · সুবিধা প্রাপ্ত বছর {calc.benefitYears}</div>
                </div>
              </div>
            </div>
            <div>
              <div><label style={labelStyle}>অসম্পূর্ণ বছরে অনুপস্থিতির দিন</label><input type="number" min="0" value={data.absentDays} onChange={e => set('absentDays', e.target.value)} style={inputStyle} /></div>
              <div data-field="terminationType" style={{ marginTop: 10 }}>
                <label style={labelStyle}>চাকরি নিষ্পত্তির ধরন *</label>
                
                  <select value={t} onChange={e => set('terminationType', e.target.value)} style={{ ...inputStyle, ...bad('terminationType') }}>
                    <option value="">-- নির্বাচন করুন --</option>
                    {TERMINATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                
                {err('terminationType')}
              </div>
            </div>
          </div>
          {hasExtra && (
            <div style={{ marginTop: 10, fontSize: 11.5, fontFamily: font, color: credit > 0 ? '#047857' : '#92400e' }}>
              {credit >= 1
                ? `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ (ন্যূনতম ২৪০ দিন) — তাই পূর্ণ এক বছর গণ্য হয়েছে।`
                : credit > 0
                  ? `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ (ন্যূনতম ১২০ দিন) — তাই ছয় মাস গণ্য হয়েছে।`
                  : `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ — ন্যূনতম ১২০ দিন না হওয়ায় কোনো অতিরিক্ত মেয়াদ গণ্য হয়নি।`}
            </div>
          )}
        </StepCard>

        {/* ── 2. Salary structure ── */}
        <StepCard title="সর্বশেষ ধার্যকৃত মাসিক মজুরির কাঠামো">
          <div className="fsf-tiles">
            <Tile label="মোট মজুরি বা বেতন *" hl field="totalMonthlyWage">
              <span>৳</span><input className="fsf-tin" type="number" min="0" aria-label="Total monthly wage" value={data.totalMonthlyWage} onChange={e => set('totalMonthlyWage', e.target.value)} style={errorOf('totalMonthlyWage') ? { borderBottomColor: '#dc2626' } : undefined} />
            </Tile>
            <Tile label="মূল মজুরি"><span>৳ {money(calc.basic)}</span></Tile>
            <Tile label="বাড়ি ভাড়া"><span>৳ {money(calc.houseRent)}</span></Tile>
            <Tile label="খাদ্য ভাতা"><span>৳</span><input className="fsf-tin" type="number" min="0" aria-label="Food allowance" value={data.foodAllowance} onChange={e => set('foodAllowance', e.target.value)} /></Tile>
            <Tile label="চিকিৎসা ভাতা"><span>৳</span><input className="fsf-tin" type="number" min="0" aria-label="Medical allowance" value={data.medicalAllowance} onChange={e => set('medicalAllowance', e.target.value)} /></Tile>
            <Tile label="যাতায়াত ভাতা"><span>৳</span><input className="fsf-tin" type="number" min="0" aria-label="Transport allowance" value={data.transportAllowance} onChange={e => set('transportAllowance', e.target.value)} /></Tile>
            <div className="fsf-rates">
              <Tile label="দৈনিক মূল মজুরি"><span>৳ {money(calc.dailyBasic)}</span></Tile>
              <span className="fsf-bar" aria-hidden="true" />
              <Tile label="দৈনিক মোট মজুরি"><span>৳ {money(calc.dailyGross)}</span></Tile>
              <span className="fsf-bar" aria-hidden="true" />
              <Tile label="ওভারটাইম হার (ঘণ্টা)"><span>৳ {money(calc.otRate)}</span></Tile>
            </div>
          </div>
          {err('totalMonthlyWage')}
        </StepCard>

        {/* ── 3 + 4. Entitlements (A) and deductions (B) ── */}
        <div className="fsf-ab">
          <StepCard title="মোট প্রাপ্য (A)" tone="green" right={<Pill bg="#eff6ff" fg="#1d4ed8">✓ স্বয়ংক্রিয় হিসাব</Pill>}>
            <Line amount={money(calc.lastMonthSalary)}
              label={<span>সর্বশেষ মাস</span>}
              info={<InfoBall title="সর্বশেষ মাসের মজুরি">{LAW_REFERENCES.lastMonthWage}</InfoBall>}>
              <select aria-label="Last month" value={data.lastMonthName} onChange={e => set('lastMonthName', e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '4px 8px' }}>
                <option value="">--মাস--</option>{MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select aria-label="Last month year" value={data.lastMonthYear} onChange={e => set('lastMonthYear', e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '4px 8px' }}>
                <option value="">বছর</option>{yearOptions().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span>এর</span><input type="number" min="0" aria-label="Payable days" value={data.payableDay} onChange={e => set('payableDay', e.target.value)} style={inline} /><span>দিনের মজুরি</span>
              {data.lastAttendance && <button type="button" onClick={fillLastMonth} style={{ ...btn('#1e3a5f'), padding: '3px 9px', fontSize: 11 }}>শেষ উপস্থিতি থেকে নিন</button>}
            </Line>

            <Line amount={money(calc.lastMonthOvertime)}
              label={<span>{lastMonthLabel !== '—' ? `${lastMonthLabel} মাসের ` : ''}অতিরিক্ত কর্মঘন্টা</span>}
              info={<InfoBall title="অতিরিক্ত কর্মঘন্টা">{LAW_REFERENCES.overtime}</InfoBall>}>
              <input type="number" min="0" aria-label="Overtime hours" value={data.payableHours} onChange={e => set('payableHours', e.target.value)} style={inline} /><span>ঘন্টা</span>
            </Line>

            <Line amount={money(calc.earnedLeave)} label={<span>প্রাপ্য অর্জিত ছুটি</span>} info={<InfoBall title="অর্জিত ছুটি">{LAW_REFERENCES.earnedLeave}</InfoBall>}>
              <input type="number" min="0" aria-label="Earned leave days" value={data.elQty} onChange={e => set('elQty', e.target.value)} style={inline} /><span>দিন</span>
            </Line>

            {t === LAYOFF_TYPE && (
              <Line amount={money(calc.layOff)} label={<span>লে-অফ ক্ষতিপূরণ (১৬)</span>} info={<InfoBall title="লে-অফ ক্ষতিপূরণ">{LAW_REFERENCES.layOff}</InfoBall>}>
                <input type="number" min="0" aria-label="Lay-off days" value={data.layOffDays ?? ''} onChange={e => set('layOffDays', e.target.value)} style={inline} /><span>দিন</span>
              </Line>
            )}

            {hasType && !calc.gratuityEligible && t !== LAYOFF_TYPE && (
              <Line amount={money(calc.serviceComp)} label={<span>চাকরি অবসানজনিত ক্ষতিপূরণ</span>}
                info={<InfoBall title="ক্ষতিপূরণ">{lawText(LAW_REFERENCES.serviceCompensationByType, t)}</InfoBall>} />
            )}

            {calc.gratuityEligible && hasType && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '8px 10px', margin: '6px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontFamily: font, fontSize: 12.5 }}>
                  <strong>পেমেন্ট পদ্ধতি:</strong>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="paymentMethod" checked={!calc.usesGratuity} onChange={() => set('paymentMethod', 'compensation')} />বিধিবদ্ধ ক্ষতিপূরণ</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="paymentMethod" checked={calc.usesGratuity} onChange={() => set('paymentMethod', 'gratuity')} />গ্র্যাচুইটি</label>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#64748b' }}>রেফারেন্স — ক্ষতিপূরণ: {money(calc.refCompensation)} | গ্র্যাচুইটি: {money(calc.gratuity)}</span>
                </div>
                {!calc.usesGratuity ? (
                  <>
                    <Line amount={money(calc.serviceComp)} label={<span>চাকরি অবসানজনিত ক্ষতিপূরণ</span>}
                      info={<InfoBall title="চাকরি অবসানজনিত ক্ষতিপূরণ">{lawText(LAW_REFERENCES.serviceCompensationByType, t, death ? DEATH_SERVICE_NOTE : undefined)}</InfoBall>} />
                    {death && (
                      <Line amount={money(calc.deathComp)} label={<span>মৃত্যুজনিত ক্ষতিপূরণ (১৯)</span>}
                        info={<InfoBall title="মৃত্যুজনিত ক্ষতিপূরণ">{lawText(LAW_REFERENCES.deathCompensationByType, t)}</InfoBall>} />
                    )}
                  </>
                ) : (
                  <Line amount={money(calc.gratuity)} label={<span>গ্র্যাচুইটি</span>} info={<InfoBall title="গ্র্যাচুইটি">{LAW_REFERENCES.gratuity}</InfoBall>} />
                )}
              </>
            )}

            {NOTICE_PAY_TYPES.includes(t) && (
              <Line amount={money(calc.notice)} label={<span>নোটিশ পে</span>} info={<InfoBall title="নোটিশ পে">{LAW_REFERENCES.noticePay}</InfoBall>}>
                <input type="number" min="0" aria-label="Notice pay days" value={data.noticePayDay} onChange={e => set('noticePayDay', e.target.value)} style={inline} /><span>দিন</span>
              </Line>
            )}

            <Line label={<span>অন্যান্য:</span>}
              amountNode={<input type="number" min="0" aria-label="Other earnings" value={data.others} onChange={e => set('others', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
              <input aria-label="Other earnings detail" value={data.otherBenefits ?? ''} onChange={e => set('otherBenefits', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
            </Line>
            <Total label="মোট প্রাপ্য (A)" value={money(calc.totalReceivable)} tone="green" />
          </StepCard>

          <StepCard title="মোট কর্তন (B)" tone="orange">
            {NOTICE_DEDUCTION_TYPES.includes(t) && (
              <Line amount={money(calc.noticeDeduction)} label={<span>কর্তন (নোটিশ বাবদ):</span>}>
                <input type="number" min="0" aria-label="Notice deduction days" value={data.noticeDeductionDay} onChange={e => set('noticeDeductionDay', e.target.value)} style={inline} /><span>দিন</span>
              </Line>
            )}
            <Line label={<span>কর্তন (অগ্রিম গ্রহণ বাবদ):</span>}
              amountNode={<input type="number" min="0" aria-label="Advance deduction" value={data.advanceDeduction} onChange={e => set('advanceDeduction', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
              <input aria-label="Advance detail" value={data.deductionForAdvance ?? ''} onChange={e => set('deductionForAdvance', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
            </Line>
            <Line label={<span>অন্যান্য কর্তন:</span>}
              amountNode={<input type="number" min="0" aria-label="Other deduction" value={data.otherDeduction} onChange={e => set('otherDeduction', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
              <input aria-label="Other deduction detail" value={data.deductionParticularsB ?? ''} onChange={e => set('deductionParticularsB', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
            </Line>
            <Total label="মোট কর্তন (B)" value={money(calc.totalDeductions)} tone="orange" />
          </StepCard>
        </div>

        {/* ── 5. Net payable ── */}
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: negative ? '#fff5f5' : '#fff', border: `1px solid ${negative ? '#fca5a5' : '#dbe3ee'}`, borderRadius: 14, padding: '14px 18px', fontFamily: font }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: negative ? '#991b1b' : '#0f172a' }}>সর্বমোট নিট প্রাপ্য</div>
              <div style={{ fontSize: 12.5, color: '#475569' }}>A − B = নিট প্রাপ্য{negative ? ' (কর্তন প্রাপ্যের চেয়ে বেশি)' : ''}</div>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 18, fontWeight: 900, fontSize: 34, lineHeight: 1.1, color: negative ? '#b91c1c' : '#15803d', fontVariantNumeric: 'tabular-nums' }}>
            ৳ {net.toLocaleString('en-US')}
          </div>
        </div>

        {/* ── 6. Payment information ── */}
        <StepCard title="পেমেন্ট তথ্য">
          <div className="fsf-pay">
            <div>
              <label style={labelStyle}>পরিশোধের অবস্থা</label>
              
                <select value={data.paymentStatus ?? ''} onChange={e => setStatus(e.target.value)} style={inputStyle} aria-label="Payment status">
                  <option value="">নির্ধারিত নয়</option><option value="Pending">বকেয়া</option><option value="Paid">পরিশোধিত</option>
                </select>
              
              <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', fontFamily: font }}>নিষ্পত্তির তারিখ: <strong>{formatDMY(data.settlementDate) || '—'}</strong> (পেজের হেডার থেকে বদলান)</div>
            </div>
            {dateBlock('বেতন পরিশোধের তারিখ', salaryDate, 'salaryPaymentDate', salaryEdited, calc.salaryDueDate, 'শেষ কর্মদিবস থেকে ৭ কর্মদিবসের মধ্যে', 'Salary payment date')}
            {dateBlock('ক্ষতিপূরণ, সুবিধাদি ও অন্যান্য পাওনা পরিশোধের তারিখ', otherDate, 'paymentDate', otherEdited, calc.otherDueDate, 'শেষ কর্মদিবস থেকে ৩০ দিনের মধ্যে', 'Compensation, benefit and others payment date')}
          </div>
        </StepCard>

      </div>
    </div>
  );
}