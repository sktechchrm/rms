// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentForm.tsx — fixed form, one risk entry per save.
// Path: src/components/modules/riskAssessment/RiskAssessmentForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { RISK_LEVEL_OPTIONS, RISK_LEVEL_STYLE } from './types';
import type { RiskAssessmentData } from './types';

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
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, fontFamily: font, color: '#1e3a5f',
  marginBottom: 14, marginTop: 20, paddingBottom: 8, borderBottom: '2px solid #e2e8f0',
};

interface Props {
  data: RiskAssessmentData;
  setData: (data: RiskAssessmentData) => void;
}

export default function RiskAssessmentForm({ data, setData }: Props) {
  const set = <K extends keyof RiskAssessmentData>(field: K, value: RiskAssessmentData[K]) =>
    setData({ ...data, [field]: value });

  const riskStyle = data.riskLevel ? RISK_LEVEL_STYLE[data.riskLevel] : null;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={sectionTitle}>ঝুঁকি সনাক্তকরণ</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>সেকশন *</label>
          <input value={data.section} onChange={e => set('section', e.target.value)} placeholder="যেমনঃ কাটিং মেশিন, ব্যান্ড নাইফ রুম, ডাস্ট" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>উৎস *</label>
          <input value={data.source} onChange={e => set('source', e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>ঝুঁকি সনাক্তকরণ *</label>
        <textarea value={data.riskIdentification} onChange={e => set('riskIdentification', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>প্রভাব</label>
        <textarea value={data.impact} onChange={e => set('impact', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>প্রতিকার</label>
        <textarea value={data.remedy} onChange={e => set('remedy', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>ঝুঁকির কারণ অনুসন্ধান</label>
        <textarea value={data.causeInvestigation} onChange={e => set('causeInvestigation', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>

      <div style={sectionTitle}>ঝুঁকির মাত্রা ও সংশোধনমূলক ব্যবস্থা</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>ঝুঁকির মাত্রা *</label>
          <select
            value={data.riskLevel}
            onChange={e => set('riskLevel', e.target.value as RiskAssessmentData['riskLevel'])}
            style={{ ...inputStyle, ...(riskStyle ? { background: riskStyle.bg, color: riskStyle.color, fontWeight: 700 } : {}) }}
          >
            <option value="">নির্বাচন করুন</option>
            {RISK_LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>সংশোধন/প্রতিষেধক কার্য গ্রহণের তারিখ</label>
          <input type="date" value={data.correctiveActionDate} onChange={e => set('correctiveActionDate', e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>সংশোধনমূলক/প্রতিষেধক কার্য গ্রহণ করা</label>
        <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>

      <div style={sectionTitle}>দায়িত্বপ্রাপ্ত ব্যক্তি</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>নাম</label>
          <input value={data.responsiblePersonName} onChange={e => set('responsiblePersonName', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>পদবী</label>
          <input value={data.responsiblePersonDesignation} onChange={e => set('responsiblePersonDesignation', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>মন্তব্য</label>
        <textarea value={data.remarks} onChange={e => set('remarks', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
    </div>
  );
}
