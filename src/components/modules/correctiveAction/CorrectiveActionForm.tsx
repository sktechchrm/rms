// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionForm.tsx — fixed form, one non-conformance (CAP row) per save.
// Path: src/components/modules/correctiveAction/CorrectiveActionForm.tsx
//
// Fields (same order as the Statement columns): Audit Conducted By, Audit Date,
// NC ID *, NC Reference, NC Description *, NC Category / Keyword, Responsible
// Person(s), Root Cause Analysis, Corrective Action Plan (CAP), Target
// Completion Date, CAP Status, Evidence 1–3. (SL No. is the row number and
// Overdue is calculated, so neither is typed.)
//
// Dates use DateFieldDMY (defined below, also reused by
// CorrectiveActionStatement.tsx): they always DISPLAY DD-MM-YYYY whatever the
// browser/OS locale, while the calendar picker and validation come from a native
// date input underneath. Values stay ISO (YYYY-MM-DD). The Target Completion Date
// can't be before the Audit Date — if it is, an error shows and Save is blocked
// (CorrectiveActionManager).
//
// Evidence 1–3: "Attach file" (PNG, JPEG, JPG, PDF, Word, Excel, max 10 MB) uploads
// to Google Drive through evidenceUpload.ts; the record keeps the link and the
// file name. Pasting a link works too, and is the only option until the upload
// address is set up.
//
// The status banner at the bottom is the live deadline state (Overdue / Due Soon /
// On Track / Done / No Date) from getCapState() in types.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import type { CorrectiveActionFormProps } from './types';
import { CAP_STATUS_OPTIONS, CAP_STATE_STYLE, getCapState, formatDMY } from './types';
import {
  EVIDENCE_ACCEPT, MAX_EVIDENCE_MB, isEvidenceUploadConfigured, uploadEvidenceFile, validateEvidenceFile,
} from './evidenceUpload';

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
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 74, resize: 'vertical', lineHeight: 1.45 };
const fullRow: React.CSSProperties = { gridColumn: '1 / -1' };

// ─── DateFieldDMY: date field that always DISPLAYS DD-MM-YYYY ────────────────
// A native <input type="date"> shows the browser/OS locale format (mm/dd/yyyy
// on US-English systems) and that can't be changed. This keeps the native input
// for what it does best — calendar picker, keyboard entry, min/max validation,
// accessibility — but hides it (transparent, stretched over the field) and
// paints its own face on top showing the value via formatDMY(). Clicking the
// field opens the picker (showPicker(); browsers without it fall back to the
// native control). Value stays ISO (YYYY-MM-DD) in and out — storage, sorting
// and date math are untouched. Exported: CorrectiveActionStatement.tsx reuses it for
// the Audit Date From / Target Date To filters.

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



// ─── Evidence field: attach a file or paste a link ───────────────────────────

interface EvidenceFieldProps {
  label: string;
  url: string;
  name: string;
  onChange: (next: { url: string; name: string }) => void;
  onBusyChange: (busy: boolean) => void;
}

function EvidenceField({ label, url, name, onChange, onBusyChange }: EvidenceFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const canUpload = isEvidenceUploadConfigured();

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateEvidenceFile(file);
    if (problem) { setError(problem); return; }
    setError(''); setBusy(true); onBusyChange(true);
    try {
      const uploaded = await uploadEvidenceFile(file);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false); onBusyChange(false);
      if (fileRef.current) fileRef.current.value = '';   // allow choosing the same file again
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={url}
          onChange={e => onChange({ url: e.target.value, name: '' })}
          placeholder={canUpload ? 'Attach a file, or paste a link' : 'Paste a link (Google Drive, etc.)'}
          aria-label={`${label} link`}
          style={{ ...inputStyle, flex: 1, width: 'auto', minWidth: 200 }}
        />
        <input
          ref={fileRef}
          type="file"
          accept={EVIDENCE_ACCEPT}
          onChange={e => pickFile(e.target.files?.[0])}
          style={{ display: 'none' }}
          aria-label={`${label} file`}
        />
        <button
          type="button"
          disabled={!canUpload || busy}
          onClick={() => fileRef.current?.click()}
          title={canUpload ? `PNG, JPEG, JPG, PDF, Word, Excel — max ${MAX_EVIDENCE_MB} MB` : 'File upload is not set up yet — paste a link instead'}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: font, whiteSpace: 'nowrap',
            border: '1px dashed #93c5fd', background: '#fff', color: '#2563eb',
            cursor: !canUpload || busy ? 'not-allowed' : 'pointer', opacity: !canUpload ? 0.5 : 1,
          }}
        >
          {busy ? 'Uploading…' : 'Attach file'}
        </button>
        {url && !busy && (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            title="Remove"
            onClick={() => { setError(''); onChange({ url: '', name: '' }); }}
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#475569', cursor: 'pointer' }}
          >✕</button>
        )}
      </div>
      {error && <div role="alert" style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>{error}</div>}
      {!error && url && (
        <div style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#64748b' }}>
          {name ? 'Attached: ' : 'Link: '}
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>{name || url}</a>
        </div>
      )}
    </div>
  );
}

export default function CorrectiveActionFormComponent({ data, setData, onUploadingChange }: CorrectiveActionFormProps) {
  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  const busyRef = useRef<boolean[]>([false, false, false]);
  const reportBusy = (i: number) => (busy: boolean) => {
    busyRef.current[i] = busy;
    onUploadingChange?.(busyRef.current.some(Boolean));
  };

  const { state, detail } = getCapState(data.targetDate, data.capStatus);
  const s = CAP_STATE_STYLE[state];
  const rangeInvalid = Boolean(data.auditDate && data.targetDate && data.targetDate < data.auditDate);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Conducted By</label>
          <input value={data.auditConductedBy} onChange={e => set('auditConductedBy', e.target.value)} placeholder="Auditor / organization" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Date</label>
          <div style={{ display: 'flex' }}>
            <DateFieldDMY
              value={data.auditDate}
              onChange={v => set('auditDate', v)}
              ariaLabel="Audit date"
              max={data.targetDate || undefined}
              clearable
            />
          </div>
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>NC ID *</label>
          <input value={data.ncId} onChange={e => set('ncId', e.target.value)} placeholder="e.g., NC-012" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>NC Reference</label>
          <input value={data.ncReference} onChange={e => set('ncReference', e.target.value)} placeholder="Standard clause / reference" style={inputStyle} />
        </div>

        <div style={{ ...fieldWrap, ...fullRow }}>
          <label style={labelStyle}>NC Description *</label>
          <textarea value={data.ncDescription} onChange={e => set('ncDescription', e.target.value)} placeholder="Describe the non-conformance" style={textareaStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>NC Category / Keyword</label>
          <input value={data.ncCategory} onChange={e => set('ncCategory', e.target.value)} placeholder="e.g., Health & Safety, Fire exit" style={inputStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Responsible Person(s)</label>
          <input value={data.responsiblePersons} onChange={e => set('responsiblePersons', e.target.value)} placeholder="Separate several names with commas" style={inputStyle} />
        </div>

        <div style={{ ...fieldWrap, ...fullRow }}>
          <label style={labelStyle}>Root Cause Analysis</label>
          <textarea value={data.rootCause} onChange={e => set('rootCause', e.target.value)} placeholder="Why did it happen?" style={textareaStyle} />
        </div>

        <div style={{ ...fieldWrap, ...fullRow }}>
          <label style={labelStyle}>Corrective Action Plan (CAP)</label>
          <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} placeholder="Planned corrective action" style={textareaStyle} />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Target Completion Date</label>
          <div style={{ display: 'flex' }}>
            <DateFieldDMY
              value={data.targetDate}
              onChange={v => set('targetDate', v)}
              ariaLabel="Target completion date"
              min={data.auditDate || undefined}
              invalid={rangeInvalid}
              clearable
            />
          </div>
          {rangeInvalid && (
            <div role="alert" style={{ marginTop: 6, fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
              Target date can’t be before the audit date.
            </div>
          )}
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>CAP Status</label>
          <select value={data.capStatus} onChange={e => set('capStatus', e.target.value)} style={inputStyle}>
            {CAP_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ ...fieldWrap, ...fullRow, border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px 2px', background: '#f8fafc' }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: font, color: '#1e293b', marginBottom: 2 }}>Evidence</div>
          <div style={{ fontSize: 12, fontFamily: font, color: '#64748b', marginBottom: 12 }}>
            {isEvidenceUploadConfigured()
              ? `Attach PNG, JPEG, JPG, PDF, Word or Excel files (max ${MAX_EVIDENCE_MB} MB each), or paste a link.`
              : 'File upload is not set up yet, so paste a link (e.g. Google Drive). See evidenceUpload.ts to switch on file attachments.'}
          </div>
          <EvidenceField label="Evidence 1" url={data.evidence1} name={data.evidence1Name}
            onChange={v => setData({ ...data, evidence1: v.url, evidence1Name: v.name })} onBusyChange={reportBusy(0)} />
          <EvidenceField label="Evidence 2" url={data.evidence2} name={data.evidence2Name}
            onChange={v => setData({ ...data, evidence2: v.url, evidence2Name: v.name })} onBusyChange={reportBusy(1)} />
          <EvidenceField label="Evidence 3" url={data.evidence3} name={data.evidence3Name}
            onChange={v => setData({ ...data, evidence3: v.url, evidence3Name: v.name })} onBusyChange={reportBusy(2)} />
        </div>
      </div>

      <div style={{
        marginTop: 8, padding: '12px 16px', background: s.bg, border: `1px solid ${s.color}33`,
        borderRadius: 8, fontSize: 13, fontFamily: font, color: s.color, fontWeight: 600,
      }}>
        Status: {s.label}{detail ? ` — ${detail}` : ''}{data.targetDate ? ` (target ${formatDMY(data.targetDate)})` : ''}
      </div>
    </div>
  );
}