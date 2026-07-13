// ─────────────────────────────────────────────────────────────────────────────
// EvaluationForm.tsx — ধাপ ৫: মূল্যায়ন (renamed from "Report and
// Recommendation" per explicit request) — now ALSO produces a
// "প্রতিবেদন ও সুপারিশ" output in ফলাফল, not just data entry.
// Path: src/components/modules/disciplinaryAction/EvaluationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn } from './types';
import type { DisciplinaryActionData } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, fontFamily: font, color: '#1e293b',
  display: 'block', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const fieldWrap: React.CSSProperties = { marginBottom: 16 };
const noticeButton: React.CSSProperties = {
  padding: '9px 16px', background: '#1e3a5f', color: '#fff', border: 'none',
  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font,
};

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
  onGenerateOutput: () => void;
}

export default function EvaluationForm({ data, setData, onGenerateOutput }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const canGenerate = !!(data.investigationReportSummary && data.recommendation && data.evaluationDate);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ ...fieldWrap, maxWidth: 280 }}>
        <label style={labelStyle}>তারিখ *</label>
        <input type="date" value={data.evaluationDate} onChange={e => set('evaluationDate', e.target.value)} style={inputStyle} />
        {data.evaluationDate && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{formatDateBn(data.evaluationDate)} ইং</div>}
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>তদন্তকারী কমিটির প্রতিবেদন সারাংশ *</label>
        <textarea
          value={data.investigationReportSummary}
          onChange={e => set('investigationReportSummary', e.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>সুপারিশ *</label>
        <textarea
          value={data.recommendation}
          onChange={e => set('recommendation', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>চূড়ান্ত সিদ্ধান্ত</label>
        <textarea
          value={data.finalDecision}
          onChange={e => set('finalDecision', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const }}
        />
      </div>

      <button
        onClick={onGenerateOutput}
        disabled={!canGenerate}
        style={{ ...noticeButton, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
      >
        🖨 প্রতিবেদন ও সুপারিশ তৈরি করুন
      </button>
    </div>
  );
}
