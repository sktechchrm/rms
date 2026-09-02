// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitForm.tsx — fixed form, one entry per save.
// Path: src/components/modules/auditVisit/AuditVisitForm.tsx
//
// UPDATE (DD-MM-YYYY display): the "Valid Until (Auto)" read-only box now
// renders through formatDMY() from types.ts, so it displays DD-MM-YYYY
// instead of raw ISO — display only, the underlying `validUntil` value
// used for status calculation stays ISO (YYYY-MM-DD). The Visit Date
// field itself is a native <input type="date">, whose displayed format is
// controlled by the browser/OS locale and can't be overridden here.
// ─────────────────────────────────────────────────────────────────────────────

import type { AuditVisitFormProps } from './types';
import { VALIDITY_UNIT_OPTIONS, calculateValidUntil, formatDMY } from './types';
import { getExpiryStatus, daysUntil, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';

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

export default function AuditVisitFormComponent({ data, setData }: AuditVisitFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const validUntil = calculateValidUntil(data.visitDate, data.validityPeriodValue, data.validityPeriodUnit);
  const status = getExpiryStatus(validUntil);
  const days   = daysUntil(validUntil);
  const s      = EXPIRY_STATUS_STYLE[status];

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Audit / Certification *</label>
        <input value={data.auditCertification} onChange={e => set('auditCertification', e.target.value)} placeholder="e.g., BSCI Social Compliance Audit" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Standard / Buyer</label>
          <input value={data.standardBuyer} onChange={e => set('standardBuyer', e.target.value)} placeholder="e.g., BSCI, Walmart, H&M" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Auditor / Organization</label>
          <input value={data.auditorOrganization} onChange={e => set('auditorOrganization', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Visit Date *</label>
          <input type="date" value={data.visitDate} onChange={e => set('visitDate', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Report / Certificate (link)</label>
          <input value={data.reportCertificate} onChange={e => set('reportCertificate', e.target.value)} placeholder="Google Drive link, etc." style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Validity Period *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number" min={0}
              value={data.validityPeriodValue}
              onChange={e => set('validityPeriodValue', e.target.value)}
              style={{ ...inputStyle, width: 90 }}
            />
            <select
              value={data.validityPeriodUnit}
              onChange={e => set('validityPeriodUnit', e.target.value as typeof data.validityPeriodUnit)}
              style={inputStyle}
            >
              {VALIDITY_UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Valid Until (Auto)</label>
          <div style={{ ...inputStyle, background: '#f8fafc', fontWeight: 600, color: '#475569' }}>
            {formatDMY(validUntil) || '—'}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 8, padding: '12px 16px', background: s.bg, border: `1px solid ${s.color}33`,
        borderRadius: 8, fontSize: 13, fontFamily: font, color: s.color, fontWeight: 600,
      }}>
        Status: {s.label}{status !== 'unknown' && days !== null ? ` — ${days} days remaining` : ''}
      </div>
    </div>
  );
}