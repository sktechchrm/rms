// ─────────────────────────────────────────────────────────────────────────────
// ShowCauseForm.tsx — ধাপ ১: কারণ দর্শানো
//
// FIX (print-view consistency): অভিযোগ field now uses RichTextArea (the
// same Bold/Italic/Bullet/Numbered toolbar as চূড়ান্ত সিদ্ধান্ত and
// মূল্যায়ন) instead of a plain <textarea> — DisciplinaryNoticeLetter.tsx
// already parses data.complaint via renderRichText() on Notice 1, so
// without this toolbar the user had no way to actually produce
// bold/bullet formatting there; the print side was ready but the input
// side wasn't.
// Path: src/components/modules/disciplinaryAction/ShowCauseForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { SUBJECT_OPTIONS, formatDateBn } from './types';
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
  onGenerateNotice: () => void;
}

export default function ShowCauseForm({ data, setData, onGenerateNotice }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const canGenerate = !!(data.employeeName && data.cardNo && data.complaint && data.showCauseDate);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={{
        marginBottom: 16, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 8, fontSize: 12.5, fontFamily: font, color: '#475569',
      }}>
        সূত্র নংঃ <b>{data.referenceNo || 'সংরক্ষণের পর স্বয়ংক্রিয়ভাবে তৈরি হবে'}</b>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>কারণ দর্শানোর তারিখ *</label>
          <input type="date" value={data.showCauseDate} onChange={e => set('showCauseDate', e.target.value)} style={inputStyle} />
          {data.showCauseDate && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{formatDateBn(data.showCauseDate)} ইং</div>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>কর্মীর নাম *</label>
          <input value={data.employeeName} onChange={e => set('employeeName', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>কার্ড নং *</label>
          <input value={data.cardNo} onChange={e => set('cardNo', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>পদবী</label>
          <input value={data.designation} onChange={e => set('designation', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>সেকশন</label>
          <input value={data.section} onChange={e => set('section', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>যোগদানের তারিখ</label>
          <input type="date" value={data.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>বিষয় *</label>
          <select value={data.subject} onChange={e => set('subject', e.target.value as DisciplinaryActionData['subject'])} style={inputStyle}>
            {SUBJECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle}>অভিযোগ *</label>
        <RichTextArea
          value={data.complaint}
          onChange={v => set('complaint', v)}
          rows={4}
          placeholder="যে অভিযোগের ভিত্তিতে এই নোটিশ জারি করা হচ্ছে তা লিখুন"
        />
      </div>

      <button
        onClick={onGenerateNotice}
        disabled={!canGenerate}
        style={{ ...noticeButton, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
      >
        🖨 নোটিশ ১ তৈরি করুন
      </button>
    </div>
  );
}