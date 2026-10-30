// ─────────────────────────────────────────────────────────────────────────────
// LivingWageForm.tsx — Living Wage Calculation (Anker structure).
// Full Calculator: every input fills from the survey data (switchable to manual).
// "Compare wage gap against" chooses Employees or the custom Workers list.
// Path: src/components/modules/livingWage/LivingWageForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  METHOD_OPTIONS, LOCATION_OPTIONS, STATISTIC_OPTIONS, GAP_DATASET_OPTIONS, COST_COMPONENTS, computeLivingWage, fmt, money, statisticLabel,
} from './types';
import type { LivingWageData, SurveyStatistic, GapDataset } from './types';
import InfoBall from './InfoBall';
import { font, labelStyle, inputStyle, readStyle, card, cardTitle, FORM_CSS } from './ui';

interface Props { data: LivingWageData; setData: (d: LivingWageData) => void; }

export default function LivingWageForm({ data, setData }: Props) {
  const set = <K extends keyof LivingWageData>(field: K, value: LivingWageData[K]) => setData({ ...data, [field]: value });
  const calc = computeLivingWage(data);
  const i = calc.inputs;
  const isCalc = data.method === 'calculator';
  const fromSurvey = i.fromSurvey;
  const noSurvey = calc.derived.n === 0;

  // Switching the survey fill OFF freezes the current survey-derived numbers into the manual fields.
  const toggleSurvey = (on: boolean) => {
    if (on) { setData({ ...data, useSurveyData: true }); return; }
    setData({
      ...data, useSurveyData: false,
      familySize: fmt(i.familySize), workersPerFamily: fmt(i.workers),
      foodCost: fmt(i.costs.food), housingCost: fmt(i.costs.housing), utilitiesCost: fmt(i.costs.utilities), healthcareCost: fmt(i.costs.healthcare),
      educationCost: fmt(i.costs.education), transportCost: fmt(i.costs.transport), clothingCost: fmt(i.costs.clothing),
      communicationCost: fmt(i.costs.communication), otherEssentialCost: fmt(i.costs.other),
    });
  };

  const row = (label: string, value: string, bold = false, top = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0', fontWeight: bold ? 700 : 400, borderTop: top ? '1px solid #e2e8f0' : undefined, marginTop: top ? 4 : 0 }}>
      <span>{label}</span><span style={{ whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
  const hint = (t: string) => <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{t}</div>;

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={cardTitle}>Method &amp; basis</div>
          <InfoBall title="Anker structure" width={370}>
            Family cost = food + housing &amp; utilities + other essentials + a contingency margin. Net living wage = family cost ÷ full-time-equivalent earners per family.
            Gross = net ÷ (1 − payroll deduction). This is estimation support built from your own survey, not a certified Anker study.
          </InfoBall>
        </div>
        <div className="lw-grid">
          <div>
            <label style={labelStyle}>Method *</label>
            <select value={data.method} onChange={e => set('method', e.target.value as LivingWageData['method'])} style={inputStyle}>
              {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <select value={data.location} onChange={e => set('location', e.target.value)} style={inputStyle}>
              {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Study year</label>
            <input value={data.studyYear} onChange={e => set('studyYear', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Source / reference</label>
            <input value={data.sourceReference} onChange={e => set('sourceReference', e.target.value)} placeholder="e.g., Worker survey, Gazipur 2026" style={inputStyle} />
          </div>
          <div className="s2">
            <label style={labelStyle}>Compare wage gap against</label>
            <select value={data.gapDataset} onChange={e => set('gapDataset', e.target.value as GapDataset)} style={inputStyle}>
              {GAP_DATASET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {hint(data.gapDataset === 'workers' ? 'Manage the Workers list in “মজুরি ব্যবধান বিশ্লেষণ”.' : 'Uses gross salary from the Employee Personal File.')}
          </div>
          {!isCalc && (
            <div className="s2">
              <label style={labelStyle}>Published benchmark amount (Tk/month) *</label>
              <input type="number" value={data.benchmarkAmount} onChange={e => set('benchmarkAmount', e.target.value)} placeholder="e.g., 25497" style={inputStyle} />
            </div>
          )}
        </div>
      </div>

      {isCalc && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={cardTitle}>Input source</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.useSurveyData} onChange={e => toggleSurvey(e.target.checked)} /> Fill from survey data
              </label>
              {fromSurvey && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontFamily: font }}>
                    Statistic
                    <select value={data.surveyStatistic} onChange={e => set('surveyStatistic', e.target.value as SurveyStatistic)} style={{ ...inputStyle, width: 'auto' }}>
                      {STATISTIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
                    <input type="checkbox" checked={data.normalizePerCapita} onChange={e => set('normalizePerCapita', e.target.checked)} /> Scale per-person costs to family size
                  </label>
                </>
              )}
            </div>
            {fromSurvey && (
              <div style={{ marginTop: 8, fontSize: 12, fontFamily: font, color: noSurvey ? '#b91c1c' : '#166534', fontWeight: 600 }}>
                {noSurvey
                  ? 'No valid survey entries yet — add workers in “জরিপ ও তথ্য সংগ্রহ” (family size is required).'
                  : `Using ${i.n} of ${calc.derived.total} survey entries · ${statisticLabel(data.surveyStatistic)}${data.normalizePerCapita ? ' · housing and utilities are household costs, the rest are per person × family size' : ''}.`}
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 8 }}>Monthly family cost components (Tk)</div>
            <div className="lw-grid">
              {COST_COMPONENTS.map(c => (
                <div key={c.key}>
                  <label style={labelStyle}>{c.label}{c.key === 'food' || c.key === 'housing' ? ' *' : ''}</label>
                  {fromSurvey
                    ? <div style={readStyle}>{fmt(i.costs[c.key])}</div>
                    : <input type="number" min="0" value={data[c.field]} onChange={e => set(c.field, e.target.value)} style={inputStyle} />}
                  {fromSurvey && hint(`from ${i.counts[c.key]} entries`)}
                </div>
              ))}
              <div>
                <label style={labelStyle}>Family size</label>
                {fromSurvey ? <div style={readStyle}>{fmt(i.familySize)}</div>
                  : <input type="number" min="0" step="any" value={data.familySize} onChange={e => set('familySize', e.target.value)} style={inputStyle} />}
                {fromSurvey && hint(`from ${i.n} entries`)}
              </div>
              <div>
                <label style={labelStyle}>FTE earners per family</label>
                {fromSurvey ? <div style={readStyle}>{fmt(i.workers)}</div>
                  : <input type="number" min="0" step="0.01" value={data.workersPerFamily} onChange={e => set('workersPerFamily', e.target.value)} style={inputStyle} />}
                {fromSurvey && hint(`from ${calc.derived.workersN} entries`)}
              </div>
              <div>
                <label style={labelStyle}>Contingency margin (%)</label>
                <input type="number" min="0" value={data.contingencyMarginPercent} onChange={e => set('contingencyMarginPercent', e.target.value)} style={inputStyle} />
                {hint('Anker uses about 5%')}
              </div>
              <div>
                <label style={labelStyle}>Payroll deduction / tax (%)</label>
                <input type="number" min="0" max="99" value={data.payrollDeductionPercent} onChange={e => set('payrollDeductionPercent', e.target.value)} style={inputStyle} />
                {hint('for the gross-up')}
              </div>
            </div>
          </div>

          <div style={{ ...card, fontFamily: font, fontSize: 12.5 }}>
            <div style={{ ...cardTitle, marginBottom: 6 }}>Calculation</div>
            {row('Food', money(calc.food))}
            {row('Housing & utilities', money(calc.housingTotal))}
            {row('Other essentials (healthcare, education, transport, clothing, communication, other)', money(calc.nfnh))}
            {row('Subtotal', money(calc.subtotal), true, true)}
            {row(`Contingency margin (${i.contingencyPct}%)`, money(calc.margin))}
            {row('Total family cost', money(calc.totalFamilyCost), true, true)}
            {row(`÷ FTE earners per family (${fmt(i.workers)})  →  Net living wage`, money(calc.net), true)}
            {row(`Gross-up for payroll deduction (${i.deductionPct}%)  →  Gross living wage`, money(calc.gross), true)}
            {i.workers <= 0 && <div style={{ color: '#b91c1c', marginTop: 6, fontWeight: 600 }}>FTE earners per family is missing, so the living wage cannot be calculated.</div>}
          </div>
        </>
      )}

      <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 15, fontFamily: font, color: '#15803d', fontWeight: 700 }}>
        Living wage (for comparison): Tk {money(calc.amount)} / month
      </div>
    </div>
  );
}