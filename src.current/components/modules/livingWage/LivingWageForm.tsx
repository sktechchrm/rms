// ─────────────────────────────────────────────────────────────────────────────
// LivingWageForm.tsx — fixed form, one study/entry per save. Two modes:
// benchmark (quick) and calculator (full Anker cost-component breakdown).
// Path: src/components/modules/livingWage/LivingWageForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  METHOD_OPTIONS, LOCATION_OPTIONS,
  calculateNFNHTotal, calculateFamilyCostSubtotal, calculateContingencyMargin,
  calculateTotalFamilyCost, calculateNetLivingWage, calculateGrossLivingWage,
  getLivingWageAmount,
} from './types';
import type { LivingWageData } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

interface Props {
  data: LivingWageData;
  setData: (data: LivingWageData) => void;
}

const fieldWrap: React.CSSProperties = { marginBottom: 16 };
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b',
  display: 'block', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e3a5f',
  marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e2e8f0',
};

export default function LivingWageFormComponent({ data, setData }: Props) {
  const set = <K extends keyof LivingWageData>(field: K, value: LivingWageData[K]) =>
    setData({ ...data, [field]: value });

  const isCalculator = data.method === 'calculator';
  const nfnh          = calculateNFNHTotal(data);
  const subtotal       = calculateFamilyCostSubtotal(data);
  const margin          = calculateContingencyMargin(data);
  const totalFamilyCost = calculateTotalFamilyCost(data);
  const netLW           = calculateNetLivingWage(data);
  const grossLW         = calculateGrossLivingWage(data);
  const finalAmount    = getLivingWageAmount(data);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={{
        marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, fontSize: 12, fontFamily: font, color: '#1e40af', lineHeight: 1.6,
      }}>
        Based on the Anker Methodology (Global Living Wage Coalition / Anker Research Institute) —
        the widely-used standard for RMG living wage estimation. This is estimation support, not a
        certified Anker study (which requires local primary data collection by trained researchers).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Method *</label>
          <select value={data.method} onChange={e => set('method', e.target.value as LivingWageData['method'])} style={inputStyle}>
            {METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Location</label>
          <select value={data.location} onChange={e => set('location', e.target.value)} style={inputStyle}>
            {LOCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Study Year</label>
          <input value={data.studyYear} onChange={e => set('studyYear', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Source / Reference</label>
          <input value={data.sourceReference} onChange={e => set('sourceReference', e.target.value)} placeholder="e.g., Anker Research Institute, Dhaka Benchmark 2025" style={inputStyle} />
        </div>
      </div>

      {!isCalculator && (
        <div style={fieldWrap}>
          <label style={labelStyle}>Published Benchmark Amount (Tk/month) *</label>
          <input type="number" value={data.benchmarkAmount} onChange={e => set('benchmarkAmount', e.target.value)} placeholder="e.g., 25497" style={inputStyle} />
        </div>
      )}

      {isCalculator && (
        <>
          <div style={sectionTitle}>Family Cost Components (monthly, per family)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Food Cost *</label>
              <input type="number" value={data.foodCost} onChange={e => set('foodCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Housing Cost *</label>
              <input type="number" value={data.housingCost} onChange={e => set('housingCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Healthcare</label>
              <input type="number" value={data.healthcareCost} onChange={e => set('healthcareCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Education</label>
              <input type="number" value={data.educationCost} onChange={e => set('educationCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Transport</label>
              <input type="number" value={data.transportCost} onChange={e => set('transportCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Clothing</label>
              <input type="number" value={data.clothingCost} onChange={e => set('clothingCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Communication</label>
              <input type="number" value={data.communicationCost} onChange={e => set('communicationCost', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Other Essentials (personal care, household goods, etc.)</label>
              <input type="number" value={data.otherEssentialCost} onChange={e => set('otherEssentialCost', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={sectionTitle}>Household &amp; Adjustment Assumptions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Contingency Margin (%)</label>
              <input type="number" value={data.contingencyMarginPercent} onChange={e => set('contingencyMarginPercent', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Family Size</label>
              <input type="number" value={data.familySize} onChange={e => set('familySize', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Workers per Family</label>
              <input type="number" step="0.01" value={data.workersPerFamily} onChange={e => set('workersPerFamily', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Payroll Deduction/Tax (%) — for gross-up</label>
              <input type="number" value={data.payrollDeductionPercent} onChange={e => set('payrollDeductionPercent', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, fontSize: 12.5, fontFamily: font }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>NFNH subtotal</span><b>{nfnh.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Food + Housing + NFNH</span><b>{subtotal.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Contingency margin</span><b>{margin.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}><span>Total family cost</span><b>{totalFamilyCost.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Net living wage / worker</span><b>{netLW.toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gross living wage / worker</span><b>{grossLW.toFixed(2)}</b></div>
          </div>
        </>
      )}

      <div style={{
        marginTop: 16, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac',
        borderRadius: 8, fontSize: 15, fontFamily: font, color: '#15803d', fontWeight: 700,
      }}>
        Living Wage (for comparison): Tk {finalAmount.toFixed(2)} / month
      </div>
    </div>
  );
}
