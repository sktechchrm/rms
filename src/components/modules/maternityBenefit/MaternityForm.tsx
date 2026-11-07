// ─────────────────────────────────────────────────────────────────────────────
// MaternityForm.tsx — one compact entry form: employee · dates · wage · benefit calculation · installments.
// Replaces maternityBenefitTable.tsx. Every calculated figure comes from computeMaternity() (read-only here).
// Per-installment fields (current-month wage, payable earned leave, others) are the SELECTED installment's own
// draft — switching the installment switches which draft you edit (same rule as before).
// Path: src/components/modules/maternityBenefit/MaternityForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode, CSSProperties } from 'react';
import type { MaternityFormData, MaternityInstallment } from './MaternityBenefitTypes';
import { STATIC_DATA, getActiveInstallmentDraft, updateActiveInstallmentField } from './MaternityBenefitTypes';
import { MaternityFormula } from './MaternityFormula';
import { PAY_RULES, formatDMY, money } from './maternityModel';
import type { MaternityCalc, MaternityIssues } from './maternityModel';
import { LAW_REFERENCES } from '../../common/Lawreferences';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import InfoBall from '../livingWage/InfoBall';
import { font, labelStyle, inputStyle, readStyle, card, cardTitle, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: MaternityFormData;
  setData: (d: MaternityFormData) => void;
  calc: MaternityCalc;
  issues: MaternityIssues;
  showErrors: boolean;
}

/** প্রসূতি কল্যাণ সুবিধা — ধারা ৪৬ ও ৪৭ (shown in the ⓘ next to the benefit line). */
const MATERNITY_LAW_TEXT = 'বাংলাদেশ শ্রম (সংশোধন) আইন অনুযায়ী সংশোধিত ধারা ৪৬ ও ৪৭ অনুসারে, যোগ্য নারী শ্রমিক সন্তান প্রসবের সম্ভাব্য তারিখের পূর্ববর্তী ৬০ দিন এবং প্রসবের পরবর্তী ৬০ দিনসহ মোট ১২০ দিনের প্রসূতি কল্যাণ সুবিধা পাবেন। এ সুবিধা পেতে হলে তাঁকে প্রসবের আগে মালিকের অধীনে কমপক্ষে ৬ মাস কাজ করতে হবে। তবে, প্রসবের সময় তাঁর দুই বা ততোধিক জীবিত সন্তান থাকলে তিনি প্রসূতি কল্যাণ সুবিধা পাবেন না, যদিও প্রাপ্য ছুটি পাবেন।';

const inline: CSSProperties = { ...inputStyle, width: 64, padding: '4px 6px', textAlign: 'center', fontWeight: 700 };
const amountInput: CSSProperties = { ...inputStyle, textAlign: 'right', fontWeight: 700, fontSize: 14 };
const dateBox = { padding: '7px 10px', fontSize: 12.5 };
const sel: CSSProperties = { ...inputStyle, width: 'auto', padding: '4px 8px' };

function Chip({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const c = tone === 'good' ? { bg: '#f0fdf4', bd: '#86efac', fg: '#15803d' } : tone === 'bad' ? { bg: '#fef2f2', bd: '#fecaca', fg: '#b91c1c' } : { bg: '#f8fafc', bd: '#e2e8f0', fg: '#1e3a5f' };
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 8, padding: '6px 10px', minWidth: 118 }}>
      <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: c.fg, fontFamily: font }}>{value}</div>
    </div>
  );
}

function Line({ label, amount, amountNode, info, children }: { label: ReactNode; amount?: string; amountNode?: ReactNode; info?: ReactNode; children?: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 170px', gap: 10, alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid #e2e8f0', background: '#f8fbff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12.5, fontFamily: font, color: '#1e293b' }}>{label}{children}{info}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        {amountNode ?? <span style={{ fontWeight: 800, fontSize: 14, fontFamily: font, color: '#1e293b' }}>{amount}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontFamily: font }}>টাকা</span>
      </div>
    </div>
  );
}

export default function MaternityForm({ data, setData, calc, issues, showErrors }: Props) {
  const set = (k: keyof MaternityFormData, v: string) => setData({ ...data, [k]: v });
  const draft = getActiveInstallmentDraft(data.installments, data.activeInstallmentType);
  const setDraft = (field: keyof MaternityInstallment, value: string) =>
    setData({ ...data, installments: updateActiveInstallmentField(data.installments, data.activeInstallmentType, field, value) });

  const errorOf = (field: string) => (showErrors ? issues.errors.find(e => e.field === field)?.text : undefined);
  const err = (field: string) => { const m = errorOf(field); return m ? <div role="alert" style={{ marginTop: 3, fontSize: 11.5, color: '#dc2626', fontWeight: 600, fontFamily: font }}>{m}</div> : null; };
  const bad = (field: string): CSSProperties => (errorOf(field) ? { borderColor: '#dc2626' } : {});
  // Dynamic year lists (grow every year); a saved year outside the range is still listed.
  const latestYears = MaternityFormula.getYearOptions(data.latestYear);
  const currentYears = MaternityFormula.getYearOptions(draft.currentYear);
  const hasDates = Boolean(data.joiningDate && data.possibleDeliveryDate);

  const paidRows = data.installments.filter(i => i.status === 'paid').map(i => {
    const el = MaternityFormula.calculatePayableEarnedLeave(i.payableEarnedLeaveDays, calc.dailyStr);
    const amount = Number(i.amount) || 0, salary = Number(i.salary) || 0, others = Number(i.others) || 0;
    return { type: i.type, date: i.date, amount, salary, el, others, total: amount + salary + el + others };
  });
  const sum = (k: 'amount' | 'salary' | 'el' | 'others' | 'total') => paidRows.reduce((s, r) => s + r[k], 0);
  const th: CSSProperties = { padding: '7px 8px', fontSize: 11, fontWeight: 700, fontFamily: font, color: '#fff', background: '#1e3a5f', textAlign: 'right', whiteSpace: 'nowrap' };
  const td: CSSProperties = { padding: '7px 8px', fontSize: 12, fontFamily: font, borderBottom: '1px solid #e2e8f0', textAlign: 'right' };

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      {((showErrors && issues.errors.length > 0) || issues.warnings.length > 0) && (
        <div style={{ ...card, padding: 10, borderColor: showErrors && issues.errors.length ? '#fecaca' : '#fde68a', background: showErrors && issues.errors.length ? '#fff5f5' : '#fffbeb' }}>
          {showErrors && issues.errors.map((e, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>✕ {e.text}</div>)}
          {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', fontFamily: font }}>⚠ {m}</div>)}
        </div>
      )}

      {/* ── A. Employee + dates ── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>কর্মীর তথ্য ও তারিখ সমূহ</div>
        <div className="lw-grid">
          <div className="s2" data-field="employeeName"><label style={labelStyle}>নাম *</label><input value={data.employeeName} onChange={e => set('employeeName', e.target.value)} style={{ ...inputStyle, ...bad('employeeName') }} />{err('employeeName')}</div>
          <div><label style={labelStyle}>কার্ড নং</label><input value={data.cardNo} onChange={e => set('cardNo', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>পদবী / ক্যাটাগরি</label><input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} /></div>

          <div><label style={labelStyle}>সেকশন</label><input value={data.section} onChange={e => set('section', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>জীবিত সন্তান সংখ্যা</label><input type="number" min="0" value={data.aliveChildren} onChange={e => set('aliveChildren', e.target.value)} style={inputStyle} /></div>
          <div data-field="joiningDate">
            <label style={labelStyle}>যোগদানের তারিখ *</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.joiningDate} onChange={v => set('joiningDate', v)} ariaLabel="Joining date" max={data.possibleDeliveryDate || undefined} clearable invalid={Boolean(errorOf('joiningDate'))} boxStyle={dateBox} /></div>
            {err('joiningDate')}
          </div>
          <div>
            <label style={labelStyle}>নোটিশের তারিখ</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.maternityLeavenoticedDate ?? ''} onChange={v => set('maternityLeavenoticedDate', v)} ariaLabel="Notice date" clearable boxStyle={dateBox} /></div>
          </div>

          <div>
            <label style={labelStyle}>প্রসূতি লক্ষণের তারিখ</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.maternitySymptomDate} onChange={v => set('maternitySymptomDate', v)} ariaLabel="Symptom date" clearable boxStyle={dateBox} /></div>
          </div>
          <div data-field="possibleDeliveryDate">
            <label style={labelStyle}>সম্ভাব্য প্রসবের তারিখ *</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.possibleDeliveryDate} onChange={v => set('possibleDeliveryDate', v)} ariaLabel="Possible delivery date" min={data.joiningDate || undefined} clearable invalid={Boolean(errorOf('possibleDeliveryDate'))} boxStyle={dateBox} /></div>
            {err('possibleDeliveryDate')}
          </div>
          <div><label style={labelStyle}>ছুটি শুরুর তারিখ <span style={{ fontSize: 10, color: '#94a3b8' }}>স্বয়ংক্রিয়</span></label><div style={readStyle}>{formatDMY(calc.leaveStart) || '—'}</div></div>
          <div><label style={labelStyle}>ছুটি শেষের তারিখ <span style={{ fontSize: 10, color: '#94a3b8' }}>স্বয়ংক্রিয়</span></label><div style={readStyle}>{formatDMY(calc.leaveEnd) || '—'}</div></div>

          <div className="s4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Chip label="চাকরির মেয়াদ" value={hasDates ? `${calc.years} বছর ${calc.months} মাস ${calc.days} দিন` : '—'} />
            <Chip label="সুবিধা প্রাপ্তির ধরণ" value={calc.eligibility || '—'} tone={!calc.eligibility ? undefined : calc.eligible ? 'good' : 'bad'} />
            {hasDates && <Chip label="মেয়াদ ≥ ৬ মাস" value={calc.serviceOk ? '✓ হ্যাঁ' : '✕ না'} tone={calc.serviceOk ? 'good' : 'bad'} />}
            {hasDates && <Chip label="জীবিত সন্তান ≤ ১" value={calc.childrenOk ? '✓ হ্যাঁ' : '✕ না'} tone={calc.childrenOk ? 'good' : 'bad'} />}
            {calc.eligible && <Chip label="১ম কিস্তির সময়সীমা" value={formatDMY(calc.firstDue) || '— (নোটিশের তারিখ দিন)'} />}
            {calc.eligible && <Chip label="২য় কিস্তির সময়সীমা" value={formatDMY(calc.secondDue) || '—'} />}
            {calc.eligible && <InfoBall title="কিস্তির সময়সীমা">১ম কিস্তি: {PAY_RULES.first.text}। ২য় কিস্তি: {PAY_RULES.second.text}। শুক্রবার বাদ দিয়ে কর্মদিবস গণনা করা হয়। নিয়মটি maternityModel.ts-এর PAY_RULES-এ পরিবর্তনযোগ্য।</InfoBall>}
          </div>
        </div>
      </div>

      {/* ── B. Wage ── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>সর্বশেষ ধার্যকৃত মোট মজুরির বিবরণ</div>
        <div className="lw-grid">
          <div className="s2" style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>মাস</label>
              <select value={data.latestMonth} onChange={e => set('latestMonth', e.target.value)} style={inputStyle}>
                <option value="">--মাস--</option>{STATIC_DATA.bengaliMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ width: 96 }}>
              <label style={labelStyle}>বছর</label>
              <select value={data.latestYear} onChange={e => set('latestYear', e.target.value)} style={inputStyle}>
                <option value="">বছর</option>{latestYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div data-field="totalMonthlyWage"><label style={labelStyle}>মোট মজুরি (টাকা) *</label><input type="number" min="0" value={data.totalMonthlyWage} onChange={e => set('totalMonthlyWage', e.target.value)} style={{ ...amountInput, ...bad('totalMonthlyWage') }} />{err('totalMonthlyWage')}</div>
          <div style={{ alignSelf: 'end' }}><Chip label={`এক দিনের গড় মজুরি (${data.totalMonthlyWage || '0'} ÷ 26)`} value={money(calc.daily)} /></div>
        </div>
      </div>

      {/* ── C. Benefit calculation ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', ...cardTitle }}>মাতৃত্বকালীন সুবিধার হিসাব</div>

        {calc.eligible && (
          <Line amount={money(calc.benefit)} label={<span style={{ fontWeight: 600 }}>প্রসূতি কল্যাণ সুবিধা</span>}
            info={<InfoBall title="প্রসূতি কল্যাণ সুবিধা">{MATERNITY_LAW_TEXT}</InfoBall>}>
            <select aria-label="Installment" value={data.activeInstallmentType} onChange={e => set('activeInstallmentType', e.target.value)} style={sel}>
              {STATIC_DATA.benefitInstallments.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>({calc.benefitDays} দিন × {calc.dailyStr} টাকা)</span>
          </Line>
        )}

        <Line amount={money(calc.salary)} label={<span>বর্তমান মাস</span>}
          info={<InfoBall title="বর্তমান মাসের প্রাপ্য মজুরি">{LAW_REFERENCES.maternityCurrentMonthWage}</InfoBall>}>
          <select aria-label="Current month" value={draft.currentMonth} onChange={e => setDraft('currentMonth', e.target.value)} style={sel}>
            <option value="">--মাস--</option>{STATIC_DATA.bengaliMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select aria-label="Current year" value={draft.currentYear} onChange={e => setDraft('currentYear', e.target.value)} style={sel}>
            <option value="">বছর</option>{currentYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span>এর</span><input type="number" min="0" aria-label="Days" value={draft.earnedLeaveDays} onChange={e => setDraft('earnedLeaveDays', e.target.value)} placeholder="দিন" style={inline} /><span>দিনের প্রাপ্য মজুরি</span>
        </Line>

        <Line amount={money(calc.payableEL)} label={<span>প্রাপ্য অর্জিত ছুটি</span>}
          info={<InfoBall title="প্রাপ্য অর্জিত ছুটি">{LAW_REFERENCES.maternityCurrentMonthWage}</InfoBall>}>
          <input type="number" min="0" aria-label="Payable earned leave days" value={draft.payableEarnedLeaveDays || ''} onChange={e => setDraft('payableEarnedLeaveDays', e.target.value)} placeholder="0" style={inline} /><span>দিন</span>
        </Line>

        <Line amount={money(calc.others)} label={<span>অন্যান্য:</span>}>
          <input aria-label="Others detail" value={draft.othersLabel} onChange={e => setDraft('othersLabel', e.target.value)} placeholder="বিবরণ লিখুন" style={{ ...inputStyle, width: 150, padding: '4px 8px', fontSize: 12 }} />
          <input type="number" aria-label="Others value" value={draft.otherBenefitsValue} onChange={e => setDraft('otherBenefitsValue', e.target.value)} placeholder="সংখ্যা" style={{ ...inline, width: 76 }} />
          <select aria-label="Others type" value={draft.otherBenefitsType} onChange={e => setDraft('otherBenefitsType', e.target.value)} style={sel}>
            {STATIC_DATA.benefitTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Line>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f2442', color: '#fff', fontFamily: font }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>সর্বমোট প্রাপ্য{data.activeInstallmentType ? ` (${data.activeInstallmentType})` : ''}</span>
          <span style={{ fontWeight: 900, fontSize: 20 }}>৳ {money(calc.total)}</span>
        </div>
      </div>

      {/* ── D. Installment history (read-only) ── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={cardTitle}>কিস্তি ব্যবস্থাপনা</div>
          <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>{paidRows.length ? `${paidRows.length}টি কিস্তি পরিশোধিত` : 'এখনো কোনো কিস্তি সংরক্ষণ করা হয়নি'}</span>
          <InfoBall title="কিস্তি সম্পাদনা">পরিশোধিত কিস্তি সম্পাদনা করতে উপরের তালিকা থেকে সেই কিস্তি নির্বাচন করুন, তথ্য বদলান এবং আবার সংরক্ষণ করুন।</InfoBall>
        </div>
        {paidRows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead><tr>
                <th style={{ ...th, textAlign: 'left' }}>বিলের তারিখ</th><th style={{ ...th, textAlign: 'left' }}>কিস্তি</th>
                <th style={th}>সুবিধা</th><th style={th}>মজুরি</th><th style={th}>অর্জিত ছুটি</th><th style={th}>অন্যান্য</th><th style={th}>মোট</th>
              </tr></thead>
              <tbody>
                {paidRows.map(r => (
                  <tr key={r.type}>
                    <td style={{ ...td, textAlign: 'left' }}>{formatDMY(r.date) || '—'}</td>
                    <td style={{ ...td, textAlign: 'left' }}><span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>✓ {r.type}</span></td>
                    <td style={td}>{money(r.amount)}</td><td style={td}>{money(r.salary)}</td><td style={td}>{money(r.el)}</td><td style={td}>{money(r.others)}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{money(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr style={{ background: '#0f2442', color: '#fff' }}>
                <td colSpan={2} style={{ ...td, color: '#fff', fontWeight: 700, borderBottom: 'none' }}>সর্বমোট</td>
                {(['amount', 'salary', 'el', 'others', 'total'] as const).map(k => <td key={k} style={{ ...td, color: '#fff', fontWeight: 700, borderBottom: 'none' }}>{money(sum(k))}</td>)}
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}