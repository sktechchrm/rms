// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitForm.tsx — fixed form, one entry per save (matches Left Notice's
// EmployeeInfoForm.tsx pattern, not Requisition's dynamic-row table).
// Path: src/components/modules/auditVisit/AuditVisitForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { AuditVisitFormProps } from './types';
import { DURATION_OPTIONS, TYPE_OPTIONS, MODE_OPTIONS, calculateNextAuditDate } from './types';

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

  const nextDate = calculateNextAuditDate(data.date, data.validityMonths, data.validityYears);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

        <div style={fieldWrap}>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={data.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Types *</label>
          <select value={data.type} onChange={e => set('type', e.target.value as typeof data.type)} style={inputStyle}>
            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Duration *</label>
          <select value={data.duration} onChange={e => set('duration', e.target.value)} style={inputStyle}>
            {DURATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Certification For</label>
          <input value={data.certificationFor} onChange={e => set('certificationFor', e.target.value)} placeholder="e.g., BSCI" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Firm</label>
          <input value={data.auditFirm} onChange={e => set('auditFirm', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Name of Auditor</label>
          <input value={data.auditorName} onChange={e => set('auditorName', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Mode</label>
          <select value={data.auditMode} onChange={e => set('auditMode', e.target.value as typeof data.auditMode)} style={inputStyle}>
            {MODE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Results/Score</label>
          <input value={data.resultsScore} onChange={e => set('resultsScore', e.target.value)} placeholder="e.g., 92%" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Validity Time — Years</label>
          <input type="number" min={0} value={data.validityYears} onChange={e => set('validityYears', e.target.value)} style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Validity Time — Months</label>
          <input type="number" min={0} max={11} value={data.validityMonths} onChange={e => set('validityMonths', e.target.value)} style={inputStyle} />
        </div>

      </div>

      <div style={{
        marginTop: 8, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac',
        borderRadius: 8, fontSize: 13, fontFamily: font, color: '#15803d', fontWeight: 600,
      }}>
        Next Audit Date (auto-calculated): {nextDate || '—'}
      </div>
    </div>
  );
}
