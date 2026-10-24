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
// LAYOUT (four columns, fits without scrolling) — rows, left to right:
//   1. Audit Conducted By | Audit Date | NC ID | NC Reference
//   2. NC Description (full width)
//   3. Root Cause Analysis | Corrective Action Plan (CAP) (three columns wide)
//   4. Target Completion Date | CAP Status | NC Category / Keyword | Responsible Person(s)
//   5. [Attach file box] | Evidence 1 | Evidence 2 | Evidence 3
//   6. (only when file upload is set up) the Drive folder picker, full width
//
// FILE UPLOAD: the Apps Script URL and key are taken from the ACTIVE FACTORY
// (db.sheetsUrl / db.sheetsKey) with .env (VITE_SHEETS_URL / VITE_SHEETS_KEY) as
// a fallback — the same source the database adapter uses. Nothing to type into
// evidenceUpload.ts.
//
// DRIVE FOLDER: files are saved into the folder pasted in "Save files to", or —
// when that box is empty — the server's default (its EVIDENCE_FOLDER_ID Script
// Property). "Use folder" CHECKS with the server either way and says what it
// found, and "Attach file" checks the folder BEFORE sending anything, so a missing
// folder shows a clear message at once instead of after a big upload.
//
// ONE "Attach file" box serves all three evidence slots: each file you choose
// (up to three at once) goes into the next EMPTY slot — Evidence 1, then 2, then 3
// — and shows its file name under that slot with a ✕ to remove it. Any slot also
// takes a pasted link instead.
//
// Dates use DateFieldDMY (defined below, also reused by
// CorrectiveActionStatement.tsx): always DISPLAY DD-MM-YYYY, values stay ISO.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useMemo } from 'react';
import type { CorrectiveActionFormProps } from './types';
import { CAP_STATUS_OPTIONS, CAP_STATE_STYLE, getCapState, formatDMY } from './types';
import {
  EVIDENCE_ACCEPT, MAX_EVIDENCE_MB, isEvidenceUploadConfigured, uploadEvidenceFile, validateEvidenceFile,
  checkEvidenceFolder, getChosenFolder, setChosenFolder, resolveUploadConfig,
  type UploadConfig,
} from './evidenceUpload';
import { useFactory } from '../../../hooks/useFactory';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const fieldWrap: React.CSSProperties = { minWidth: 0 };
const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, fontFamily: font, color: '#1e293b',
  display: 'block', marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 12.5, fontFamily: font, background: '#fff',
  color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
const textareaStyle = (rows: number): React.CSSProperties => ({
  ...inputStyle, minHeight: rows === 3 ? 74 : 54, resize: 'vertical', lineHeight: 1.4,
});
const smallBtn: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: font, whiteSpace: 'nowrap',
};

const FORM_CSS = `
  .cap-form { container-type: inline-size; }
  .cap-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 14px; align-items: start; }
  .cap-grid > .s2 { grid-column: span 2; }
  .cap-grid > .s3 { grid-column: span 3; }
  .cap-grid > .s4 { grid-column: span 4; }
  @container (max-width: 760px) {
    .cap-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cap-grid > .s3, .cap-grid > .s4 { grid-column: span 2; }
  }
  @container (max-width: 480px) {
    .cap-grid { grid-template-columns: minmax(0, 1fr); }
    .cap-grid > .s2, .cap-grid > .s3, .cap-grid > .s4 { grid-column: span 1; }
  }
`;

// ─── DateFieldDMY: date field that always DISPLAYS DD-MM-YYYY ────────────────
// Keeps a native <input type="date"> (calendar picker, keyboard entry, min/max
// validation, accessibility) but hides it and paints its own face showing the
// value via formatDMY(). Value stays ISO (YYYY-MM-DD) in and out.
// Exported: CorrectiveActionStatement.tsx reuses it for its date filters.

const DMY_CSS = `
  .dmy-field:focus-within .dmy-box { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
  .dmy-clear:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

interface DateFieldDMYProps {
  /** ISO date 'YYYY-MM-DD' or ''. */
  value: string;
  onChange: (iso: string) => void;
  /** Accessible name for the hidden native input. */
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

// ─── Drive folder messages ────────────────────────────────────────────────────

/** Shown when the server answers "No Drive folder chosen" (nothing pasted and no server default). */
const NO_FOLDER_ATTACH = 'Choose a Drive folder first: paste a folder link in “Save files to” below and click Use folder.';
const NO_FOLDER_PICKER = 'The server has no default folder yet. Paste a Drive folder link above and click Use folder (or ask the administrator to set EVIDENCE_FOLDER_ID).';

function folderErrorText(err: unknown, chosenInput: string, whenMissing: string): string {
  const raw = err instanceof Error ? err.message : 'Could not check the Drive folder.';
  return !chosenInput && /no drive folder/i.test(raw) ? whenMissing : raw;
}

// ─── Folder picker: where attached files are saved in Google Drive ────────────

function FolderPicker({ cfg, onVerified }: { cfg: UploadConfig; onVerified: (input: string) => void }) {
  const initial = getChosenFolder();
  const [value, setValue] = useState(initial.input);
  const [name, setName]   = useState(initial.name);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Checks with the server — an EMPTY box means "the server's default folder", which is checked too.
  const apply = async () => {
    setError(''); setNotice('');
    const input = value.trim();
    setBusy(true);
    try {
      const info = await checkEvidenceFolder(cfg, input);
      setChosenFolder({ input, name: info.name });
      setName(info.name);
      onVerified(input);
      setNotice(input
        ? `Files will be saved to “${info.name}”.`
        : `Using the server’s default folder “${info.name}”.`);
    } catch (err) {
      setError(folderErrorText(err, input, NO_FOLDER_PICKER));
    } finally {
      setBusy(false);
    }
  };

  const nothingYet = !error && !notice && !name;

  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>Save files to (Drive folder)</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setNotice(''); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void apply(); } }}
          placeholder="Paste a folder link, or leave empty for the default"
          aria-label="Google Drive folder link"
          style={{ ...inputStyle, flex: 1, width: 'auto', minWidth: 0 }}
        />
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy}
          style={{ ...smallBtn, padding: '7px 12px', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Checking…' : 'Use folder'}
        </button>
      </div>
      {error && <div role="alert" style={{ marginTop: 4, fontSize: 11.5, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>{error}</div>}
      {!error && (notice || name) && (
        <div style={{ marginTop: 4, fontSize: 11.5, fontFamily: font, color: '#166534' }}>
          {notice || `Files will be saved to “${name}”.`}
        </div>
      )}
      {nothingYet && (
        <div style={{ marginTop: 4, fontSize: 11.5, fontFamily: font, color: '#64748b' }}>
          No folder chosen yet — paste a Drive folder link and click Use folder.
        </div>
      )}
    </div>
  );
}

// ─── Evidence slots ──────────────────────────────────────────────────────────

const EVIDENCE_SLOTS = [
  { label: 'Evidence 1', url: 'evidence1', name: 'evidence1Name' },
  { label: 'Evidence 2', url: 'evidence2', name: 'evidence2Name' },
  { label: 'Evidence 3', url: 'evidence3', name: 'evidence3Name' },
] as const;

export default function CorrectiveActionFormComponent({ data, setData, onUploadingChange }: CorrectiveActionFormProps) {
  const factory   = useFactory();
  const cfg       = useMemo(() => resolveUploadConfig(factory), [factory]);
  const canUpload = isEvidenceUploadConfigured(cfg);

  const set = <K extends keyof typeof data>(field: K, value: typeof data[K]) =>
    setData({ ...data, [field]: value });

  // Always the latest data, so uploads that finish later never overwrite what was typed meanwhile.
  const dataRef = useRef(data);
  dataRef.current = data;

  // The folder (pasted link, or '' = server default) that has already been verified this session.
  const verifiedFolder = useRef<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy]               = useState(false);
  const [attachError, setAttachError] = useState('');

  const setEvidence = (index: number, url: string, name: string) => {
    const slot = EVIDENCE_SLOTS[index];
    // Update the ref immediately so two uploads finishing back-to-back don't overwrite each other.
    const next = { ...dataRef.current, [slot.url]: url, [slot.name]: name } as typeof data;
    dataRef.current = next;
    setData(next);
  };

  // Each chosen file goes into the next empty evidence slot (1, then 2, then 3).
  const attachFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setAttachError('');

    const used = new Set<number>();
    const nextFree = () => EVIDENCE_SLOTS.findIndex((slot, i) => !dataRef.current[slot.url] && !used.has(i));
    if (nextFree() === -1) {
      setAttachError('All three evidence slots are in use — remove one first.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setBusy(true); onUploadingChange?.(true);
    const problems: string[] = [];
    try {
      // Check the Drive folder BEFORE sending any file (one tiny request, remembered for the session).
      const chosen = getChosenFolder().input;
      if (verifiedFolder.current !== chosen) {
        try {
          await checkEvidenceFolder(cfg, chosen);
          verifiedFolder.current = chosen;
        } catch (err) {
          setAttachError(folderErrorText(err, chosen, NO_FOLDER_ATTACH));
          return;                                            // nothing uploaded; finally{} resets the button
        }
      }

      for (const file of files) {
        const slot = nextFree();
        if (slot === -1) { problems.push(`No free slot left for “${file.name}”.`); continue; }
        const invalid = validateEvidenceFile(file);
        if (invalid) { problems.push(`${file.name}: ${invalid}`); continue; }
        try {
          used.add(slot);                                    // reserve the slot while uploading
          const uploaded = await uploadEvidenceFile(cfg, file);
          setEvidence(slot, uploaded.url, uploaded.name);
        } catch (err) {
          used.delete(slot);
          problems.push(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed.'}`);
        }
      }
    } finally {
      setBusy(false); onUploadingChange?.(false);
      if (fileRef.current) fileRef.current.value = '';       // allow choosing the same file again
    }
    if (problems.length) setAttachError(problems.join(' '));
  };

  const { state, detail } = getCapState(data.targetDate, data.capStatus);
  const s = CAP_STATE_STYLE[state];
  const rangeInvalid = Boolean(data.auditDate && data.targetDate && data.targetDate < data.auditDate);
  const compactDate: React.CSSProperties = { padding: '7px 10px', fontSize: 12.5 };

  return (
    <div className="cap-form" style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, boxSizing: 'border-box', width: '100%', maxWidth: '100%', overflowWrap: 'anywhere' }}>
      <style>{FORM_CSS}</style>
      <div className="cap-grid">

        {/* Row 1 */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Conducted By</label>
          <input value={data.auditConductedBy} onChange={e => set('auditConductedBy', e.target.value)} placeholder="Auditor / organization" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Audit Date</label>
          <div style={{ display: 'flex', minWidth: 0 }}>
            <DateFieldDMY
              value={data.auditDate}
              onChange={v => set('auditDate', v)}
              ariaLabel="Audit date"
              max={data.targetDate || undefined}
              clearable
              boxStyle={compactDate}
            />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>NC ID *</label>
          <input value={data.ncId} onChange={e => set('ncId', e.target.value)} placeholder="e.g., NC-012" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>NC Reference</label>
          <input value={data.ncReference} onChange={e => set('ncReference', e.target.value)} placeholder="Standard clause" style={inputStyle} />
        </div>

        {/* Row 2 */}
        <div className="s4" style={fieldWrap}>
          <label style={labelStyle}>NC Description *</label>
          <textarea value={data.ncDescription} onChange={e => set('ncDescription', e.target.value)} placeholder="Describe the non-conformance" style={textareaStyle(2)} />
        </div>

        {/* Row 3 */}
        <div style={fieldWrap}>
          <label style={labelStyle}>Root Cause Analysis</label>
          <textarea value={data.rootCause} onChange={e => set('rootCause', e.target.value)} placeholder="Why did it happen?" style={textareaStyle(3)} />
        </div>
        <div className="s3" style={fieldWrap}>
          <label style={labelStyle}>Corrective Action Plan (CAP)</label>
          <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} placeholder="Planned corrective action" style={textareaStyle(3)} />
        </div>

        {/* Row 4 */}
        <div style={fieldWrap}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 6px', marginBottom: 4 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Target Completion Date</label>
            {state !== 'no-date' && (
              <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: font, padding: '1px 7px', borderRadius: 10, background: s.bg, color: s.color }}>
                {s.label}{detail ? ` · ${detail}` : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', minWidth: 0 }}>
            <DateFieldDMY
              value={data.targetDate}
              onChange={v => set('targetDate', v)}
              ariaLabel="Target completion date"
              min={data.auditDate || undefined}
              invalid={rangeInvalid}
              clearable
              boxStyle={compactDate}
            />
          </div>
          {rangeInvalid && (
            <div role="alert" style={{ marginTop: 4, fontSize: 11.5, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
              Target can’t be before the audit date.
            </div>
          )}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>CAP Status</label>
          <select value={data.capStatus} onChange={e => set('capStatus', e.target.value)} style={inputStyle}>
            {CAP_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>NC Category / Keyword</label>
          <input value={data.ncCategory} onChange={e => set('ncCategory', e.target.value)} placeholder="e.g., Fire exit" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Responsible Person(s)</label>
          <input value={data.responsiblePersons} onChange={e => set('responsiblePersons', e.target.value)} placeholder="Names, comma separated" style={inputStyle} />
        </div>

        {/* Row 5 — one Attach box for all evidence + the three evidence slots */}
        <div style={{
          alignSelf: 'stretch', minHeight: 74, boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 12,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, background: '#fff',
        }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={EVIDENCE_ACCEPT}
            onChange={e => void attachFiles(e.target.files)}
            style={{ display: 'none' }}
            aria-label="Attach evidence files"
          />
          <button
            type="button"
            disabled={!canUpload || busy}
            onClick={() => fileRef.current?.click()}
            title={canUpload
              ? `Attach up to three files (PNG, JPEG, JPG, PDF, Word, Excel — max ${MAX_EVIDENCE_MB} MB each) — each goes into the next empty evidence slot`
              : 'File upload is not set up — this factory has no Apps Script URL / key. Paste a link in the evidence boxes instead'}
            style={{
              ...smallBtn, border: '1px dashed #93c5fd', background: '#fff', color: '#2563eb',
              cursor: !canUpload || busy ? 'not-allowed' : 'pointer', opacity: !canUpload ? 0.5 : 1,
            }}
          >
            {busy ? 'Uploading…' : 'Attach file'}
          </button>
          {!canUpload && (
            <div style={{ fontSize: 10.5, fontFamily: font, color: '#64748b', textAlign: 'center' }}>
              Upload not set up — paste links instead
            </div>
          )}
          {attachError && (
            <div role="alert" style={{ fontSize: 11, fontFamily: font, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>{attachError}</div>
          )}
        </div>
        {EVIDENCE_SLOTS.map((slot, i) => {
          const url  = data[slot.url];
          const name = data[slot.name];
          return (
            <div key={slot.url} style={fieldWrap}>
              <label style={labelStyle}>{slot.label}</label>
              <input
                value={url}
                onChange={e => setEvidence(i, e.target.value, '')}
                placeholder="Paste a link"
                aria-label={`${slot.label} link`}
                style={inputStyle}
              />
              {url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, minWidth: 0 }}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={name || url}
                    style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontFamily: font, color: '#2563eb', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >{name || url}</a>
                  <button
                    type="button"
                    aria-label={`Remove ${slot.label}`}
                    title="Remove"
                    onClick={() => setEvidence(i, '', '')}
                    style={{ ...smallBtn, padding: '3px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}
                  >✕</button>
                </div>
              )}
            </div>
          );
        })}

        {/* Row 6 — only when uploads are set up: which Drive folder the files go to */}
        {canUpload && (
          <div className="s4">
            <FolderPicker cfg={cfg} onVerified={input => { verifiedFolder.current = input; }} />
          </div>
        )}

      </div>
    </div>
  );
}