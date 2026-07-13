// ─────────────────────────────────────────────────────────────────────────────
// OnboardingForm.tsx — fixed form, one new joiner per save.
// Path: src/components/modules/onboardingChecklist/OnboardingForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  CHECKLIST_ITEM_KEYS, CHECKLIST_ITEM_LABELS, PROBATION_STATUS_OPTIONS, calculateProgress,
} from './types';
import type { OnboardingChecklistData, ChecklistItemKey } from './types';

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
const checklistRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
  border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8,
};

interface Props {
  data: OnboardingChecklistData;
  setData: (data: OnboardingChecklistData) => void;
}

export default function OnboardingForm({ data, setData }: Props) {
  const set = <K extends keyof OnboardingChecklistData>(field: K, value: OnboardingChecklistData[K]) =>
    setData({ ...data, [field]: value });

  const toggleChecklistItem = (key: ChecklistItemKey) => {
    const item = data[key];
    const nowCompleted = !item.completed;
    setData({
      ...data,
      [key]: {
        ...item,
        completed: nowCompleted,
        completedDate: nowCompleted ? (item.completedDate || new Date().toISOString().split('T')[0]) : item.completedDate,
      },
    });
  };

  const setChecklistDate = (key: ChecklistItemKey, dateValue: string) => {
    setData({ ...data, [key]: { ...data[key], completedDate: dateValue } });
  };

  const progress = calculateProgress(data);

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <div style={sectionTitle}>নতুন কর্মীর তথ্য</div>
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
            <label style={labelStyle}>বিভাগ</label>
            <input value={data.department} onChange={e => set('department', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>যোগদানের তারিখ *</label>
            <input type="date" value={data.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Candidate Pipeline রেফারেন্স</label>
            <input value={data.candidateReference} onChange={e => set('candidateReference', e.target.value)} placeholder="ঐচ্ছিক" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>মেন্টর/বাডি</label>
            <input value={data.mentorName} onChange={e => set('mentorName', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={sectionTitle}>প্রবেশনকাল</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>শুরুর তারিখ</label>
            <input type="date" value={data.probationStartDate} onChange={e => set('probationStartDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>শেষের তারিখ</label>
            <input type="date" value={data.probationEndDate} onChange={e => set('probationEndDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>অবস্থা</label>
            <select value={data.probationStatus} onChange={e => set('probationStatus', e.target.value as OnboardingChecklistData['probationStatus'])} style={inputStyle}>
              <option value="">নির্বাচন করুন</option>
              {PROBATION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: font, color: '#1e3a5f' }}>Onboarding Checklist</div>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: progress.percent === 100 ? '#15803d' : '#1d4ed8' }}>
            {progress.done}/{progress.total} সম্পন্ন ({progress.percent}%)
          </div>
        </div>

        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress.percent}%`, background: progress.percent === 100 ? '#16a34a' : '#1d4ed8', transition: 'width .2s' }} />
        </div>

        {CHECKLIST_ITEM_KEYS.map(key => {
          const item = data[key];
          return (
            <div key={key} style={{ ...checklistRow, borderColor: item.completed ? '#86efac' : '#e2e8f0', background: item.completed ? '#f0fdf4' : '#fff' }}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleChecklistItem(key)}
                style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1, fontSize: 13, fontFamily: font, fontWeight: 600, color: item.completed ? '#15803d' : '#1e293b' }}>
                {CHECKLIST_ITEM_LABELS[key]}
              </div>
              <input
                type="date"
                value={item.completedDate}
                onChange={e => setChecklistDate(key, e.target.value)}
                disabled={!item.completed}
                style={{ ...inputStyle, width: 150, opacity: item.completed ? 1 : 0.5, fontSize: 12.5 }}
              />
            </div>
          );
        })}

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
    </>
  );
}
