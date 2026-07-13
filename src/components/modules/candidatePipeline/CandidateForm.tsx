// ─────────────────────────────────────────────────────────────────────────────
// CandidateForm.tsx — fixed form, one candidate per save.
// Path: src/components/modules/candidatePipeline/CandidateForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { STAGE_OPTIONS, SOURCE_OPTIONS, STAGE_STYLE } from './types';
import type { CandidateData } from './types';

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
  data: CandidateData;
  setData: (data: CandidateData) => void;
}

export default function CandidateForm({ data, setData }: Props) {
  const set = <K extends keyof CandidateData>(field: K, value: CandidateData[K]) =>
    setData({ ...data, [field]: value });

  const stageStyle = STAGE_STYLE[data.stage];
  const isPostInterviewStage = ['Interviewed', 'Selected', 'Offer Sent', 'Offer Accepted', 'Joined'].includes(data.stage);
  const isOfferStage = ['Offer Sent', 'Offer Accepted', 'Joined'].includes(data.stage);
  const isJoined = data.stage === 'Joined';

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={sectionTitle}>প্রার্থীর তথ্য</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>প্রার্থীর নাম *</label>
          <input value={data.candidateName} onChange={e => set('candidateName', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>ফোন</label>
          <input value={data.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>ইমেইল</label>
          <input value={data.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Source</label>
          <select value={data.source} onChange={e => set('source', e.target.value)} style={inputStyle}>
            {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={sectionTitle}>আবেদনের বিবরণ</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>আবেদনের পদ *</label>
          <input value={data.positionAppliedFor} onChange={e => set('positionAppliedFor', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>বিভাগ</label>
          <input value={data.department} onChange={e => set('department', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Manpower Requisition Reference</label>
          <input value={data.requisitionReference} onChange={e => set('requisitionReference', e.target.value)} placeholder="ঐচ্ছিক" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>আবেদনের তারিখ</label>
          <input type="date" value={data.applicationDate} onChange={e => set('applicationDate', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitle}>Stage</div>
      <div style={fieldWrap}>
        <select
          value={data.stage}
          onChange={e => set('stage', e.target.value as CandidateData['stage'])}
          style={{ ...inputStyle, background: stageStyle.bg, color: stageStyle.color, fontWeight: 700, maxWidth: 280 }}
        >
          {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {isPostInterviewStage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Interview তারিখ</label>
            <input type="date" value={data.interviewDate} onChange={e => set('interviewDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Expected Salary</label>
            <input type="number" value={data.expectedSalary} onChange={e => set('expectedSalary', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Interview Feedback</label>
            <textarea
              value={data.interviewFeedback}
              onChange={e => set('interviewFeedback', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>
        </div>
      )}

      {isOfferStage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Offered Salary</label>
            <input type="number" value={data.offeredSalary} onChange={e => set('offeredSalary', e.target.value)} style={inputStyle} />
          </div>
          {isJoined && (
            <div style={fieldWrap}>
              <label style={labelStyle}>যোগদানের তারিখ</label>
              <input type="date" value={data.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={inputStyle} />
            </div>
          )}
        </div>
      )}

      <div style={fieldWrap}>
        <label style={labelStyle}>মন্তব্য</label>
        <textarea
          value={data.remarks}
          onChange={e => set('remarks', e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
      </div>
    </div>
  );
}
