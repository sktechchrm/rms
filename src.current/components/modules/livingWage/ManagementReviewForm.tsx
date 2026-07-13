// ─────────────────────────────────────────────────────────────────────────────
// ManagementReviewForm.tsx — Step 4: Management Review & Recommendations.
// Path: src/components/modules/livingWage/ManagementReviewForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { PRIORITY_OPTIONS } from './types';
import type { ManagementReview } from './types';

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
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' as const, minHeight: 80 };

const PRIORITY_COLORS: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };

interface Props {
  review: ManagementReview;
  setReview: (review: ManagementReview) => void;
  gapSummaryText: string; // auto-filled suggestion from the Wage Gap analysis, editable
}

export default function ManagementReviewForm({ review, setReview, gapSummaryText }: Props) {
  const set = <K extends keyof ManagementReview>(field: K, value: ManagementReview[K]) =>
    setReview({ ...review, [field]: value });

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={{
        marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, fontSize: 12, fontFamily: font, color: '#1e40af', lineHeight: 1.6,
      }}>
        Suggested summary from the Wage Gap Analysis (Step 3) — edit as needed: {gapSummaryText}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Review Date</label>
          <input type="date" value={review.reviewDate} onChange={e => set('reviewDate', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Priority Level</label>
          <select value={review.priorityLevel} onChange={e => set('priorityLevel', e.target.value as ManagementReview['priorityLevel'])} style={{ ...inputStyle, color: PRIORITY_COLORS[review.priorityLevel], fontWeight: 700 }}>
            {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Reviewed By</label>
          <input value={review.reviewedBy} onChange={e => set('reviewedBy', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Designation</label>
          <input value={review.reviewedByDesignation} onChange={e => set('reviewedByDesignation', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Summary of Findings</label>
        <textarea value={review.summaryOfFindings} onChange={e => set('summaryOfFindings', e.target.value)} style={textareaStyle} />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Recommendation</label>
        <textarea value={review.recommendation} onChange={e => set('recommendation', e.target.value)} placeholder="e.g., Increase minimum gross salary to Tk X, phased over 6 months" style={textareaStyle} />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>Management Comments</label>
        <textarea value={review.managementComments} onChange={e => set('managementComments', e.target.value)} style={textareaStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Approved By</label>
          <input value={review.approvedBy} onChange={e => set('approvedBy', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Designation</label>
          <input value={review.approvedByDesignation} onChange={e => set('approvedByDesignation', e.target.value)} style={inputStyle} />
        </div>
      </div>
    </div>
  );
}
