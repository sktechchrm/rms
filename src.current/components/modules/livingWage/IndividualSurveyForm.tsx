// ─────────────────────────────────────────────────────────────────────────────
// IndividualSurveyForm.tsx — Physical Individual Survey, per explicit
// request. Anker Methodology requires local participation (actual worker
// interviews/home visits), not just aggregate assumptions — this records
// individual survey entries and cross-checks them against the calculator's
// familySize/workersPerFamily inputs.
// Path: src/components/modules/livingWage/IndividualSurveyForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { IndividualSurveyEntry } from './types';
import { blankSurveyEntry, summarizeSurveys } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  verticalAlign: 'middle',
};

interface Props {
  surveys: IndividualSurveyEntry[];
  setSurveys: (surveys: IndividualSurveyEntry[]) => void;
  calculatorFamilySize: string;
  calculatorWorkersPerFamily: string;
}

export default function IndividualSurveyForm({ surveys, setSurveys, calculatorFamilySize, calculatorWorkersPerFamily }: Props) {

  const handleChange = (index: number, field: keyof IndividualSurveyEntry, value: string) => {
    const updated = [...surveys];
    updated[index] = { ...updated[index], [field]: value };
    setSurveys(updated);
  };

  const addEntry = () => {
    const reNumbered = [blankSurveyEntry(1), ...surveys].map((s, i) => ({ ...s, slNo: i + 1 }));
    setSurveys(reNumbered);
  };

  const removeEntry = (index: number) => {
    const filtered = surveys.filter((_, i) => i !== index);
    const reNumbered = filtered.map((s, i) => ({ ...s, slNo: i + 1 }));
    setSurveys(reNumbered);
  };

  const summary = summarizeSurveys(surveys);
  const familySizeDiff = summary.count > 0 ? summary.avgFamilySize - (Number(calculatorFamilySize) || 0) : 0;
  const earnersDiff = summary.count > 0 ? summary.avgEarners - (Number(calculatorWorkersPerFamily) || 0) : 0;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{
        margin: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, fontSize: 12, fontFamily: font, color: '#1e40af', lineHeight: 1.6,
      }}>
        Anker Methodology requires local participation — real interviews with workers about
        their actual family size and expenses, not just secondary/assumed data. Record individual
        worker surveys here to cross-check against the calculator's assumptions.
      </div>

      {summary.count > 0 && (
        <div style={{ margin: '0 16px 16px', padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, fontFamily: font }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#1e3a5f' }}>Survey Summary ({summary.count} worker(s) surveyed)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div>Avg. Family Size: <b>{summary.avgFamilySize.toFixed(2)}</b>
              {Math.abs(familySizeDiff) > 0.3 && <span style={{ color: '#b91c1c' }}> (calculator uses {calculatorFamilySize} — {familySizeDiff > 0 ? '+' : ''}{familySizeDiff.toFixed(2)} diff)</span>}
            </div>
            <div>Avg. Earners/Family: <b>{summary.avgEarners.toFixed(2)}</b>
              {Math.abs(earnersDiff) > 0.2 && <span style={{ color: '#b91c1c' }}> (calculator uses {calculatorWorkersPerFamily} — {earnersDiff > 0 ? '+' : ''}{earnersDiff.toFixed(2)} diff)</span>}
            </div>
            <div>Avg. Food Expense: <b>{summary.avgFoodExpense.toFixed(2)}</b></div>
            <div>Avg. Housing Expense: <b>{summary.avgHousingExpense.toFixed(2)}</b></div>
            <div>Avg. Other Expense: <b>{summary.avgOtherExpense.toFixed(2)}</b></div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b' }}>Individual Worker Surveys</span>
        <button
          onClick={addEntry}
          style={{
            background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font,
          }}
        >
          + Add Survey Entry
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }}>SL</th>
              <th style={thStyle}>Worker Name</th>
              <th style={{ ...thStyle, width: 100 }}>Worker ID</th>
              <th style={{ ...thStyle, width: 130 }}>Survey Date</th>
              <th style={{ ...thStyle, width: 90 }}>Family Size</th>
              <th style={{ ...thStyle, width: 90 }}>Earners</th>
              <th style={{ ...thStyle, width: 110 }}>Food Exp.</th>
              <th style={{ ...thStyle, width: 110 }}>Housing Exp.</th>
              <th style={{ ...thStyle, width: 110 }}>Other Exp.</th>
              <th style={thStyle}>Surveyor</th>
              <th style={thStyle}>Notes</th>
              <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
            </tr>
          </thead>
          <tbody>
            {surveys.length === 0 && (
              <tr><td colSpan={12} style={{ ...tdStyle, borderRight: 'none', textAlign: 'center', color: '#94a3b8', padding: 24 }}>No survey entries yet — click "+ Add Survey Entry" to record a worker interview</td></tr>
            )}
            {surveys.map((s, index) => (
              <tr key={index}>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{s.slNo}</td>
                <td style={tdStyle}><input value={s.workerName} onChange={e => handleChange(index, 'workerName', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input value={s.workerId} onChange={e => handleChange(index, 'workerId', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="date" value={s.surveyDate} onChange={e => handleChange(index, 'surveyDate', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={s.actualFamilySize} onChange={e => handleChange(index, 'actualFamilySize', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={s.actualEarnersInFamily} onChange={e => handleChange(index, 'actualEarnersInFamily', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={s.reportedFoodExpense} onChange={e => handleChange(index, 'reportedFoodExpense', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={s.reportedHousingExpense} onChange={e => handleChange(index, 'reportedHousingExpense', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input type="number" value={s.reportedOtherExpense} onChange={e => handleChange(index, 'reportedOtherExpense', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input value={s.surveyorName} onChange={e => handleChange(index, 'surveyorName', e.target.value)} style={inputStyle} /></td>
                <td style={tdStyle}><input value={s.notes} onChange={e => handleChange(index, 'notes', e.target.value)} style={inputStyle} /></td>
                <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                  <button onClick={() => removeEntry(index)} title="Remove entry" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
