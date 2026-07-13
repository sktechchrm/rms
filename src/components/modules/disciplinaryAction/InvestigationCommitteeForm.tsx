// ─────────────────────────────────────────────────────────────────────────────
// InvestigationCommitteeForm.tsx — ধাপ ৪: তদন্ত কমিটি (renamed and
// narrowed — the member COUNT now lives in ধাপ ৩ প্রতিনিধি মনোনয়ন; this
// step is ONLY the committee member details table, its own নোটিশ ইস্যু
// তারিখ, and Notice 3 generation).
// Path: src/components/modules/disciplinaryAction/InvestigationCommitteeForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DisciplinaryActionData, CommitteeMember } from './types';
import { formatDateBn } from './types';
import { toBanglaNumber } from '../../../utils/bnEnDate';
import { addDaysSkippingHolidays } from '../../../utils/businessDays';

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
  festivalHolidays: string[];
  onGenerateNotice: () => void;
}

export default function InvestigationCommitteeForm({ data, setData, festivalHolidays, onGenerateNotice }: Props) {
  const memberCount = Number(data.numberOfCommitteeMembers) || 0;
  // Deadline anchored to কারণ দর্শানোর তারিখ + 50 days, business-day-aware
  // (skips Friday + any factory-configured festival holiday).
  const deadline = addDaysSkippingHolidays(data.showCauseDate, 50, festivalHolidays);

  const handleMemberChange = (index: number, field: keyof CommitteeMember, value: string) => {
    const updated = [...data.committeeMembers];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, committeeMembers: updated });
  };

  const canGenerate = data.committeeMembers.length === memberCount && memberCount > 0
    && data.committeeMembers.every(m => m.name.trim() !== '') && !!data.notice3Date;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ marginBottom: 16, maxWidth: 280 }}>
        <label style={labelStyle}>নোটিশ ইস্যু তারিখ *</label>
        <input type="date" value={data.notice3Date} onChange={e => setData({ ...data, notice3Date: e.target.value })} style={inputStyle} />
        {data.notice3Date && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{formatDateBn(data.notice3Date)} ইং</div>}
      </div>

      {memberCount === 0 && (
        <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontFamily: font, fontSize: 13 }}>
          প্রথমে "প্রতিনিধি মনোনয়ন" ধাপে সদস্য সংখ্যা দিন — টেবিল স্বয়ংক্রিয়ভাবে তৈরি হবে
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
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{toBanglaNumber(m.slNo)}</td>
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
          তদন্ত সময়সীমা: কারণ দর্শানোর তারিখ ({formatDateBn(data.showCauseDate)}) + ৫০ দিন, শুক্রবার ও ছুটির দিন বাদে = <b>{formatDateBn(deadline)}</b>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button
          onClick={onGenerateNotice}
          disabled={!canGenerate}
          style={{ ...noticeButton, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
        >
          🖨 নোটিশ ৩ তৈরি করুন — কমিটি মনোনয়ন ও তদন্ত সময়সীমা
        </button>
        {!canGenerate && memberCount > 0 && (
          <div style={{ marginTop: 6, fontSize: 11.5, color: '#94a3b8', fontFamily: font }}>
            সব কমিটি সদস্যের নাম ও নোটিশ ইস্যু তারিখ পূরণ করুন প্রথমে
          </div>
        )}
      </div>
    </div>
  );
}
