// ─────────────────────────────────────────────────────────────────────────────
// ReplyStatusForm.tsx — ধাপ ২: জবাব ও অবস্থা
// Path: src/components/modules/disciplinaryAction/ReplyStatusForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

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
const fieldWrap: React.CSSProperties = { marginBottom: 16, maxWidth: 320 };

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
}

export default function ReplyStatusForm({ data, setData }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const isCaseClosed = data.replyStatus === 'সন্তোষজনক';

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={fieldWrap}>
        <label style={labelStyle}>জবাবের তারিখ</label>
        <input type="date" value={data.replyDate} onChange={e => set('replyDate', e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: 8, ...fieldWrap }}>
        <label style={labelStyle}>জবাবের অবস্থা</label>
      </div>
      <div style={{ display: 'flex', gap: 12, maxWidth: 420 }}>
        <button
          onClick={() => set('replyStatus', 'সন্তোষজনক')}
          style={{
            flex: 1, padding: '14px', borderRadius: 8, fontFamily: font, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            border: data.replyStatus === 'সন্তোষজনক' ? '2px solid #16a34a' : '1px solid #cbd5e1',
            background: data.replyStatus === 'সন্তোষজনক' ? '#f0fdf4' : '#fff',
            color: data.replyStatus === 'সন্তোষজনক' ? '#15803d' : '#64748b',
          }}
        >
          ✓ সন্তোষজনক
        </button>
        <button
          onClick={() => set('replyStatus', 'অসন্তোষজনক')}
          style={{
            flex: 1, padding: '14px', borderRadius: 8, fontFamily: font, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            border: data.replyStatus === 'অসন্তোষজনক' ? '2px solid #dc2626' : '1px solid #cbd5e1',
            background: data.replyStatus === 'অসন্তোষজনক' ? '#fee2e2' : '#fff',
            color: data.replyStatus === 'অসন্তোষজনক' ? '#b91c1c' : '#64748b',
          }}
        >
          ✕ অসন্তোষজনক
        </button>
      </div>

      {isCaseClosed && (
        <div style={{ marginTop: 14, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, fontFamily: font, color: '#15803d', fontWeight: 600 }}>
          ✓ জবাব সন্তোষজনক — কেস এখানেই সমাপ্ত। পরের ধাপগুলো প্রযোজ্য নয়।
        </div>
      )}
    </div>
  );
}
