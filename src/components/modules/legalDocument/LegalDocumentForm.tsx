// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentForm.tsx — fixed form, one document per save.
// Path: src/components/modules/legalDocument/LegalDocumentForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocumentFormProps } from './types';
import { getExpiryStatus, daysUntilExpiry } from './types';

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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  expired:    { bg: '#fee2e2', color: '#b91c1c', label: '⚠ মেয়াদোত্তীর্ণ' },
  'due-soon': { bg: '#fef3c7', color: '#92400e', label: '⏰ শীঘ্রই মেয়াদ শেষ (২ মাসের মধ্যে)' },
  valid:      { bg: '#f0fdf4', color: '#15803d', label: '✓ বৈধ' },
  unknown:    { bg: '#f1f5f9', color: '#64748b', label: 'মেয়াদ শেষের তারিখ দিন' },
};

export default function LegalDocumentFormComponent({ data, setData }: LegalDocumentFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const status = getExpiryStatus(data.dateExpire);
  const days   = daysUntilExpiry(data.dateExpire);
  const s      = STATUS_STYLE[status];

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Details of Documents *</label>
        <input value={data.documentDetails} onChange={e => set('documentDetails', e.target.value)} placeholder="e.g., Fire License" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Mentioned Capacity/Category</label>
          <input value={data.mentionedCapacity} onChange={e => set('mentionedCapacity', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Document Authority Body</label>
          <input value={data.authorityBody} onChange={e => set('authorityBody', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Date of Received</label>
          <input type="date" value={data.dateReceived} onChange={e => set('dateReceived', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Date of Expire *</label>
          <input type="date" value={data.dateExpire} onChange={e => set('dateExpire', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{
        marginTop: 8, padding: '12px 16px', background: s.bg, border: `1px solid ${s.color}33`,
        borderRadius: 8, fontSize: 13, fontFamily: font, color: s.color, fontWeight: 600,
      }}>
        {s.label}{status !== 'unknown' && days !== null ? ` — ${days} দিন বাকি` : ''}
      </div>
    </div>
  );
}
