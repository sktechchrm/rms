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
//
// FIX (শাস্তি/দণ্ড select wasn't wired to any state): the dropdown had
// no `value`/`onChange` at all — it was a bare uncontrolled <select>
// that visually looked functional but silently discarded whatever the
// user picked. Meanwhile DisciplinaryNoticeLetter.tsx's Notice 4 body
// hardcoded the literal text "সরাসরি অপসারন/বরখাস্ত" regardless of what
// was actually selected here, so the printed notice never reflected the
// real decision. Wired the select to `data.punishmentType` and marked it
// required for notice4Ready — see DisciplinaryNoticeLetter.tsx's
// matching fix for the print-side half of this.
//
// NOTE: this assumes `DisciplinaryActionData` (in ./types) has a
// `punishmentType: string` field. If it doesn't yet, add it there —
// this file only had visibility into the two files being edited, not
// types.ts itself.
// Path: src/components/modules/disciplinaryAction/FinalDecisionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDateBn, calculateNotice4Date } from './types';
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
  festivalHolidays: string[];
  onGenerateNotice4: () => void;
}

export default function FinalDecisionForm({ data, setData, festivalHolidays, onGenerateNotice4 }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const notice4Date  = calculateNotice4Date(data.evaluationDate, festivalHolidays);
  // Now also requires শাস্তি/দণ্ড to actually be selected — previously
  // the button could go "ready" even though the select's value was
  // never captured anywhere, so Notice 4 would generate with the
  // hardcoded fallback text instead of a real decision.
  const notice4Ready = !!(data.finalDecision && data.evaluationDate && data.punishmentType);

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

      {/* চূড়ান্ত সিদ্ধান্ত */}
      <div style={fieldWrap}>
        <label style={labelStyle}>চূড়ান্ত সিদ্ধান্ত: *</label>
        <RichTextArea
          value={data.finalDecision}
          onChange={v => set('finalDecision', v)}
          rows={5}
          placeholder="কর্তৃপক্ষের চূড়ান্ত সিদ্ধান্ত লিখুন..."
        />
      </div>

      {/* শাস্তির ধরন / বিবরণ */}
      <div style={fieldWrap}>
        <label style={labelStyle}>শাস্তি/দণ্ড: *</label>
        <select
          style={inputStyle}
          value={data.punishmentType || ''}
          onChange={e => set('punishmentType', e.target.value)}
        >
          <option value="">-- শাস্তি নির্বাচন করুন --</option>
          <option value="বরখাস্ত">বরখাস্ত</option>
          <option value="বরখাস্ত [ধারা ২৩-এর ৪(খ/ছ)]">বরখাস্ত [ধারা ২৩-এর ৪(খ/ছ)]</option>
          <option value="অপসারণ">অপসারণ</option>
          <option value="নিচের পদে, গ্রেডে বা বেতন স্কেলে অনধিক এক বৎসর পর্যন্ত আনয়ন">নিচের পদে, গ্রেডে বা বেতন স্কেলে অনধিক এক বৎসর পর্যন্ত আনয়ন</option>
          <option value="অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ">অনধিক এক বৎসরের জন্য পদোন্নতি বন্ধ</option>
          <option value="অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ">অনধিক এক বৎসরের জন্য মজুরী বৃদ্ধি বন্ধ</option>
          <option value="জরিমানা">জরিমানা</option>
          <option value="অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত">অনধিক সাত দিন পর্যন্ত বিনা মজুরীতে বা বিনা খোরাকীতে সাময়িক বরখাস্ত</option>
          <option value="ভর্ৎসনা ও সতর্কীকরণ">ভর্ৎসনা ও সতর্কীকরণ</option>
        </select>
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
          "শাস্তি/দণ্ড", "চূড়ান্ত সিদ্ধান্ত" ও "মূল্যায়ন" ধাপের তারিখ পূরণ করুন প্রথমে
        </div>
      )}
    </div>
  );
}