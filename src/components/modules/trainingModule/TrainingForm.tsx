// ─────────────────────────────────────────────────────────────────────────────
// TrainingForm.tsx — fixed form, one training session per save.
// Path: src/components/modules/trainingModule/TrainingForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  WORKER_GUIDELINE_TOPICS, TRAINING_STATUS_OPTIONS, resizeParticipants,
} from './types';
import type { TrainingData, ParticipantItem } from './types';

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
const smallInput: React.CSSProperties = {
  width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1',
  borderRadius: 6, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const sectionCard: React.CSSProperties = {
  background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, fontFamily: font, color: '#1e3a5f',
  marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #e2e8f0',
};
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
};

const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

interface Props {
  data: TrainingData;
  setData: (data: TrainingData) => void;
}

export default function TrainingForm({ data, setData }: Props) {
  const set = <K extends keyof TrainingData>(field: K, value: TrainingData[K]) =>
    setData({ ...data, [field]: value });

  const handleParticipantCountChange = (value: string) => {
    const newCount = Number(value) || 0;
    setData({ ...data, participants: resizeParticipants(data.participants, newCount) });
  };

  const handleParticipantChange = (index: number, field: keyof ParticipantItem, value: string | boolean) => {
    const updated = [...data.participants];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, participants: updated });
  };

  const addParticipant = () => {
    handleParticipantCountChange(String(data.participants.length + 1));
  };

  const removeParticipant = (index: number) => {
    const filtered = data.participants.filter((_, i) => i !== index);
    setData({ ...data, participants: filtered.map((p, i) => ({ ...p, slNo: i + 1 })) });
  };

  const attendedCount = data.participants.filter(p => p.attended).length;

  return (
    <>
      <div style={sectionCard}>
        <div style={sectionTitle}>প্রশিক্ষণের বিষয় ও মাসিক পরিকল্পনা</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>প্রশিক্ষণের বিষয় * (Worker Guideline থেকে)</label>
            <select value={data.trainingTopic} onChange={e => set('trainingTopic', e.target.value)} style={inputStyle}>
              <option value="">নির্বাচন করুন</option>
              {WORKER_GUIDELINE_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {data.trainingTopic === 'অন্যান্য (Other)' && (
            <div style={fieldWrap}>
              <label style={labelStyle}>বিষয়ের নাম লিখুন</label>
              <input value={data.customTopic} onChange={e => set('customTopic', e.target.value)} style={inputStyle} />
            </div>
          )}
          <div style={fieldWrap}>
            <label style={labelStyle}>মাস</label>
            <select value={data.trainingMonth} onChange={e => set('trainingMonth', e.target.value)} style={inputStyle}>
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>বছর</label>
            <input value={data.trainingYear} onChange={e => set('trainingYear', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>স্ট্যাটাস</label>
            <select value={data.status} onChange={e => set('status', e.target.value as TrainingData['status'])} style={inputStyle}>
              {TRAINING_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>প্রশিক্ষণের নোটিশ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>নোটিশ ইস্যু তারিখ</label>
            <input type="date" value={data.noticeIssueDate} onChange={e => set('noticeIssueDate', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>নোটিশের বিবরণ</label>
          <textarea value={data.noticeDetails} onChange={e => set('noticeDetails', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>প্রশিক্ষক ও সময়সূচি</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>প্রশিক্ষকের নাম</label>
            <input value={data.trainerName} onChange={e => set('trainerName', e.target.value)} placeholder="Trainer Master List থেকে বা সরাসরি লিখুন" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>স্থান</label>
            <input value={data.venue} onChange={e => set('venue', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>নির্ধারিত তারিখ</label>
            <input type="date" value={data.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>নির্ধারিত সময়</label>
            <input type="time" value={data.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>স্থিতিকাল</label>
            <input value={data.duration} onChange={e => set('duration', e.target.value)} placeholder="যেমনঃ ২ ঘন্টা" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>পরিচালনার তারিখ (সম্পন্ন হলে)</label>
            <input type="date" value={data.conductedDate} onChange={e => set('conductedDate', e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>ছবির লিংক</label>
          <input value={data.pictureLink} onChange={e => set('pictureLink', e.target.value)} placeholder="Google Drive / অন্য কোনো লিংক" style={inputStyle} />
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionTitle as React.CSSProperties}>অংশগ্রহণকারীর তালিকা ({attendedCount}/{data.participants.length} উপস্থিত)</div>
          <button onClick={addParticipant} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font, flexShrink: 0 }}>
            + অংশগ্রহণকারী যোগ করুন
          </button>
        </div>

        {data.participants.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontFamily: font, fontSize: 13 }}>
            কোনো অংশগ্রহণকারী যোগ করা হয়নি
          </div>
        )}

        {data.participants.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 36 }}>SL</th>
                  <th style={thStyle}>নাম</th>
                  <th style={{ ...thStyle, width: 110 }}>কার্ড নং</th>
                  <th style={{ ...thStyle, width: 140 }}>পদবী</th>
                  <th style={{ ...thStyle, width: 140 }}>বিভাগ</th>
                  <th style={{ ...thStyle, width: 80 }}>উপস্থিত</th>
                  <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
                </tr>
              </thead>
              <tbody>
                {data.participants.map((p, index) => (
                  <tr key={index}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{p.slNo}</td>
                    <td style={tdStyle}><input value={p.name} onChange={e => handleParticipantChange(index, 'name', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={p.cardNo} onChange={e => handleParticipantChange(index, 'cardNo', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={p.designation} onChange={e => handleParticipantChange(index, 'designation', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={p.department} onChange={e => handleParticipantChange(index, 'department', e.target.value)} style={smallInput} /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input type="checkbox" checked={p.attended} onChange={e => handleParticipantChange(index, 'attended', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    </td>
                    <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                      <button onClick={() => removeParticipant(index)} title="Remove" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={sectionCard}>
        <label style={labelStyle}>মন্তব্য</label>
        <textarea value={data.remarks} onChange={e => set('remarks', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
    </>
  );
}
