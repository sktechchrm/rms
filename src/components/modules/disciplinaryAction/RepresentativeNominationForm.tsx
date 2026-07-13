// ─────────────────────────────────────────────────────────────────────────────
// RepresentativeNominationForm.tsx — ধাপ ৩: প্রতিনিধি মনোনয়ন (NEW,
// separate step — was folded into "Form Investigation committee" before,
// now split out per explicit request).
// Path: src/components/modules/disciplinaryAction/RepresentativeNominationForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { calculateRepresentativeCount, formatDateBn, resizeCommitteeMembers } from './types';
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
  onGenerateNotice: () => void;
}

export default function RepresentativeNominationForm({ data, setData, onGenerateNotice }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  const repCount     = calculateRepresentativeCount(memberCount);
  const canGenerate  = memberCount > 0 && !!data.notice2Date;

  // AUDIT FIX: when প্রতিনিধি মনোনয়ন was split out from তদন্ত কমিটি into
  // its own step, this handler was left as a plain field-set — it never
  // actually resized data.committeeMembers, so ধাপ ৪'s table always
  // showed zero rows regardless of the count entered here (confirmed via
  // screenshot: count=6 here, but the committee table on the next step
  // was completely empty). Now calls resizeCommitteeMembers() so the
  // array is populated the moment the count is entered, same as before
  // the steps were split.
  const handleMemberCountChange = (value: string) => {
    const newCount = Number(value) || 0;
    setData({
      ...data,
      numberOfCommitteeMembers: value,
      committeeMembers: resizeCommitteeMembers(data.committeeMembers, newCount),
    });
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>কমিটি সদস্য সংখ্যা *</label>
          <input
            type="number" min={1}
            value={data.numberOfCommitteeMembers}
            onChange={e => handleMemberCountChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>নোটিশ ইস্যু তারিখ *</label>
          <input type="date" value={data.notice2Date} onChange={e => set('notice2Date', e.target.value)} style={inputStyle} />
          {data.notice2Date && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{formatDateBn(data.notice2Date)} ইং</div>}
        </div>
      </div>

      {memberCount > 0 && (
        <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12.5, fontFamily: font, color: '#1e40af' }}>
          মোট {memberCount} জন সদস্যের মধ্যে <b>{repCount} জন</b> শ্রমিক প্রতিনিধি হতে হবে (৫০%, ঊর্ধ্বে রাউন্ড করা)
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button
          onClick={onGenerateNotice}
          disabled={!canGenerate}
          style={{ ...noticeButton, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
        >
          🖨 নোটিশ ২ তৈরি করুন — প্রতিনিধি মনোনয়ন
        </button>
      </div>
    </div>
  );
}
