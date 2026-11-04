// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementForm.tsx — one compact entry form: employee · wages · earnings (A) · deductions (B) · payment.
// Everything calculated comes from computeSettlement() (read-only here).
// A death settlement shows BOTH lines: চাকরি অবসানজনিত ক্ষতিপূরণ and মৃত্যুজনিত ক্ষতিপূরণ.
// Payment section shows the two due dates (salary: 7 working days, others: 30 days from the last work day).
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
import { font, labelStyle, inputStyle, card, cardTitle, btn, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: EmployeeFormData;
  setData: (d: EmployeeFormData) => void;
  calc: Settlement;
  issues: SettlementIssues;
  showErrors: boolean;
}

const inline: CSSProperties = { ...inputStyle, width: 64, padding: '4px 6px', textAlign: 'center', fontWeight: 700 };
const inlineWide: CSSProperties = { ...inputStyle, width: 170, padding: '4px 8px', fontSize: 12 };
const amountInput: CSSProperties = { ...inputStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 };
const dateBox = { padding: '7px 10px', fontSize: 12.5 };

const DEATH_SERVICE_NOTE = 'মৃত্যুর ক্ষেত্রে চাকরি অবসানজনিত ক্ষতিপূরণ (প্রতি সুবিধাপ্রাপ্ত বছরে ৩০ দিনের মূল মজুরি) এবং মৃত্যুজনিত ক্ষতিপূরণ — উভয়ই প্রদেয় হিসেবে গণনা করা হয়।';
const lawText = (obj: unknown, key: string, fallback = 'এই নিষ্পত্তির ধরনের জন্য নির্দিষ্ট রেফারেন্স পাওয়া যায়নি।'): string =>
  ((obj as Record<string, string>)?.[key]) || fallback;

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', minWidth: 118 }}>
      <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e3a5f', fontFamily: font }}>{value}</div>
    </div>
  );
}

/** One money line: label (+ inline inputs) on the left, the amount (or an input) on the right. */
function Line({ tone, label, amount, amountNode, info, children }: { tone: 'earn' | 'deduct'; label: ReactNode; amount?: string; amountNode?: ReactNode; info?: ReactNode; children?: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 170px', gap: 10, alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid #e2e8f0', background: tone === 'earn' ? '#f8fbff' : '#fff8f8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12.5, fontFamily: font, color: '#1e293b' }}>{label}{children}{info}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        {amountNode ?? <span style={{ fontWeight: 800, fontSize: 14, fontFamily: font, color: '#1e293b' }}>{amount}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontFamily: font }}>টাকা</span>
      </div>
    </div>
  );
}

function Total({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: bg, color: '#fff', fontWeight: 800, fontFamily: font }}>
      <span>{label}</span><span style={{ fontSize: 16 }}>{value} টাকা</span>
    </div>
  );
}

export default function FinalSettlementForm({ data, setData, calc, issues, showErrors }: Props) {
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

  const fillLastMonth = () => {
    const [y, m, d] = data.lastAttendance.split('-');
    if (!y || !m || !d) return;
    setData({ ...data, lastMonthName: MONTH_NAMES[Number(m) - 1] ?? '', lastMonthYear: y, payableDay: String(Number(d)) });
  };

  const lastMonthLabel = `${data.lastMonthName || '—'} ${data.lastMonthYear || ''}`.trim();

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      {/* {((showErrors && issues.errors.length > 0) || issues.warnings.length > 0) && (
        <div style={{ ...card, padding: 10, borderColor: showErrors && issues.errors.length ? '#fecaca' : '#fde68a', background: showErrors && issues.errors.length ? '#fff5f5' : '#fffbeb' }}>
          {showErrors && issues.errors.map((e, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>✕ {e.text}</div>)}
          {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', fontFamily: font }}>⚠ {m}</div>)}
        </div>
      )} */}

      {/* ── A. Employee ── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>কর্মীর তথ্য, চাকরিকাল ও নিষ্পত্তির ধরন</div>
        <div className="lw-grid">
          <div className="s2" data-field="employeeName"><label style={labelStyle}>নাম *</label><input value={data.employeeName} onChange={e => set('employeeName', e.target.value)} style={{ ...inputStyle, ...bad('employeeName') }} />{err('employeeName')}</div>
          <div><label style={labelStyle}>কার্ড নং</label><input value={data.cardNo} onChange={e => set('cardNo', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>পদবি</label><input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} /></div>

          <div><label style={labelStyle}>বিভাগ</label><input value={data.section} onChange={e => set('section', e.target.value)} style={inputStyle} /></div>
          <div data-field="joiningDate">
            <label style={labelStyle}>নিয়োগের তারিখ *</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.joiningDate} onChange={v => set('joiningDate', v)} ariaLabel="Joining date" max={data.lastAttendance || undefined} clearable invalid={Boolean(errorOf('joiningDate'))} boxStyle={dateBox} /></div>
            {err('joiningDate')}
          </div>
          <div data-field="lastAttendance">
            <label style={labelStyle}>সর্বশেষ উপস্থিতির তারিখ *</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.lastAttendance} onChange={v => set('lastAttendance', v)} ariaLabel="Last attendance" min={data.joiningDate || undefined} clearable invalid={Boolean(errorOf('lastAttendance'))} boxStyle={dateBox} /></div>
            {err('lastAttendance')}
          </div>
          <div><label style={labelStyle}>অসম্পূর্ণ বছরে অনুপস্থিতির দিন</label><input type="number" min="0" value={data.absentDays} onChange={e => set('absentDays', e.target.value)} style={inputStyle} /></div>

          <div className="s2" data-field="terminationType">
            <label style={labelStyle}>চাকরি নিষ্পত্তির ধরন *</label>
            <select value={t} onChange={e => set('terminationType', e.target.value)} style={{ ...inputStyle, ...bad('terminationType') }}>
              <option value="">-- নির্বাচন করুন --</option>
              {TERMINATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {err('terminationType')}
          </div>
          <div className="s2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', height: '100%' }}>
            <Chip label="চাকরির মেয়াদ" value={`${calc.years} বছর ${calc.months} মাস ${calc.days} দিন`} />
            <Chip label="অসম্পূর্ণ অংশে কাজের দিন" value={String(calc.totalDays)} />
            <Chip label="গণনাযোগ্য মেয়াদ (ধারা ১৪)" value={creditedTerm} />
            <Chip label="সুবিধা প্রাপ্ত বছর" value={String(calc.benefitYears)} />
            {hasExtra && (
            <div style={{ marginTop: 8, fontSize: 11.5, fontFamily: font, color: credit > 0 ? '#047857' : '#92400e' }}>
                {credit >= 1
                ? `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ (ন্যূনতম ২৪০ দিন) — তাই পূর্ণ এক বছর গণ্য হয়েছে।`
                : credit > 0
                    ? `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ (ন্যূনতম ১২০ দিন) — তাই ছয় মাস গণ্য হয়েছে।`
                    : `অসম্পূর্ণ অংশে ${calc.totalDays} দিন কাজ — ন্যূনতম ১২০ দিন না হওয়ায় কোনো অতিরিক্ত মেয়াদ গণ্য হয়নি।`}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* ── B. Wages ── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>সর্বশেষ ধার্যকৃত মাসিক মোট মজুরির বিবরণ</div>
        <div className="lw-grid">
          <div data-field="totalMonthlyWage"><label style={labelStyle}>মোট মজুরি বা বেতন *</label><input type="number" min="0" value={data.totalMonthlyWage} onChange={e => set('totalMonthlyWage', e.target.value)} style={{ ...amountInput, ...bad('totalMonthlyWage') }} />{err('totalMonthlyWage')}</div>
          <div><label style={labelStyle}>খাদ্য ভাতা</label><input type="number" min="0" value={data.foodAllowance} onChange={e => set('foodAllowance', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>চিকিৎসা ভাতা</label><input type="number" min="0" value={data.medicalAllowance} onChange={e => set('medicalAllowance', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>যাতায়াত ভাতা</label><input type="number" min="0" value={data.transportAllowance} onChange={e => set('transportAllowance', e.target.value)} style={inputStyle} /></div>
          <div className="s4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip label="মূল মজুরি" value={money(calc.basic)} /><Chip label="বাড়ি ভাড়া" value={money(calc.houseRent)} />
            <Chip label="এক দিনের মূল মজুরি" value={money(calc.dailyBasic)} /><Chip label="এক দিনের মোট মজুরি" value={money(calc.dailyGross)} />
            <Chip label="ওভারটাইম হার (ঘন্টা)" value={money(calc.otRate)} />
          </div>
        </div>
      </div>

      {/* ── C. Earnings (A) ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', ...cardTitle }}>হিসাবের বিবরণ — প্রাপ্য (A)</div>

        <Line tone="earn" amount={money(calc.lastMonthSalary)}
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

        <Line tone="earn" amount={money(calc.lastMonthOvertime)}
          label={<span>{lastMonthLabel !== '—' ? `${lastMonthLabel} মাসের ` : ''}অতিরিক্ত কর্মঘন্টা</span>}
          info={<InfoBall title="অতিরিক্ত কর্মঘন্টা">{LAW_REFERENCES.overtime}</InfoBall>}>
          <input type="number" min="0" aria-label="Overtime hours" value={data.payableHours} onChange={e => set('payableHours', e.target.value)} style={inline} /><span>ঘন্টা</span>
        </Line>

        <Line tone="earn" amount={money(calc.earnedLeave)} label={<span>প্রাপ্য অর্জিত ছুটি</span>} info={<InfoBall title="অর্জিত ছুটি">{LAW_REFERENCES.earnedLeave}</InfoBall>}>
          <input type="number" min="0" aria-label="Earned leave days" value={data.elQty} onChange={e => set('elQty', e.target.value)} style={inline} /><span>দিন</span>
        </Line>

        {t === LAYOFF_TYPE && (
          <Line tone="earn" amount={money(calc.layOff)} label={<span>লে-অফ ক্ষতিপূরণ (১৬)</span>} info={<InfoBall title="লে-অফ ক্ষতিপূরণ">{LAW_REFERENCES.layOff}</InfoBall>}>
            <input type="number" min="0" aria-label="Lay-off days" value={data.layOffDays ?? ''} onChange={e => set('layOffDays', e.target.value)} style={inline} /><span>দিন</span>
          </Line>
        )}

        {hasType && !calc.gratuityEligible && t !== LAYOFF_TYPE && (
          <Line tone="earn" amount={money(calc.serviceComp)} label={<span>চাকরি অবসানজনিত ক্ষতিপূরণ</span>}
            info={<InfoBall title="ক্ষতিপূরণ">{lawText(LAW_REFERENCES.serviceCompensationByType, t)}</InfoBall>} />
        )}

        {calc.gratuityEligible && hasType && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '9px 12px', background: '#faf5ff', borderBottom: '1px solid #e9d5ff', fontFamily: font, fontSize: 12.5 }}>
              <strong>পেমেন্ট পদ্ধতি:</strong>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="paymentMethod" checked={!calc.usesGratuity} onChange={() => set('paymentMethod', 'compensation')} />বিধিবদ্ধ ক্ষতিপূরণ</label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="paymentMethod" checked={calc.usesGratuity} onChange={() => set('paymentMethod', 'gratuity')} />গ্র্যাচুইটি</label>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#64748b' }}>রেফারেন্স — ক্ষতিপূরণ: {money(calc.refCompensation)} টাকা | গ্র্যাচুইটি: {money(calc.gratuity)} টাকা</span>
            </div>
            {!calc.usesGratuity ? (
              <>
                <Line tone="earn" amount={money(calc.serviceComp)} label={<span>চাকরি অবসানজনিত ক্ষতিপূরণ</span>}
                  info={<InfoBall title="চাকরি অবসানজনিত ক্ষতিপূরণ">{lawText(LAW_REFERENCES.serviceCompensationByType, t, death ? DEATH_SERVICE_NOTE : undefined)}</InfoBall>} />
                {death && (
                  <Line tone="earn" amount={money(calc.deathComp)} label={<span>মৃত্যুজনিত ক্ষতিপূরণ (১৯)</span>}
                    info={<InfoBall title="মৃত্যুজনিত ক্ষতিপূরণ">{lawText(LAW_REFERENCES.deathCompensationByType, t)}</InfoBall>} />
                )}
              </>
            ) : (
              <Line tone="earn" amount={money(calc.gratuity)} label={<span>গ্র্যাচুইটি</span>} info={<InfoBall title="গ্র্যাচুইটি">{LAW_REFERENCES.gratuity}</InfoBall>} />
            )}
          </>
        )}

        {NOTICE_PAY_TYPES.includes(t) && (
          <Line tone="earn" amount={money(calc.notice)} label={<span>নোটিশ পে</span>} info={<InfoBall title="নোটিশ পে">{LAW_REFERENCES.noticePay}</InfoBall>}>
            <input type="number" min="0" aria-label="Notice pay days" value={data.noticePayDay} onChange={e => set('noticePayDay', e.target.value)} style={inline} /><span>দিন</span>
          </Line>
        )}

        <Line tone="earn" label={<span>অন্যান্য:</span>}
          amountNode={<input type="number" min="0" aria-label="Other earnings" value={data.others} onChange={e => set('others', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
          <input aria-label="Other earnings detail" value={data.otherBenefits ?? ''} onChange={e => set('otherBenefits', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
        </Line>
        <Total label="মোট প্রাপ্য (A)" value={money(calc.totalReceivable)} bg="#16a34a" />
      </div>

      {/* ── D. Deductions (B) ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', ...cardTitle }}>কর্তন (B)</div>
        {NOTICE_DEDUCTION_TYPES.includes(t) && (
          <Line tone="deduct" amount={money(calc.noticeDeduction)} label={<span>কর্তন (নোটিশ বাবদ):</span>}>
            <input type="number" min="0" aria-label="Notice deduction days" value={data.noticeDeductionDay} onChange={e => set('noticeDeductionDay', e.target.value)} style={inline} /><span>দিন</span>
          </Line>
        )}
        <Line tone="deduct" label={<span>কর্তন (অগ্রিম গ্রহণ বাবদ):</span>}
          amountNode={<input type="number" min="0" aria-label="Advance deduction" value={data.advanceDeduction} onChange={e => set('advanceDeduction', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
          <input aria-label="Advance detail" value={data.deductionForAdvance ?? ''} onChange={e => set('deductionForAdvance', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
        </Line>
        <Line tone="deduct" label={<span>অন্যান্য কর্তন:</span>}
          amountNode={<input type="number" min="0" aria-label="Other deduction" value={data.otherDeduction} onChange={e => set('otherDeduction', e.target.value)} style={{ ...amountInput, width: 130 }} />}>
          <input aria-label="Other deduction detail" value={data.deductionParticularsB ?? ''} onChange={e => set('deductionParticularsB', e.target.value)} placeholder="বিবরণ লিখুন" style={inlineWide} />
        </Line>
        <Total label="মোট কর্তন (B)" value={money(calc.totalDeductions)} bg="#d97706" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#ecfdf5', borderTop: '2px solid #10b981', fontFamily: font }}>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#065f46' }}>সর্বমোট নিট প্রাপ্য (A − B)</span>
          <span style={{ fontWeight: 900, fontSize: 20, color: calc.finalTotal < 0 ? '#b91c1c' : '#047857' }}>{calc.finalTotal.toLocaleString('en-US')} টাকা</span>
        </div>
      </div>

      {/* ── E. Payment ── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>পেমেন্ট অবস্থা</div>
        <div className="lw-grid">
          <div>
            <label style={labelStyle}>Status</label>
            <select value={data.paymentStatus ?? ''} onChange={e => setData({ ...data, paymentStatus: e.target.value, paymentDate: e.target.value === 'Paid' && !data.paymentDate ? data.settlementDate : data.paymentDate })} style={inputStyle}>
              <option value="Pending">Pending</option><option value="Paid">Paid</option><option value="">— (not tracked)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Payment date</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.paymentDate ?? ''} onChange={v => set('paymentDate', v)} ariaLabel="Payment date" clearable boxStyle={dateBox} /></div>
          </div>
          <div className="s2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Chip label="বেতন প্রদানের শেষ তারিখ (৭ কর্মদিবস)" value={formatDMY(calc.salaryDueDate) || '—'} />
            <Chip label="অন্যান্য পাওনা প্রদানের শেষ তারিখ (৩০ দিন)" value={formatDMY(calc.otherDueDate) || '—'} />
          </div>
          <div className="s4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" disabled={!calc.salaryDueDate} onClick={() => set('paymentDate', calc.salaryDueDate)} style={{ ...btn('#1e3a5f'), padding: '4px 10px', fontSize: 11.5, opacity: calc.salaryDueDate ? 1 : 0.5 }}>বেতনের তারিখ নিন</button>
            <button type="button" disabled={!calc.otherDueDate} onClick={() => set('paymentDate', calc.otherDueDate)} style={{ ...btn('#1e3a5f'), padding: '4px 10px', fontSize: 11.5, opacity: calc.otherDueDate ? 1 : 0.5 }}>অন্যান্য পাওনার তারিখ নিন</button>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>
              Settlement date: <strong>{formatDMY(data.settlementDate) || '—'}</strong> (change it in the page header).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}