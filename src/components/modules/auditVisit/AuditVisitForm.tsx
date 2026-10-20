// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitForm.tsx — fixed form, one entry per save.
// Path: src/components/modules/auditVisit/AuditVisitForm.tsx
//
// UPDATE (DD-MM-YYYY display): the "Valid Until (Auto)" read-only box
// renders through formatDMY() from types.ts, so it displays DD-MM-YYYY
// instead of raw ISO — display only, the underlying `validUntil` value
// used for status calculation stays ISO (YYYY-MM-DD). The Visit Date
// start/end fields use DateFieldDMY (defined in this file, also reused by
// AuditVisitStatement.tsx): they always DISPLAY
// DD-MM-YYYY whatever the browser/OS locale, while the calendar picker, keyboard
// entry and min/max validation still come from a native date input underneath.
//
// UPDATE (Visit Date range, same field): "Visit Date *" now holds an
// optional date RANGE for audits that run over consecutive days.
//   - Single-day audit: just the start date (unchanged behaviour).
//   - Multi-day audit: click "+ End date" → "start to end". The ✕ button
//     removes the end date again.
//   - If the start date is moved past the end date, the end date follows it
//     so the range never silently becomes invalid; if the user picks an end
//     date before the start, an error shows and Save is blocked (Manager).
//   - Validity is counted from the LAST audit day (getValidityBase() in
//     types.ts): Valid Until and the status banner use the end date when
//     set, otherwise the visit date. A hint under the field says so.
//   - An end date equal to the start is saved as '' (single-day).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import type { AuditVisitFormProps } from './types';
import {
  VALIDITY_UNIT_OPTIONS, calculateValidUntil, formatDMY, getValidityBase, visitDays,
} from './types';
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
const linkBtn: React.CSSProperties = {
  background: 'none', border: '1px dashed #93c5fd', borderRadius: 8, padding: '8px 12px',
  fontSize: 12.5, fontWeight: 600, fontFamily: font, color: '#2563eb', cursor: 'pointer', whiteSpace: 'nowrap',
};

// ─── DateFieldDMY: date field that always DISPLAYS DD-MM-YYYY ────────────────
// A native <input type="date"> shows the browser/OS locale format (mm/dd/yyyy
// on US-English systems) and that can't be changed. This keeps the native input
// for what it does best — calendar picker, keyboard entry, min/max validation,
// accessibility — but hides it (transparent, stretched over the field) and
// paints its own face on top showing the value via formatDMY(). Clicking the
// field opens the picker (showPicker(); browsers without it fall back to the
// native control). Value stays ISO (YYYY-MM-DD) in and out — storage, sorting
// and date math are untouched. Exported: AuditVisitStatement.tsx reuses it for
// the Visit Date From / Valid Until To filters.

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

export default function AuditVisitFormComponent({ data, setData }: AuditVisitFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const hasEnd       = data.visitEndDate !== '';
  const rangeInvalid = hasEnd && data.visitEndDate < data.visitDate;
  const auditDays    = hasEnd ? visitDays(data.visitDate, data.visitEndDate) : 0;
  const baseDate     = getValidityBase(data.visitDate, data.visitEndDate);

  // Moving the start date past the end date drags the end date along.
  const onStartChange = (value: string) => {
    const next = { ...data, visitDate: value };
    if (data.visitEndDate && value && data.visitEndDate < value) next.visitEndDate = value;
    setData(next);
  };

  const validUntil = calculateValidUntil(baseDate, data.validityPeriodValue, data.validityPeriodUnit);
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

        {/* Visit Date — single day, or a range via "+ End date" */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Visit Date *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <DateFieldDMY
              value={data.visitDate}
              onChange={onStartChange}
              ariaLabel="Visit start date"
            />
            {hasEnd ? (
              <>
                <span aria-hidden="true" style={{ color: '#64748b', fontWeight: 600, fontSize: 12.5 }}>to</span>
                <DateFieldDMY
                  value={data.visitEndDate}
                  min={data.visitDate || undefined}
                  onChange={v => set('visitEndDate', v)}
                  ariaLabel="Visit end date"
                  invalid={rangeInvalid}
                />
                <button
                  type="button"
                  title="Remove end date"
                  aria-label="Remove end date"
                  onClick={() => set('visitEndDate', '')}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#475569', cursor: 'pointer' }}
                >✕</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => set('visitEndDate', data.visitDate)}
                disabled={!data.visitDate}
                style={{ ...linkBtn, opacity: data.visitDate ? 1 : 0.5, cursor: data.visitDate ? 'pointer' : 'default' }}
              >+ End date</button>
            )}
          </div>

          {rangeInvalid ? (
            <div style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
              End date can’t be before the visit date.
            </div>
          ) : hasEnd && auditDays > 1 ? (
            <div style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#64748b' }}>
              {auditDays} {auditDays === 1 ? 'day' : 'days'} · validity counts from the last day ({formatDMY(baseDate)})
            </div>
          ) : null}
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