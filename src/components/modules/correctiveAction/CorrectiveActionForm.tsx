// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionForm.tsx — fixed form, one non-conformance (CAP row) per save.
// Path: src/components/modules/correctiveAction/CorrectiveActionForm.tsx
//
// LAYOUT (four columns):
//   1. Audit Conducted By (buyer list + typing) | Audit Date | NC ID | NC Reference
//   2. NC Description (full width)
//   3. Root Cause Analysis | Corrective Action Plan (CAP)
//   4. Target Completion Date | CAP Status | NC Category / Keyword | Responsible Person(s)
//   5. [Attach file box with "i" ball] | Evidence 1 | Evidence 2 | Evidence 3
//
// DATES: DateFieldDMY accepts typing (25102026 → 25-10-2026) AND the calendar picker.
// BUYERS: "Audit Conducted By" suggests common buyers; any other name can be typed.
// FILE NAMES: uploads are named <NC ID>.1.<ext>, <NC ID>.2.<ext>, <NC ID>.3.<ext>.
// DRIVE FOLDER: chosen from the "i" ball in the Attach box (empty = server default).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useMemo, useEffect } from 'react';
import type { CorrectiveActionFormProps } from './types';
import { CAP_STATUS_OPTIONS, CAP_STATE_STYLE, getCapState, formatDMY } from './types';
import {
  EVIDENCE_ACCEPT, MAX_EVIDENCE_MB, isEvidenceUploadConfigured, uploadEvidenceFile, validateEvidenceFile,
  checkEvidenceFolder, getChosenFolder, setChosenFolder, resolveUploadConfig,
  type UploadConfig,
} from './evidenceUpload';
import { EvidenceThumb } from './EvidenceView';
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
  .cap-info:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

// ─── DateFieldDMY: typed or picked, always DISPLAYS DD-MM-YYYY ────────────────
// Exported: CorrectiveActionStatement.tsx reuses it for its date filters.

const DMY_CSS = `
  .dmy-field:focus-within .dmy-box { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); }
  .dmy-text::placeholder { color: #94a3b8; font-weight: 400; }
  .dmy-btn:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

/** "25-10-2026" → "2026-10-25"; null when incomplete or not a real date. */
function parseDMY(text: string): string | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Keeps digits only and inserts the dashes: "25102026" → "25-10-2026". */
function maskDMY(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return d;
}

interface DateFieldDMYProps {
  value: string;
  onChange: (iso: string) => void;
  ariaLabel: string;
  min?: string;
  max?: string;
  invalid?: boolean;
  placeholder?: string;
  clearable?: boolean;
  boxStyle?: React.CSSProperties;
}

export function DateFieldDMY({
  value, onChange, ariaLabel, min, max, invalid, placeholder = 'dd-mm-yyyy', clearable = false, boxStyle,
}: DateFieldDMYProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value ? formatDMY(value) : '');
  const [prevValue, setPrevValue] = useState(value);

  // Follow the value when it changes from outside (calendar, Clear, loading a record).
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value ? formatDMY(value) : '');
  }

  const handleType = (raw: string) => {
    const t = maskDMY(raw);
    setText(t);
    if (t === '') { if (value) onChange(''); return; }
    const iso = parseDMY(t);
    if (iso && iso !== value) onChange(iso);
  };

  const openPicker = () => {
    const el = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    try { if (el.showPicker) el.showPicker(); else el.focus(); } catch { el.focus(); }
  };

  const badText = text.length === 10 && parseDMY(text) === null;

  return (
    <div className="dmy-field" style={{ position: 'relative', flex: '1 1 140px', minWidth: 140 }}>
      <style>{DMY_CSS}</style>

      <div
        className="dmy-box"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', boxSizing: 'border-box', padding: '9px 12px',
          border: `1px solid ${invalid || badText ? '#dc2626' : '#cbd5e1'}`, borderRadius: 8,
          fontSize: 13, fontFamily: font, background: '#fff', color: '#1e293b',
          ...boxStyle,
        }}
      >
        <input
          className="dmy-text"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          value={text}
          onChange={e => handleType(e.target.value)}
          onBlur={() => setText(value ? formatDMY(value) : '')}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={invalid || badText || undefined}
          style={{
            flex: 1, minWidth: 0, width: '100%', border: 'none', outline: 'none',
            background: 'transparent', padding: 0, margin: 0, font: 'inherit', color: 'inherit',
          }}
        />

        {clearable && value && (
          <button
            type="button"
            className="dmy-btn"
            aria-label={`Clear ${ariaLabel}`}
            title="Clear"
            onClick={() => onChange('')}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', background: '#dbeafe', color: '#1d4ed8',
              border: 'none', borderRadius: 10, lineHeight: 1, padding: '3px 5px', cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}

        <button
          type="button"
          className="dmy-btn"
          aria-label={`Open calendar for ${ariaLabel}`}
          title="Pick from calendar"
          onClick={openPicker}
          style={{ flexShrink: 0, display: 'inline-flex', background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>

      {/* Native date input: only used to show the calendar popup (and min/max for it) */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 1, opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}

// ─── Drive folder messages ────────────────────────────────────────────────────

const NO_FOLDER_ATTACH = 'Choose a Drive folder first: click the (i) in this box, paste a folder link and click Use folder.';
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

// ─── Evidence slots + buyers ─────────────────────────────────────────────────

const EVIDENCE_SLOTS = [
  { label: 'Evidence 1', url: 'evidence1', name: 'evidence1Name' },
  { label: 'Evidence 2', url: 'evidence2', name: 'evidence2Name' },
  { label: 'Evidence 3', url: 'evidence3', name: 'evidence3Name' },
] as const;

/** "NC-012" + slot 0 + "photo.JPG" → "NC-012.1.jpg" (characters Drive can't use become "_"). */
function evidenceFileName(ncId: string, slotIndex: number, original: string): string {
  const ext  = original.includes('.') ? original.split('.').pop()!.toLowerCase() : '';
  const base = ncId.trim().replace(/[\\/:*?"<>|]+/g, '_');
  return `${base}.${slotIndex + 1}${ext ? `.${ext}` : ''}`;
}

/** Suggested buyers for "Audit Conducted By" — any other name can still be typed. */
const DEFAULT_BUYERS = [
  'Primark', 'H&M', 'GAP', 'Walmart', 'Target', 'Zara', 'Marks & Spencer',
  'C&A', 'Tesco', 'Next', 'Springfield', 'TMS',
];

export default function CorrectiveActionFormComponent({ data, setData, onUploadingChange }: CorrectiveActionFormProps) {
  const factory   = useFactory();
  const cfg       = useMemo(() => resolveUploadConfig(factory), [factory]);
  const canUpload = isEvidenceUploadConfigured(cfg);

  // Default buyers plus the buyers in the factory profile (duplicates like "H & M" / "H&M" removed).
  const buyerOptions = useMemo(() => {
    const fromFactory = (factory as unknown as { workerProfile?: { buyers?: string[] } }).workerProfile?.buyers ?? [];
    const seen = new Set<string>();
    return [...DEFAULT_BUYERS, ...fromFactory].map(b => b.trim()).filter(b => {
      const key = b.toLowerCase().replace(/\s+/g, '');
      if (!b || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [factory]);

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

  // "i" ball popover (folder picker)
  const [infoOpen, setInfoOpen] = useState(false);
  const attachBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!attachBoxRef.current?.contains(e.target as Node)) setInfoOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setInfoOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [infoOpen]);

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
    if (!dataRef.current.ncId.trim()) {
      setAttachError('Enter the NC ID first — attached files are named after it (e.g. NC-012.1).');
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
          const renamed  = new File([file], evidenceFileName(dataRef.current.ncId, slot, file.name), { type: file.type });
          const uploaded = await uploadEvidenceFile(cfg, renamed);
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

  // Editing the NC ID renames the shown names of uploaded files (not pasted links).
  const changeNcId = (v: string) => {
    const next = { ...data, ncId: v };
    if (v.trim()) {
      EVIDENCE_SLOTS.forEach((slot, i) => {
        if (data[slot.url] && data[slot.name]) {
          next[slot.name] = evidenceFileName(v, i, data[slot.name]);
        }
      });
    }
    setData(next);
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
          <input
            list="cap-buyer-list"
            value={data.auditConductedBy}
            onChange={e => set('auditConductedBy', e.target.value)}
            placeholder="Select a buyer or type"
            autoComplete="off"
            style={inputStyle}
          />
          <datalist id="cap-buyer-list">
            {buyerOptions.map(b => <option key={b} value={b} />)}
          </datalist>
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
          <input value={data.ncId} onChange={e => changeNcId(e.target.value)} placeholder="e.g., NC-012" style={inputStyle} />
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

        {/* Row 5 — Attach box (with the "i" ball in its top-right corner) + the three evidence slots */}
        <div
          ref={attachBoxRef}
          style={{
            position: 'relative', alignSelf: 'stretch', minHeight: 74, boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, background: '#fff',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={EVIDENCE_ACCEPT}
            onChange={e => void attachFiles(e.target.files)}
            style={{ display: 'none' }}
            aria-label="Attach evidence files"
          />

          {canUpload && (
            <button
              type="button"
              className="cap-info"
              onClick={() => setInfoOpen(o => !o)}
              aria-haspopup="dialog"
              aria-expanded={infoOpen}
              aria-label="Where are files saved? (Drive folder)"
              title={getChosenFolder().name ? `Saving to “${getChosenFolder().name}” — click to change` : 'Choose the Drive folder for uploads'}
              style={{
                position: 'absolute', top: 6, right: 6, width: 22, height: 22, padding: 0, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                background: infoOpen ? '#2563eb' : '#eff6ff', color: infoOpen ? '#fff' : '#1d4ed8', border: '1px solid #93c5fd',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          )}

          {infoOpen && canUpload && (
            <div
              role="dialog"
              aria-label="Drive folder for uploads"
              style={{
                position: 'absolute', top: 32, left: 0, zIndex: 30, width: 340, maxWidth: 'calc(100cqw - 28px)',
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, textAlign: 'left',
                boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)',
              }}
            >
              <FolderPicker cfg={cfg} onVerified={input => { verifiedFolder.current = input; }} />
            </div>
          )}

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
                value={url ? (name || 'Linked file') : ''}
                readOnly
                onPaste={e => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text').trim();
                  if (text) setEvidence(i, text, '');
                }}
                placeholder="Paste a link"
                aria-label={`${slot.label} link`}
                style={{ ...inputStyle, cursor: url ? 'default' : 'text' }}
              />
              {url && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6, minWidth: 0 }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
                    <EvidenceThumb url={url} name={name} maxWidth={150} center />
                  </div>
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

      </div>
    </div>
  );
}