// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryActionForm.tsx — single scrolling form with conditional
// sections (Field Set 3/4 only appear if replyStatus === 'Not
// Satisfactory') and a dynamically-sized table (Field Set 4's row count
// tracks Field Set 3's number, not manual add/remove).
// Path: src/components/modules/disciplinaryAction/DisciplinaryActionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DisciplinaryActionData, CommitteeMember } from './types';
import { calculateRepresentativeCount, calculateInvestigationDeadline, resizeCommitteeMembers } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, fontFamily: font, color: '#1e3a5f',
  marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e2e8f0',
  display: 'flex', alignItems: 'center', gap: 8,
};
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
const smallInput: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};
const noticeButton: React.CSSProperties = {
  padding: '9px 16px', background: '#1e3a5f', color: '#fff', border: 'none',
  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font,
};

interface Props {
  data: DisciplinaryActionData;
  setData: (data: DisciplinaryActionData) => void;
  onGenerateNotice: (notice: 1 | 2 | 3) => void;
}

export default function DisciplinaryActionForm({ data, setData, onGenerateNotice }: Props) {
  const set = <K extends keyof DisciplinaryActionData>(field: K, value: DisciplinaryActionData[K]) =>
    setData({ ...data, [field]: value });

  const isCaseClosed   = data.replyStatus === 'Satisfactory';
  const showCommittee  = data.replyStatus === 'Not Satisfactory';
  const memberCount    = Number(data.numberOfCommitteeMembers) || 0;
  const repCount       = calculateRepresentativeCount(memberCount);
  const deadline        = calculateInvestigationDeadline(data.notice1Date);
  const canGenerateNotice2 = showCommittee && memberCount > 0;
  const canGenerateNotice3 = showCommittee && data.committeeMembers.length === memberCount && memberCount > 0
    && data.committeeMembers.every(m => m.name.trim() !== '');

  const handleMemberCountChange = (value: string) => {
    const newCount = Number(value) || 0;
    setData({
      ...data,
      numberOfCommitteeMembers: value,
      committeeMembers: resizeCommitteeMembers(data.committeeMembers, newCount),
    });
  };

  const handleMemberChange = (index: number, field: keyof CommitteeMember, value: string) => {
    const updated = [...data.committeeMembers];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, committeeMembers: updated });
  };

  return (
    <>
      {/* ── Field Set 1 ─────────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Field Set 1 — কর্মীর তথ্য</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
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
            <label style={labelStyle}>Notice 1 Issue Date *</label>
            <input type="date" value={data.notice1Date} onChange={e => set('notice1Date', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <button
          onClick={() => onGenerateNotice(1)}
          disabled={!data.employeeName || !data.cardNo}
          style={{ ...noticeButton, opacity: (!data.employeeName || !data.cardNo) ? 0.5 : 1, cursor: (!data.employeeName || !data.cardNo) ? 'not-allowed' : 'pointer' }}
        >
          🖨 Generate Notice 1: Show Cause / Temporary Suspension
        </button>
      </div>

      {/* ── Field Set 2 ─────────────────────────────────────────────────── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Field Set 2 — Status of Reply</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => set('replyStatus', 'Satisfactory')}
            style={{
              flex: 1, padding: '14px', borderRadius: 8, fontFamily: font, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              border: data.replyStatus === 'Satisfactory' ? '2px solid #16a34a' : '1px solid #cbd5e1',
              background: data.replyStatus === 'Satisfactory' ? '#f0fdf4' : '#fff',
              color: data.replyStatus === 'Satisfactory' ? '#15803d' : '#64748b',
            }}
          >
            ✓ Satisfactory
          </button>
          <button
            onClick={() => set('replyStatus', 'Not Satisfactory')}
            style={{
              flex: 1, padding: '14px', borderRadius: 8, fontFamily: font, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              border: data.replyStatus === 'Not Satisfactory' ? '2px solid #dc2626' : '1px solid #cbd5e1',
              background: data.replyStatus === 'Not Satisfactory' ? '#fee2e2' : '#fff',
              color: data.replyStatus === 'Not Satisfactory' ? '#b91c1c' : '#64748b',
            }}
          >
            ✕ Not Satisfactory
          </button>
        </div>

        {isCaseClosed && (
          <div style={{ marginTop: 14, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, fontFamily: font, color: '#15803d', fontWeight: 600 }}>
            ✓ জবাব সন্তোষজনক — কেস এখানেই সমাপ্ত। নিচের ফিল্ডগুলো প্রযোজ্য নয়।
          </div>
        )}
      </div>

      {/* ── Field Set 3 & 4 — only when Not Satisfactory ───────────────────── */}
      {showCommittee && (
        <>
          <div style={sectionCard}>
            <div style={sectionTitle}>Field Set 3 — Number of Committee Member</div>
            <div style={{ maxWidth: 240, marginBottom: 12 }}>
              <input
                type="number" min={1}
                value={data.numberOfCommitteeMembers}
                onChange={e => handleMemberCountChange(e.target.value)}
                style={inputStyle}
              />
            </div>
            {memberCount > 0 && (
              <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12.5, fontFamily: font, color: '#1e40af' }}>
                মোট {memberCount} জন সদস্যের মধ্যে <b>{repCount} জন</b> শ্রমিক প্রতিনিধি হতে হবে (৫০%, ঊর্ধ্বে রাউন্ড করা)
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => onGenerateNotice(2)}
                disabled={!canGenerateNotice2}
                style={{ ...noticeButton, opacity: canGenerateNotice2 ? 1 : 0.5, cursor: canGenerateNotice2 ? 'pointer' : 'not-allowed' }}
              >
                🖨 Generate Notice 2: Representative Nomination
              </button>
            </div>
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Field Set 4 — কমিটি সদস্যদের বিস্তারিত ({memberCount} জন)</div>
            {memberCount === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontFamily: font, fontSize: 13 }}>
                প্রথমে Field Set 3-এ সদস্য সংখ্যা দিন — টেবিল স্বয়ংক্রিয়ভাবে তৈরি হবে
              </div>
            )}
            {memberCount > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 36 }}>SL</th>
                      <th style={thStyle}>কর্মীর নাম</th>
                      <th style={{ ...thStyle, width: 120 }}>কার্ড নং</th>
                      <th style={{ ...thStyle, width: 150 }}>পদবী</th>
                      <th style={{ ...thStyle, width: 150, borderRight: 'none' }}>সেকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.committeeMembers.map((m, index) => (
                      <tr key={index}>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{m.slNo}</td>
                        <td style={tdStyle}><input value={m.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} style={smallInput} /></td>
                        <td style={tdStyle}><input value={m.cardNo} onChange={e => handleMemberChange(index, 'cardNo', e.target.value)} style={smallInput} /></td>
                        <td style={tdStyle}><input value={m.designation} onChange={e => handleMemberChange(index, 'designation', e.target.value)} style={smallInput} /></td>
                        <td style={{ ...tdStyle, borderRight: 'none' }}><input value={m.section} onChange={e => handleMemberChange(index, 'section', e.target.value)} style={smallInput} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deadline && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12.5, fontFamily: font, color: '#92400e' }}>
                তদন্ত সময়সীমা: Notice 1 ({data.notice1Date}) + ৫০ দিন = <b>{deadline}</b>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => onGenerateNotice(3)}
                disabled={!canGenerateNotice3}
                style={{ ...noticeButton, opacity: canGenerateNotice3 ? 1 : 0.5, cursor: canGenerateNotice3 ? 'pointer' : 'not-allowed' }}
              >
                🖨 Generate Notice 3: Start Investigation Process
              </button>
              {!canGenerateNotice3 && memberCount > 0 && (
                <div style={{ marginTop: 6, fontSize: 11.5, color: '#94a3b8', fontFamily: font }}>
                  সব কমিটি সদস্যের নাম পূরণ করুন প্রথমে
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
