// ─────────────────────────────────────────────────────────────────────────────
// SupplierForm.tsx — fixed supplier info + array of assessment entries (one
// supplier can be assessed against multiple standards, per explicit
// confirmation).
// Path: src/components/modules/supplierAssessment/SupplierForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { getExpiryStatus, daysUntil, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { STANDARD_OPTIONS, APPROVAL_STATUS_OPTIONS, BUSINESS_TYPE_OPTIONS, blankAssessmentEntry } from './types';
import type { SupplierData, SupplierAssessmentEntry } from './types';

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
const thStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #f1f5f9',
  verticalAlign: 'middle',
};

const APPROVAL_COLORS: Record<string, { bg: string; color: string }> = {
  Pending:     { bg: '#f1f5f9', color: '#64748b' },
  Approved:    { bg: '#f0fdf4', color: '#15803d' },
  Conditional: { bg: '#fef3c7', color: '#92400e' },
  Rejected:    { bg: '#fee2e2', color: '#b91c1c' },
};

interface Props {
  data: SupplierData;
  setData: (data: SupplierData) => void;
}

export default function SupplierForm({ data, setData }: Props) {
  const set = <K extends keyof SupplierData>(field: K, value: SupplierData[K]) =>
    setData({ ...data, [field]: value });

  const handleAssessmentChange = (index: number, field: keyof SupplierAssessmentEntry, value: string) => {
    const updated = [...data.assessments];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, assessments: updated });
  };

  const addAssessment = () => {
    const reNumbered = [blankAssessmentEntry(1), ...data.assessments].map((a, i) => ({ ...a, slNo: i + 1 }));
    setData({ ...data, assessments: reNumbered });
  };

  const removeAssessment = (index: number) => {
    if (data.assessments.length <= 1) return;
    const filtered = data.assessments.filter((_, i) => i !== index);
    setData({ ...data, assessments: filtered.map((a, i) => ({ ...a, slNo: i + 1 })) });
  };

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b', marginBottom: 12 }}>Supplier Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Supplier Name *</label>
            <input value={data.supplierName} onChange={e => set('supplierName', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Business Type</label>
            <select value={data.businessType} onChange={e => set('businessType', e.target.value)} style={inputStyle}>
              {BUSINESS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Address</label>
            <input value={data.address} onChange={e => set('address', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Product/Service Category</label>
            <input value={data.productCategory} onChange={e => set('productCategory', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Contact Person</label>
            <input value={data.contactPerson} onChange={e => set('contactPerson', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Trade License No.</label>
            <input value={data.tradeLicenseNo} onChange={e => set('tradeLicenseNo', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Phone</label>
            <input value={data.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Email</label>
            <input value={data.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b' }}>Assessments (one per standard / audit cycle)</span>
          <button onClick={addAssessment} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
            + Add Assessment
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1600 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 36 }}>SL</th>
                <th style={{ ...thStyle, width: 110 }}>Standard</th>
                <th style={{ ...thStyle, width: 110 }}>Audit Type</th>
                <th style={{ ...thStyle, width: 120 }}>Audit Date</th>
                <th style={{ ...thStyle, width: 150 }}>Auditor/Body</th>
                <th style={{ ...thStyle, width: 100 }}>Score</th>
                <th style={{ ...thStyle, width: 160 }}>Key Findings</th>
                <th style={{ ...thStyle, width: 160 }}>Non-Conformities</th>
                <th style={{ ...thStyle, width: 130 }}>Cert. Valid Until</th>
                <th style={{ ...thStyle, width: 130 }}>Report Link</th>
                <th style={{ ...thStyle, width: 120 }}>Approval</th>
                <th style={{ ...thStyle, width: 150 }}>Conditions</th>
                <th style={{ ...thStyle, width: 120 }}>Approved By</th>
                <th style={{ ...thStyle, width: 120 }}>Next Review</th>
                <th style={{ ...thStyle, width: 40, borderRight: 'none' }} />
              </tr>
            </thead>
            <tbody>
              {data.assessments.map((a, index) => {
                const status = getExpiryStatus(a.certificateValidUntil);
                const days   = daysUntil(a.certificateValidUntil);
                const s      = EXPIRY_STATUS_STYLE[status];
                const ac     = APPROVAL_COLORS[a.approvalStatus];
                return (
                  <tr key={index}>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{a.slNo}</td>
                    <td style={tdStyle}>
                      <select value={a.standard} onChange={e => handleAssessmentChange(index, 'standard', e.target.value)} style={smallInput}>
                        {STANDARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}><input value={a.auditType} onChange={e => handleAssessmentChange(index, 'auditType', e.target.value)} placeholder="e.g. 4-Pillar, Gold" style={smallInput} /></td>
                    <td style={tdStyle}><input type="date" value={a.auditDate} onChange={e => handleAssessmentChange(index, 'auditDate', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={a.auditorBody} onChange={e => handleAssessmentChange(index, 'auditorBody', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={a.score} onChange={e => handleAssessmentChange(index, 'score', e.target.value)} placeholder="e.g. Grade A" style={smallInput} /></td>
                    <td style={tdStyle}><input value={a.keyFindings} onChange={e => handleAssessmentChange(index, 'keyFindings', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input value={a.nonConformities} onChange={e => handleAssessmentChange(index, 'nonConformities', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}>
                      <input type="date" value={a.certificateValidUntil} onChange={e => handleAssessmentChange(index, 'certificateValidUntil', e.target.value)} style={smallInput} />
                      {a.certificateValidUntil && (
                        <div style={{ marginTop: 3, fontSize: 10, fontWeight: 600, color: s.color }}>
                          {s.label}{status !== 'unknown' && days !== null ? ` (${days}d)` : ''}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}><input value={a.reportLink} onChange={e => handleAssessmentChange(index, 'reportLink', e.target.value)} placeholder="Link" style={smallInput} /></td>
                    <td style={tdStyle}>
                      <select value={a.approvalStatus} onChange={e => handleAssessmentChange(index, 'approvalStatus', e.target.value)} style={{ ...smallInput, background: ac.bg, color: ac.color, fontWeight: 600 }}>
                        {APPROVAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input
                        value={a.approvalConditions}
                        onChange={e => handleAssessmentChange(index, 'approvalConditions', e.target.value)}
                        placeholder={a.approvalStatus === 'Conditional' ? 'e.g. Fix fire exits by...' : '—'}
                        disabled={a.approvalStatus !== 'Conditional'}
                        style={{ ...smallInput, opacity: a.approvalStatus !== 'Conditional' ? 0.5 : 1 }}
                      />
                    </td>
                    <td style={tdStyle}><input value={a.approvedBy} onChange={e => handleAssessmentChange(index, 'approvedBy', e.target.value)} style={smallInput} /></td>
                    <td style={tdStyle}><input type="date" value={a.nextReviewDate} onChange={e => handleAssessmentChange(index, 'nextReviewDate', e.target.value)} style={smallInput} /></td>
                    <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center' }}>
                      <button onClick={() => removeAssessment(index)} title="Remove" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
