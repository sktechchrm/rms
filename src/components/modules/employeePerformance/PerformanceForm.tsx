// ─────────────────────────────────────────────────────────────────────────────
// PerformanceForm.tsx — fixed form, one review per save, with a
// dynamically-sized KPI table.
// Path: src/components/modules/employeePerformance/PerformanceForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  RATING_CATEGORY_OPTIONS, RATING_STYLE, blankKPIItem, calculateWeightedScore, getOverallScore,
} from './types';
import type { PerformanceReviewData, KPIItem } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

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
const smallInput: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, fontFamily: font, color: '#1e3a5f',
  marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e2e8f0',
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};

interface Props {
  data: PerformanceReviewData;
  setData: (data: PerformanceReviewData) => void;
}

export default function PerformanceForm({ data, setData }: Props) {
  const set = <K extends keyof PerformanceReviewData>(field: K, value: PerformanceReviewData[K]) =>
    setData({ ...data, [field]: value });

  const handleKPIChange = (index: number, field: keyof KPIItem, value: string) => {
    const updated = [...data.kpiItems];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, kpiItems: updated });
  };

  const addKPI = () => {
    const reNumbered = [blankKPIItem(1), ...data.kpiItems].map((k, i) => ({ ...k, slNo: i + 1 }));
    setData({ ...data, kpiItems: reNumbered });
  };

  const removeKPI = (index: number) => {
    if (data.kpiItems.length <= 1) return;
    const filtered = data.kpiItems.filter((_, i) => i !== index);
    setData({ ...data, kpiItems: filtered.map((k, i) => ({ ...k, slNo: i + 1 })) });
  };

  const weightedScore = calculateWeightedScore(data.kpiItems);
  const overallScore = getOverallScore(data);
  const totalWeight = data.kpiItems.reduce((sum, k) => sum + (Number(k.weight) || 0), 0);
  const ratingStyle = data.ratingCategory ? RATING_STYLE[data.ratingCategory] : null;

  return (
    <>
      <div style={sectionCard}>
        <div style={sectionTitle}>কর্মীর তথ্য ও পর্যালোচনা চক্র</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>কর্মীর নাম *</label>
            <input value={data.employeeName} onChange={e => set('employeeName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>কার্ড নং *</label>
            <input value={data.cardNo} onChange={e => set('cardNo', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পদবী</label>
            <input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>বিভাগ</label>
            <input value={data.department} onChange={e => set('department', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পর্যালোচনা চক্র *</label>
            <input value={data.reviewCycle} onChange={e => set('reviewCycle', e.target.value)} placeholder="যেমনঃ ২০২৬ বার্ষিক, ২০২৬ Q1" style={inputStyle} />
          </div>
          <div />
          <div style={fieldWrap}>
            <label style={labelStyle}>পর্যালোচনা মেয়াদ শুরু</label>
            <input type="date" value={data.reviewPeriodStart} onChange={e => set('reviewPeriodStart', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পর্যালোচনা মেয়াদ শেষ</label>
            <input type="date" value={data.reviewPeriodEnd} onChange={e => set('reviewPeriodEnd', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionTitle as React.CSSProperties}>KPI / লক্ষ্যমাত্রা {totalWeight > 0 && totalWeight !== 100 && (
            <span style={{ fontSize: 11, fontWeight: 500, color: '#92400e' }}>(মোট ওজন {totalWeight}% — সাধারণত ১০০% হওয়া উচিত)</span>
          )}</div>
          <button onClick={addKPI} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font, flexShrink: 0 }}>
            + KPI যোগ করুন
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 36 }}>SL</th>
                <th style={thStyle}>বিবরণ</th>
                <th style={{ ...thStyle, width: 150 }}>লক্ষ্যমাত্রা</th>
                <th style={{ ...thStyle, width: 150 }}>অর্জিত</th>
                <th style={{ ...thStyle, width: 90 }}>ওজন (%)</th>
                <th style={{ ...thStyle, width: 90 }}>স্কোর (/৫)</th>
                <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
              </tr>
            </thead>
            <tbody>
              {data.kpiItems.map((k, index) => (
                <tr key={index}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{k.slNo}</td>
                  <td style={tdStyle}><input value={k.description} onChange={e => handleKPIChange(index, 'description', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input value={k.target} onChange={e => handleKPIChange(index, 'target', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input value={k.achieved} onChange={e => handleKPIChange(index, 'achieved', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input type="number" value={k.weight} onChange={e => handleKPIChange(index, 'weight', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input type="number" min={0} max={5} step={0.5} value={k.score} onChange={e => handleKPIChange(index, 'score', e.target.value)} style={smallInput} /></td>
                  <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                    <button onClick={() => removeKPI(index)} title="Remove" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, fontFamily: font, color: '#1e40af', fontWeight: 600 }}>
          ওজনভিত্তিক গড় স্কোর: {weightedScore.toFixed(2)} / ৫
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>মূল্যায়ন</div>
        <div style={fieldWrap}>
          <label style={labelStyle}>স্ব-মূল্যায়ন</label>
          <textarea value={data.selfAssessment} onChange={e => set('selfAssessment', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>সুপারভাইজার মূল্যায়ন</label>
          <textarea value={data.supervisorAssessment} onChange={e => set('supervisorAssessment', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>রেটিং ক্যাটাগরি</label>
            <select
              value={data.ratingCategory}
              onChange={e => set('ratingCategory', e.target.value as PerformanceReviewData['ratingCategory'])}
              style={{ ...inputStyle, ...(ratingStyle ? { background: ratingStyle.bg, color: ratingStyle.color, fontWeight: 700 } : {}) }}
            >
              <option value="">নির্বাচন করুন</option>
              {RATING_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>চূড়ান্ত স্কোর override (ঐচ্ছিক)</label>
            <input type="number" min={0} max={5} step={0.1} value={data.overallScoreOverride} onChange={e => set('overallScoreOverride', e.target.value)} placeholder={`স্বয়ংক্রিয়: ${weightedScore.toFixed(2)}`} style={inputStyle} />
          </div>
        </div>

        <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 15, fontFamily: font, color: '#15803d', fontWeight: 700 }}>
          চূড়ান্ত স্কোর: {overallScore.toFixed(2)} / ৫
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>পর্যালোচনাকারী ও সুপারিশ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>পর্যালোচনাকারীর নাম</label>
            <input value={data.reviewerName} onChange={e => set('reviewerName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পদবী</label>
            <input value={data.reviewerDesignation} onChange={e => set('reviewerDesignation', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পর্যালোচনার তারিখ</label>
            <input type="date" value={data.reviewDate} onChange={e => set('reviewDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>প্রস্তাবিত ইনক্রিমেন্ট (%)</label>
            <input type="number" value={data.recommendedIncrementPercent} onChange={e => set('recommendedIncrementPercent', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>মন্তব্য</label>
          <textarea value={data.comments} onChange={e => set('comments', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
      </div>
    </>
  );
}
