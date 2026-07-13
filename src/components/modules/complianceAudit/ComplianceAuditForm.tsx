// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditForm.tsx — fixed audit-details form, with a dynamic
// auditors table and a dynamic Corrective Action Plan table.
// Path: src/components/modules/complianceAudit/ComplianceAuditForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS, AUDITING_AREA_OPTIONS,
  resizeAuditors, resizeCorrectiveActions,
} from './types';
import type { ComplianceAuditData, AuditorItem, CorrectiveActionItem } from './types';

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
const addBtn: React.CSSProperties = {
  background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px',
  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font, flexShrink: 0,
};
const checkboxLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontFamily: font,
  color: '#334155', cursor: 'pointer', padding: '6px 10px', border: '1px solid #e2e8f0',
  borderRadius: 8, background: '#fff',
};

interface Props {
  data: ComplianceAuditData;
  setData: (data: ComplianceAuditData) => void;
}

export default function ComplianceAuditForm({ data, setData }: Props) {
  const set = <K extends keyof ComplianceAuditData>(field: K, value: ComplianceAuditData[K]) =>
    setData({ ...data, [field]: value });

  const toggleAuditingArea = (area: string) => {
    const has = data.auditingAreas.includes(area);
    set('auditingAreas', has ? data.auditingAreas.filter(a => a !== area) : [...data.auditingAreas, area]);
  };

  // ── Auditors ──────────────────────────────────────────────────────────────
  const handleAuditorCountChange = (value: string) => {
    setData({ ...data, auditors: resizeAuditors(data.auditors, Number(value) || 0) });
  };
  const handleAuditorChange = (index: number, field: keyof AuditorItem, value: string) => {
    const updated = [...data.auditors];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, auditors: updated });
  };
  const addAuditor = () => handleAuditorCountChange(String(data.auditors.length + 1));
  const removeAuditor = (index: number) => {
    if (data.auditors.length <= 1) return;
    const filtered = data.auditors.filter((_, i) => i !== index);
    setData({ ...data, auditors: filtered.map((a, i) => ({ ...a, slNo: i + 1 })) });
  };

  // ── Corrective Actions ───────────────────────────────────────────────────
  const handleCorrectiveActionChange = (index: number, field: keyof CorrectiveActionItem, value: string) => {
    const updated = [...data.correctiveActions];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, correctiveActions: updated });
  };
  const addCorrectiveAction = () => {
    setData({ ...data, correctiveActions: resizeCorrectiveActions(data.correctiveActions, data.correctiveActions.length + 1) });
  };
  const removeCorrectiveAction = (index: number) => {
    if (data.correctiveActions.length <= 1) return;
    const filtered = data.correctiveActions.filter((_, i) => i !== index);
    setData({ ...data, correctiveActions: filtered.map((c, i) => ({ ...c, slNo: i + 1 })) });
  };

  return (
    <>
      <div style={sectionCard}>
        <div style={sectionTitle}>অডিটের ধরন</div>
        <div style={{ maxWidth: 320 }}>
          <select value={data.auditType} onChange={e => set('auditType', e.target.value as ComplianceAuditData['auditType'])} style={inputStyle}>
            {AUDIT_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>Audit Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Company Name *</label>
            <input value={data.companyName} onChange={e => set('companyName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Site Name *</label>
            <input value={data.siteName} onChange={e => set('siteName', e.target.value)} style={inputStyle} />
          </div>
          <div style={{ ...fieldWrap, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Site Name &amp; Address</label>
            <input value={data.siteAddress} onChange={e => set('siteAddress', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Site Contact Name</label>
            <input value={data.siteContactName} onChange={e => set('siteContactName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Job Title</label>
            <input value={data.siteContactJobTitle} onChange={e => set('siteContactJobTitle', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Site Phone</label>
            <input value={data.sitePhone} onChange={e => set('sitePhone', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Site Email</label>
            <input value={data.siteEmail} onChange={e => set('siteEmail', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Date of Audit</label>
            <input type="date" value={data.auditDate} onChange={e => set('auditDate', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Audit Type</label>
            <select value={data.auditRound} onChange={e => set('auditRound', e.target.value as ComplianceAuditData['auditRound'])} style={inputStyle}>
              {AUDIT_ROUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Auditing Areas</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AUDITING_AREA_OPTIONS.map(area => (
              <label key={area} style={{ ...checkboxLabel, ...(data.auditingAreas.includes(area) ? { background: '#eff6ff', borderColor: '#1d4ed8', color: '#1d4ed8', fontWeight: 600 } : {}) }}>
                <input type="checkbox" checked={data.auditingAreas.includes(area)} onChange={() => toggleAuditingArea(area)} style={{ cursor: 'pointer' }} />
                {area}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionTitle as React.CSSProperties}>Auditors Name &amp; Designation ({data.auditors.length})</div>
          <button onClick={addAuditor} style={addBtn}>+ Auditor যোগ করুন</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 36 }}>SL</th>
                <th style={thStyle}>নাম</th>
                <th style={thStyle}>পদবী</th>
                <th style={thStyle}>প্রতিষ্ঠান</th>
                <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
              </tr>
            </thead>
            <tbody>
              {data.auditors.map((a, index) => (
                <tr key={index}>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{a.slNo}</td>
                  <td style={tdStyle}><input value={a.name} onChange={e => handleAuditorChange(index, 'name', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input value={a.designation} onChange={e => handleAuditorChange(index, 'designation', e.target.value)} style={smallInput} /></td>
                  <td style={tdStyle}><input value={a.organization} onChange={e => handleAuditorChange(index, 'organization', e.target.value)} style={smallInput} /></td>
                  <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                    <button onClick={() => removeAuditor(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={sectionTitle as React.CSSProperties}>Corrective Action Plan - Non-Compliances ({data.correctiveActions.length})</div>
          <button onClick={addCorrectiveAction} style={addBtn}>+ Non-Compliance যোগ করুন</button>
        </div>
        {data.correctiveActions.map((c, index) => (
          <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e3a5f' }}>Sl No. {c.slNo}</div>
              <button onClick={() => removeCorrectiveAction(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑 Remove</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Non-Compliance Number</label>
                <input value={c.nonComplianceNumber} onChange={e => handleCorrectiveActionChange(index, 'nonComplianceNumber', e.target.value)} style={smallInput} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>TimeLine</label>
                <input value={c.timeline} onChange={e => handleCorrectiveActionChange(index, 'timeline', e.target.value)} placeholder="যেমনঃ ৩০ দিনের মধ্যে" style={smallInput} />
              </div>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Details of Non-Compliances</label>
              <textarea value={c.detailsOfNonCompliance} onChange={e => handleCorrectiveActionChange(index, 'detailsOfNonCompliance', e.target.value)} rows={2} style={{ ...smallInput, resize: 'vertical' as const }} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Non-Compliance Picture (লিংক)</label>
              <input value={c.nonCompliancePictureLink} onChange={e => handleCorrectiveActionChange(index, 'nonCompliancePictureLink', e.target.value)} placeholder="Google Drive / অন্য কোনো লিংক" style={smallInput} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Preventive &amp; Corrective Actions</label>
              <textarea value={c.preventiveCorrectiveActions} onChange={e => handleCorrectiveActionChange(index, 'preventiveCorrectiveActions', e.target.value)} rows={2} style={{ ...smallInput, resize: 'vertical' as const }} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Agreed By Management &amp; Name of Responsible Person</label>
              <input value={c.agreedByManagement} onChange={e => handleCorrectiveActionChange(index, 'agreedByManagement', e.target.value)} style={smallInput} />
              <div style={{ marginTop: 6 }}>
                <input value={c.responsiblePersonName} onChange={e => handleCorrectiveActionChange(index, 'responsiblePersonName', e.target.value)} placeholder="দায়িত্বপ্রাপ্ত ব্যক্তির নাম" style={smallInput} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={sectionCard}>
        <label style={labelStyle}>মন্তব্য</label>
        <textarea value={data.remarks} onChange={e => set('remarks', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
      </div>
    </>
  );
}
