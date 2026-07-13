// ─────────────────────────────────────────────────────────────────────────────
// EmergencyLogForm.tsx — type-toggle form (Injury and Accident Log |
// Grievance Log), fields kept regardless of active type.
// Path: src/components/modules/emergencyLog/EmergencyLogForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  LOG_TYPE_OPTIONS, SEVERITY_OPTIONS, INVESTIGATION_STATUS_OPTIONS,
  GRIEVANCE_CATEGORY_OPTIONS, RESOLUTION_STATUS_OPTIONS,
} from './types';
import type { EmergencyLogData } from './types';

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
const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 };

interface Props {
  data: EmergencyLogData;
  setData: (data: EmergencyLogData) => void;
}

export default function EmergencyLogForm({ data, setData }: Props) {
  const set = <K extends keyof EmergencyLogData>(field: K, value: EmergencyLogData[K]) =>
    setData({ ...data, [field]: value });

  const isInjury = data.logType === 'Injury and Accident Log';

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>

      <div style={{ marginBottom: 16, maxWidth: 340 }}>
        <label style={labelStyle}>Log Type *</label>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
          {LOG_TYPE_OPTIONS.map((opt, i) => (
            <button
              key={opt}
              onClick={() => set('logType', opt)}
              style={{
                flex: 1, padding: '9px 10px', fontSize: 12.5, fontWeight: 700, fontFamily: font,
                border: 'none', borderLeft: i > 0 ? '1.5px solid #cbd5e1' : 'none', cursor: 'pointer',
                background: data.logType === opt ? '#1d4ed8' : '#fff',
                color: data.logType === opt ? '#fff' : '#6b7280',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionTitle}>সাধারণ তথ্য</div>
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
          <label style={labelStyle}>{isInjury ? 'ঘটনার তারিখ *' : 'অভিযোগের তারিখ *'}</label>
          <input type="date" value={data.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
        </div>
      </div>

      {isInjury ? (
        <>
          <div style={sectionTitle}>আঘাত/দুর্ঘটনার বিবরণ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>ঘটনার সময়</label>
              <input type="time" value={data.timeOfIncident} onChange={e => set('timeOfIncident', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>ঘটনার স্থান</label>
              <input value={data.locationOfIncident} onChange={e => set('locationOfIncident', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>আঘাতের ধরন</label>
              <input value={data.typeOfInjury} onChange={e => set('typeOfInjury', e.target.value)} placeholder="যেমনঃ কাটা, পোড়া, পড়ে যাওয়া, মেশিন আঘাত" style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>তীব্রতা</label>
              <select value={data.severity} onChange={e => set('severity', e.target.value as EmergencyLogData['severity'])} style={inputStyle}>
                <option value="">নির্বাচন করুন</option>
                {SEVERITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>ঘটনার বর্ণনা</label>
            <textarea value={data.incidentDescription} onChange={e => set('incidentDescription', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>তাৎক্ষণিক পদক্ষেপ</label>
            <textarea value={data.immediateActionTaken} onChange={e => set('immediateActionTaken', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          <div style={checkRow}>
            <input type="checkbox" checked={data.firstAidGiven} onChange={e => set('firstAidGiven', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label style={{ fontSize: 13, fontFamily: font }}>প্রাথমিক চিকিৎসা প্রদান করা হয়েছে</label>
          </div>
          <div style={checkRow}>
            <input type="checkbox" checked={data.medicalTreatmentRequired} onChange={e => set('medicalTreatmentRequired', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label style={{ fontSize: 13, fontFamily: font }}>চিকিৎসা প্রয়োজন</label>
          </div>
          <div style={checkRow}>
            <input type="checkbox" checked={data.hospitalReferred} onChange={e => set('hospitalReferred', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label style={{ fontSize: 13, fontFamily: font }}>হাসপাতালে রেফার করা হয়েছে</label>
          </div>
          {data.hospitalReferred && (
            <div style={fieldWrap}>
              <label style={labelStyle}>হাসপাতালের নাম</label>
              <input value={data.hospitalName} onChange={e => set('hospitalName', e.target.value)} style={inputStyle} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>সাক্ষী(দের) নাম</label>
              <input value={data.witnessNames} onChange={e => set('witnessNames', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>রিপোর্টকারী</label>
              <input value={data.reportedBy} onChange={e => set('reportedBy', e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>তদন্তের অবস্থা</label>
              <select value={data.investigationStatus} onChange={e => set('investigationStatus', e.target.value as EmergencyLogData['investigationStatus'])} style={inputStyle}>
                <option value="">নির্বাচন করুন</option>
                {INVESTIGATION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>ছুটির দিন (কর্মদিবস হারানো)</label>
              <input type="number" value={data.daysLost} onChange={e => set('daysLost', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>সংশোধনমূলক পদক্ষেপ</label>
            <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
        </>
      ) : (
        <>
          <div style={sectionTitle}>অভিযোগের বিবরণ</div>
          <div style={fieldWrap}>
            <label style={labelStyle}>অভিযোগের প্রকৃতি</label>
            <textarea value={data.natureOfGrievance} onChange={e => set('natureOfGrievance', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>ক্যাটাগরি</label>
              <select value={data.grievanceCategory} onChange={e => set('grievanceCategory', e.target.value)} style={inputStyle}>
                <option value="">নির্বাচন করুন</option>
                {GRIEVANCE_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>সমাধানের অবস্থা</label>
              <select value={data.resolutionStatus} onChange={e => set('resolutionStatus', e.target.value as EmergencyLogData['resolutionStatus'])} style={inputStyle}>
                <option value="">নির্বাচন করুন</option>
                {RESOLUTION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>সমাধানের তারিখ</label>
              <input type="date" value={data.resolutionDate} onChange={e => set('resolutionDate', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>গৃহীত পদক্ষেপ</label>
            <textarea value={data.actionTaken} onChange={e => set('actionTaken', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
        </>
      )}

      <div style={fieldWrap}>
        <label style={labelStyle}>মন্তব্য</label>
        <textarea value={data.remarks} onChange={e => set('remarks', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
    </div>
  );
}
