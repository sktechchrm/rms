// ─────────────────────────────────────────────────────────────────────────────
// EvaluationForm.tsx — ধাপ ৫: মূল্যায়ন — produces a "প্রতিবেদন ও সুপারিশ"
// output in ফলাফল, not just data entry.
//
// UPDATE: সারাংশ (বিস্তারিত প্রতিবেদন) and সুপারিশ fields switched from
// plain <textarea> to RichTextArea — the print output already parses these
// two fields through renderRichText() (see DisciplinaryNoticeLetter.tsx),
// so the form previously had no way to actually PRODUCE the bold/italic/
// list formatting the print layout was already capable of rendering. Now
// both ends match, same toolbar as চূড়ান্ত সিদ্ধান্ত.
// Path: src/components/modules/disciplinaryAction/EvaluationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn } from './types';
import type { DisciplinaryActionData } from './types';
import RichTextArea from './RichTextArea';

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

      <div style={{ ...fieldWrap, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
        <label style={labelStyle}>সারাংশ (বিস্তারিত প্রতিবেদন): *</label>
        <RichTextArea
          value={data.investigationReportSummary}
          onChange={v => set('investigationReportSummary', v)}
          rows={5}
          placeholder="গত ২ জুলাই ২০২৬ইং তারিখ ... তদন্ত কমিটির পর্যালোচনার ভিত্তিতে ..."
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>সুপারিশ: *</label>
        <RichTextArea
          value={data.recommendation}
          onChange={v => set('recommendation', v)}
          rows={4}
          placeholder="তদন্ত কমিটির সুপারিশ লিখুন..."
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