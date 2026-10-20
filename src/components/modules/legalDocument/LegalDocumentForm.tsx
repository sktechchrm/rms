// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentForm.tsx — fixed form, one document per save.
// Path: src/components/modules/legalDocument/LegalDocumentForm.tsx
//
// UPDATE (aligned with the Audit/Visit module): Issue Date and Expiry Date use
// DateFieldDMY (defined below, also reused by LegalDocumentStatement.tsx): they
// always DISPLAY DD-MM-YYYY whatever the browser/OS locale, while the calendar
// picker, keyboard entry and min/max validation still come from a native date
// input underneath. Values stay ISO (YYYY-MM-DD). The Expiry Date can't be
// picked before the Issue Date; if it ends up earlier an error shows and Save
// is blocked (LegalDocumentManager).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import type { LegalDocumentFormProps } from './types';
import { CATEGORY_OPTIONS, formatDMY } from './types';
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

// ─── DateFieldDMY: date field that always DISPLAYS DD-MM-YYYY ────────────────
// A native <input type="date"> shows the browser/OS locale format (mm/dd/yyyy
// on US-English systems) and that can't be changed. This keeps the native input
// for what it does best — calendar picker, keyboard entry, min/max validation,
// accessibility — but hides it (transparent, stretched over the field) and
// paints its own face on top showing the value via formatDMY(). Clicking the
// field opens the picker (showPicker(); browsers without it fall back to the
// native control). Value stays ISO (YYYY-MM-DD) in and out — storage, sorting
// and date math are untouched. Exported: LegalDocumentStatement.tsx reuses it for
// the Expiry From / Expiry To filters.

const DMY_CSS = `
  .dmy-field:focus-within .dmy-box { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
  .dmy-clear:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

interface DateFieldDMYProps {
  /** ISO date 'YYYY-MM-DD' or ''. */
  value: string;
  onChange: (iso: string) => void;
  /** Accessible name for the hidden native input (visible <label>s don't reach it). */
  ariaLabel: string;
  min?: string;
  max?: string;
  invalid?: boolean;
  placeholder?: string;
  /** Show an inline ✕ that clears the value. */
  clearable?: boolean;
  /** Overrides for the visible face (padding, radius, colors…). */
  boxStyle?: React.CSSProperties;
}

export function DateFieldDMY({
  value, onChange, ariaLabel, min, max, invalid, placeholder = 'dd-mm-yyyy', clearable = false, boxStyle,
}: DateFieldDMYProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    try { (inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null)?.showPicker?.(); }
    catch { /* unsupported: the native control still works on its own */ }
  };

  return (
    <div className="dmy-field" style={{ position: 'relative', flex: '1 1 140px', minWidth: 140 }}>
      <style>{DMY_CSS}</style>

      <div
        className="dmy-box"
        aria-hidden="true"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          width: '100%', boxSizing: 'border-box', padding: '9px 12px',
          border: `1px solid ${invalid ? '#dc2626' : '#cbd5e1'}`, borderRadius: 8,
          fontSize: 13, fontFamily: font, background: '#fff',
          color: value ? '#1e293b' : '#94a3b8',
          ...boxStyle,
        }}
      >
        <span>{value ? formatDMY(value) : placeholder}</span>
        <span style={{ color: '#64748b', display: 'inline-flex', paddingRight: clearable && value ? 22 : 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
      </div>

      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        onClick={openPicker}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
      />

      {clearable && value && (
        <button
          type="button"
          className="dmy-clear"
          aria-label={`Clear ${ariaLabel}`}
          title="Clear"
          onClick={() => onChange('')}
          style={{
            position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            display: 'inline-flex', alignItems: 'center', background: '#dbeafe', color: '#1d4ed8',
            border: 'none', borderRadius: 10, lineHeight: 1, padding: '3px 5px', cursor: 'pointer',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}


export default function LegalDocumentFormComponent({ data, setData }: LegalDocumentFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const status = getExpiryStatus(data.expiryDate);
  const days   = daysUntil(data.expiryDate);
  const s      = EXPIRY_STATUS_STYLE[status];
  const rangeInvalid = Boolean(data.issueDate && data.expiryDate && data.expiryDate < data.issueDate);

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
          <div style={{ display: 'flex' }}>
            <DateFieldDMY
              value={data.issueDate}
              onChange={v => set('issueDate', v)}
              ariaLabel="Issue date"
              max={data.expiryDate || undefined}
              clearable
            />
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Expiry Date *</label>
          <div style={{ display: 'flex' }}>
            <DateFieldDMY
              value={data.expiryDate}
              onChange={v => set('expiryDate', v)}
              ariaLabel="Expiry date"
              min={data.issueDate || undefined}
              invalid={rangeInvalid}
            />
          </div>
          {rangeInvalid && (
            <div style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
              Expiry date can’t be before the issue date.
            </div>
          )}
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