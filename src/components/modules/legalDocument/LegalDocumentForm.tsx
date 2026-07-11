// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentForm.tsx — fixed form, one document per save.
// Path: src/components/modules/legalDocument/LegalDocumentForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocumentFormProps } from './types';
import { CATEGORY_OPTIONS } from './types';
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

export default function LegalDocumentFormComponent({ data, setData }: LegalDocumentFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const status = getExpiryStatus(data.expiryDate);
  const days   = daysUntil(data.expiryDate);
  const s      = EXPIRY_STATUS_STYLE[status];

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Document Title *</label>
        <input value={data.documentTitle} onChange={e => set('documentTitle', e.target.value)} placeholder="e.g., Fire Safety License" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Category</label>
          <select value={data.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
            {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Document No.</label>
          <input value={data.documentNo} onChange={e => set('documentNo', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Issuing Authority</label>
          <input value={data.issuingAuthority} onChange={e => set('issuingAuthority', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Attachment (link)</label>
          <input value={data.attachment} onChange={e => set('attachment', e.target.value)} placeholder="Google Drive link, etc." style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Issue Date</label>
          <input type="date" value={data.issueDate} onChange={e => set('issueDate', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Expiry Date *</label>
          <input type="date" value={data.expiryDate} onChange={e => set('expiryDate', e.target.value)} style={inputStyle} />
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
