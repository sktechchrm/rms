// ─────────────────────────────────────────────────────────────────────────────
// ManagementReviewForm.tsx — Step 4: Management Review & Recommendations.
// Path: src/components/modules/livingWage/ManagementReviewForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { PRIORITY_OPTIONS } from './types';
import type { ManagementReview, Priority } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import InfoBall from './InfoBall';
import { font, labelStyle, inputStyle, areaStyle, card, toolBtn, FORM_CSS } from './ui';

const PRIORITY_COLORS: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' };

interface Props {
  review: ManagementReview;
  setReview: (r: ManagementReview) => void;
  suggestedSummary: string;
  suggestedRecommendation: string;
  suggestedPriority: Priority;
}

export default function ManagementReviewForm({ review, setReview, suggestedSummary, suggestedRecommendation, suggestedPriority }: Props) {
  const set = <K extends keyof ManagementReview>(f: K, v: ManagementReview[K]) => setReview({ ...review, [f]: v });

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>Findings &amp; recommendation</span>
          <InfoBall title="Suggested from the wage gap">{suggestedSummary}</InfoBall>
          <button
            type="button"
            style={{ ...toolBtn('primary'), marginLeft: 'auto' }}
            onClick={() => setReview({ ...review, summaryOfFindings: suggestedSummary, recommendation: suggestedRecommendation, priorityLevel: suggestedPriority })}
          >Use suggestions</button>
        </div>

      <div style={card}>
        <div className="lw-grid">
          <div>
            <label style={labelStyle}>Review date</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={review.reviewDate} onChange={v => set('reviewDate', v)} ariaLabel="Review date" clearable boxStyle={{ padding: '7px 10px', fontSize: 12.5 }} /></div>
          </div>
          <div>
            <label style={labelStyle}>Priority level</label>
            <select value={review.priorityLevel} onChange={e => set('priorityLevel', e.target.value as Priority)} style={{ ...inputStyle, color: PRIORITY_COLORS[review.priorityLevel], fontWeight: 700 }}>
              {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, fontFamily: font }}>Suggested: {suggestedPriority}</div>
          </div>
          <div>
            <label style={labelStyle}>Reviewed by</label>
            <input value={review.reviewedBy} onChange={e => set('reviewedBy', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Designation</label>
            <input value={review.reviewedByDesignation} onChange={e => set('reviewedByDesignation', e.target.value)} style={inputStyle} />
          </div>

          <div className="s2">
            <label style={labelStyle}>Summary of findings</label>
            <textarea value={review.summaryOfFindings} onChange={e => set('summaryOfFindings', e.target.value)} style={areaStyle} />
          </div>
          <div className="s2">
            <label style={labelStyle}>Recommendation</label>
            <textarea value={review.recommendation} onChange={e => set('recommendation', e.target.value)} style={areaStyle} />
          </div>
          <div className="s4">
            <label style={labelStyle}>Management comments</label>
            <textarea value={review.managementComments} onChange={e => set('managementComments', e.target.value)} style={areaStyle} />
          </div>

          <div className="s2">
            <label style={labelStyle}>Approved by</label>
            <input value={review.approvedBy} onChange={e => set('approvedBy', e.target.value)} style={inputStyle} />
          </div>
          <div className="s2">
            <label style={labelStyle}>Designation</label>
            <input value={review.approvedByDesignation} onChange={e => set('approvedByDesignation', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}