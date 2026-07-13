// ─────────────────────────────────────────────────────────────────────────────
// GradeForm.tsx — fixed form, one grade definition per save.
// Path: src/components/modules/wagesGrid/GradeForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { SCHEDULE_TYPE_OPTIONS, calculateGrossFromGrade, suggestHouseRent } from './types';
import type { GradeDefinitionData } from './types';

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
  data: GradeDefinitionData;
  setData: (data: GradeDefinitionData) => void;
}

export default function GradeForm({ data, setData }: Props) {
  const set = <K extends keyof GradeDefinitionData>(field: K, value: GradeDefinitionData[K]) =>
    setData({ ...data, [field]: value });

  const handleBasicChange = (value: string) => {
    // Auto-suggest house rent (50% of basic) only when the house rent
    // field is still empty or was previously auto-derived — never
    // silently overwrite a value the user already typed in deliberately.
    const suggested = suggestHouseRent(value);
    const shouldAutoFill = !data.houseRentAllowance || data.houseRentAllowance === suggestHouseRent(data.basicWage);
    setData({
      ...data,
      basicWage: value,
      houseRentAllowance: shouldAutoFill ? suggested : data.houseRentAllowance,
    });
  };

  const gross = calculateGrossFromGrade(data);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={{
        marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 8, fontSize: 12, fontFamily: font, color: '#1e40af', lineHeight: 1.6,
      }}>
        সরকার-নির্ধারিত গ্রেড কাঠামো লিপিবদ্ধ করুন (২০২৩ গেজেট অনুযায়ী — তফসিল-ক শ্রমিকদের জন্য, তফসিল-খ করণিকদের জন্য পৃথক)।
        হাউস রেন্ট মূল বেতনের ৫০% স্বয়ংক্রিয়ভাবে প্রস্তাব করা হয়, তবে প্রয়োজনে সম্পাদনাযোগ্য।
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>গ্রেডের নাম *</label>
          <input value={data.gradeName} onChange={e => set('gradeName', e.target.value)} placeholder="যেমনঃ Grade 1, Grade 4" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>তফসিলের ধরন *</label>
          <select value={data.scheduleType} onChange={e => set('scheduleType', e.target.value as GradeDefinitionData['scheduleType'])} style={inputStyle}>
            {SCHEDULE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>কার্যকর তারিখ</label>
          <input type="date" value={data.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>গেজেট রেফারেন্স</label>
          <input value={data.gazetteReference} onChange={e => set('gazetteReference', e.target.value)} placeholder="যেমনঃ ন্যূনতম মজুরি বোর্ড গেজেট, ২০২৩" style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitle}>মজুরির বিভাজন</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>মূল মজুরি (৳) *</label>
          <input type="number" value={data.basicWage} onChange={e => handleBasicChange(e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>বাড়ি ভাড়া ভাতা (৳)</label>
          <input type="number" value={data.houseRentAllowance} onChange={e => set('houseRentAllowance', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>চিকিৎসা ভাতা (৳)</label>
          <input type="number" value={data.medicalAllowance} onChange={e => set('medicalAllowance', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>যাতায়াত ভাতা (৳)</label>
          <input type="number" value={data.conveyanceAllowance} onChange={e => set('conveyanceAllowance', e.target.value)} style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>খাদ্য ভাতা (৳)</label>
          <input type="number" value={data.foodAllowance} onChange={e => set('foodAllowance', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{
        marginTop: 8, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #86efac',
        borderRadius: 8, fontSize: 15, fontFamily: font, color: '#15803d', fontWeight: 700,
      }}>
        মোট মাসিক মজুরি: ৳ {gross.toFixed(2)}
      </div>

      <div style={{ marginTop: 16 }}>
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
