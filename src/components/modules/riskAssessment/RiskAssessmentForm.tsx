// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentForm.tsx — compact one-screen form (6-column grid, 4 rows).
// Path: src/components/modules/riskAssessment/RiskAssessmentForm.tsx
//
// Likelihood (1–5) × Severity (1–5) → score and level are calculated live.
// Dates use DateFieldDMY (typed DD-MM-YYYY or calendar) from the CAP form.
// Section: pick from the list or type any name.
// Text boxes are 2 lines high and can be dragged taller when needed.
// ─────────────────────────────────────────────────────────────────────────────

import {
  RISK_LEVEL_STYLE, LIKELIHOOD_OPTIONS, SEVERITY_OPTIONS, parseScale, levelFromScore, assessmentText,
} from './types';
import type { RiskAssessmentData } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const fieldWrap: React.CSSProperties = { minWidth: 0 };
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, fontFamily: font, color: '#1e293b', display: 'block', marginBottom: 3,
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 9px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12.5,
  fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const areaStyle: React.CSSProperties = { ...inputStyle, height: 52, minHeight: 40, resize: 'vertical', lineHeight: 1.35 };

const FORM_CSS = `
  .ra-form { container-type: inline-size; }
  .ra-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px 12px; align-items: start; }
  .ra-grid > .s2 { grid-column: span 2; }
  .ra-grid > .s6 { grid-column: span 6; }
  @container (max-width: 900px) {
    .ra-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .ra-grid > .s6 { grid-column: span 4; }
  }
  @container (max-width: 560px) {
    .ra-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ra-grid > .s6 { grid-column: span 2; }
  }
  @container (max-width: 380px) {
    .ra-grid { grid-template-columns: minmax(0, 1fr); }
    .ra-grid > .s2, .ra-grid > .s6 { grid-column: span 1; }
  }
`;

const SECTION_SUGGESTIONS = [
  'কাটিং', 'সেলাই', 'ফিনিশিং', 'প্যাকিং', 'কোয়ালিটি', 'স্টোর', 'জেনারেটর রুম', 'বয়লার',
  'মেইনটেন্যান্স', 'ক্যান্টিন', 'অফিস',
];

interface Props {
  data: RiskAssessmentData;
  setData: (data: RiskAssessmentData) => void;
  /** Sections already used in saved entries (added to the suggestions). Optional. */
  savedSections?: string[];
}

export default function RiskAssessmentForm({ data, setData, savedSections = [] }: Props) {
  const set = <K extends keyof RiskAssessmentData>(field: K, value: RiskAssessmentData[K]) =>
    setData({ ...data, [field]: value });

  const l = parseScale(data.likelihood);
  const s = parseScale(data.severity);
  const level = l && s ? levelFromScore(l * s) : '';
  const st = level ? RISK_LEVEL_STYLE[level] : null;

  const sectionOptions = Array.from(new Set([...SECTION_SUGGESTIONS, ...savedSections.map(x => x.trim()).filter(Boolean)]));

  return (
    <div className="ra-form" style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 10, boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflowWrap: 'anywhere' }}>
      <style>{FORM_CSS}</style>
      <div className="ra-grid">

        {/* Row 1 — what and how risky */}
        <div style={fieldWrap}>
          <label style={labelStyle}>সেকশন / বিভাগ *</label>
          <input list="ra-section-list" value={data.section} onChange={e => set('section', e.target.value)}
            placeholder="নির্বাচন বা লিখুন" autoComplete="off" style={inputStyle} />
          <datalist id="ra-section-list">{sectionOptions.map(x => <option key={x} value={x} />)}</datalist>
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>ঝুঁকির উৎস / কার্যক্রম</label>
          <input value={data.source} onChange={e => set('source', e.target.value)}
            placeholder="যেমনঃ কাপড় কাটার মেশিন পরিচালনা" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>সম্ভাবনা *</label>
          <select value={data.likelihood} onChange={e => set('likelihood', e.target.value)} style={inputStyle}>
            <option value="">নির্বাচন</option>
            {LIKELIHOOD_OPTIONS.map((o, i) => <option key={o} value={String(i + 1)}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>তীব্রতা *</label>
          <select value={data.severity} onChange={e => set('severity', e.target.value)} style={inputStyle}>
            <option value="">নির্বাচন</option>
            {SEVERITY_OPTIONS.map((o, i) => <option key={o} value={String(i + 1)}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle} title="সম্ভাবনা × তীব্রতা = ঝুঁকির মাত্রা">ঝুঁকির মাত্রা</label>
          <div
            title="সম্ভাবনা × তীব্রতা = ঝুঁকির মাত্রা"
            style={{
              ...inputStyle, display: 'flex', alignItems: 'center', fontWeight: 700, minHeight: 32, whiteSpace: 'nowrap',
              background: st ? st.bg : '#f8fafc', color: st ? st.color : '#94a3b8',
            }}
          >
            {l && s ? assessmentText(l, s, level) : '—'}
          </div>
        </div>

        {/* Row 2 */}
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>চিহ্নিত বিপদ / ঝুঁকি *</label>
          <textarea value={data.riskIdentification} onChange={e => set('riskIdentification', e.target.value)} style={areaStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>সম্ভাব্য প্রভাব / পরিণতি</label>
          <textarea value={data.impact} onChange={e => set('impact', e.target.value)} style={areaStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>বিদ্যমান নিয়ন্ত্রণ ব্যবস্থা</label>
          <textarea value={data.remedy} onChange={e => set('remedy', e.target.value)} style={areaStyle} />
        </div>

        {/* Row 3 */}
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>ঝুঁকির মূল কারণ</label>
          <textarea value={data.causeInvestigation} onChange={e => set('causeInvestigation', e.target.value)} style={areaStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>সংশোধনমূলক / প্রতিরোধমূলক ব্যবস্থা</label>
          <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} style={areaStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>ব্যবস্থা গ্রহণের তারিখ</label>
          <div style={{ display: 'flex', minWidth: 0 }}>
            <DateFieldDMY
              value={data.correctiveActionDate}
              onChange={v => set('correctiveActionDate', v)}
              ariaLabel="ব্যবস্থা গ্রহণের তারিখ"
              clearable
              boxStyle={{ padding: '6px 9px', fontSize: 12.5 }}
            />
          </div>
        </div>

        {/* Row 4 */}
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>দায়িত্বপ্রাপ্ত ব্যক্তির নাম</label>
          <input value={data.responsiblePersonName} onChange={e => set('responsiblePersonName', e.target.value)} style={inputStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>পদবি</label>
          <input value={data.responsiblePersonDesignation} onChange={e => set('responsiblePersonDesignation', e.target.value)} style={inputStyle} />
        </div>
        <div className="s2" style={fieldWrap}>
          <label style={labelStyle}>মন্তব্য</label>
          <input value={data.remarks} onChange={e => set('remarks', e.target.value)} style={inputStyle} />
        </div>

      </div>
    </div>
  );
}