// ─────────────────────────────────────────────────────────────────────────────
// FinalDecisionForm.tsx — ধাপ ৬: চূড়ান্ত সিদ্ধান্ত (NEW, separate step —
// was folded into ধাপ ৫ মূল্যায়ন before, split out per explicit request
// so Notice 4 has its own dedicated form file, same pattern as
// প্রতিনিধি মনোনয়ন being split out from তদন্ত কমিটি).
//
// Notice 4's issue date is NOT a manual field — it's the next business
// day after evaluationDate (skipping Friday + festival holidays), shown
// read-only via calculateNotice4Date() so the user can see what date
// will actually print on Notice 4 before generating it.
// Path: src/components/modules/disciplinaryAction/FinalDecisionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn, calculateNotice4Date } from './types';
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
  festivalHolidays: string[];
  onGenerateNotice4: () => void;
}

export default function FinalDecisionForm({ data, setData, festivalHolidays, onGenerateNotice4 }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const notice4Date  = calculateNotice4Date(data.evaluationDate, festivalHolidays);
  const notice4Ready = !!(data.finalDecision && data.evaluationDate);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      {!data.evaluationDate && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', background: '#fef3c7',
          border: '1px solid #fde68a', borderRadius: 8, fontSize: 12.5,
          fontFamily: font, color: '#92400e',
        }}>
          প্রথমে "মূল্যায়ন" ধাপে তারিখ ও প্রতিবেদন পূরণ করুন — নোটিশ ৪-এর তারিখ সেই তারিখ থেকে স্বয়ংক্রিয়ভাবে গণনা হবে।
        </div>
      )}

      <div style={fieldWrap}>
        <label style={labelStyle}>চূড়ান্ত সিদ্ধান্ত: *</label>
        <textarea
          value={data.finalDecision}
          onChange={e => set('finalDecision', e.target.value)}
          rows={5}
          placeholder="কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত লিখুন..."
          style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.7 }}
        />
      </div>

      <div style={{ marginBottom: 20, fontSize: 12.5, fontFamily: font, color: '#64748b' }}>
        নোটিশ ৪ ইস্যু তারিখ (স্বয়ংক্রিয় — মূল্যায়নের তারিখের পরবর্তী কর্মদিবস):
        {' '}
        <strong style={{ color: '#1e293b' }}>
          {notice4Date ? `${formatDateBn(notice4Date)} ইং` : '—'}
        </strong>
      </div>

      <button
        onClick={onGenerateNotice4}
        disabled={!notice4Ready}
        style={{
          ...noticeButton,
          opacity: notice4Ready ? 1 : 0.5,
          cursor: notice4Ready ? 'pointer' : 'not-allowed',
        }}
      >
        🖨 নোটিশ ৪ তৈরি করুন — চূড়ান্ত সিদ্ধান্ত অবহিতকরণ
      </button>
      {!notice4Ready && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: '#94a3b8', fontFamily: font }}>
          "চূড়ান্ত সিদ্ধান্ত" ও "মূল্যায়ন" ধাপের তারিখ পূরণ করুন প্রথমে
        </div>
      )}
    </div>
  );
}