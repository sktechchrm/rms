// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionForm.tsx — two parts:
//
//   PART 1 · Audit (entered ONCE per buyer audit)
//     Audited by · Audit Date · Audit duration (Audit Date + 0 … 5 days) · Audit period (calculated)
//   PART 2 · Non-compliance (one NC entry — repeat for each NC of the same audit)
//     NC ID · NC Reference · NC Description · Root Cause · Corrective Action Plan · Target date · CAP Status ·
//     NC Category · Responsible person(s) · Evidence files
//
// The header (Part 1) is kept when the NC entry is saved, so the next NC of the same audit does not need it again.
//
// EVIDENCE FILES — NOTHING IS SENT TO DRIVE FROM THIS FORM:
//   • "Attach file" only keeps the chosen file in the browser (`pending`, owned by the Manager) and shows a preview.
//     It is uploaded to Drive ONLY when Save is clicked, named <NC ID>.1.<ext>, .2, .3.
//   • ✕ on a NOT-yet-saved file just drops it.
//   • ✕ on an already-saved (uploaded) file clears the slot and tells the Manager (`onSavedFileRemoved`) — the
//     Manager deletes that file from Drive on Update. Cancel / Reset leaves Drive untouched.
//   • Pasted links are only cleared — the app never deletes files it didn't upload.
// DRIVE FOLDER: chosen from the "i" ball in the Attach box (empty = server default).
//
// NOTE: this file exports only components (Fast Refresh). Shared helpers live in evidenceUpload.ts.
// Path: src/components/modules/correctiveAction/CorrectiveActionForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useMemo, useEffect } from 'react';
import type { CorrectiveActionFormProps } from './types';
import { CAP_STATUS_OPTIONS, CAP_STATE_STYLE, getCapState, formatDMY, addDaysIso, AUDIT_DURATION_OPTIONS } from './types';
import {
  EVIDENCE_ACCEPT, MAX_EVIDENCE_MB, isEvidenceUploadConfigured, validateEvidenceFile,
  checkEvidenceFolder, getChosenFolder, setChosenFolder, resolveUploadConfig,
  folderErrorText, evidenceFileName,
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
const readOnlyBox: React.CSSProperties = { ...inputStyle, background: '#f1f5f9', color: '#334155', fontWeight: 600 };
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
  .cap-part { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
  .cap-part-head { display: flex; align-items: center; gap: 10px; padding: 9px 14px; background: linear-gradient(180deg,#f8fafc,#eef2f7); border-bottom: 1px solid #e2e8f0; }
  .cap-part-body { padding: 14px; }
  @container (max-width: 760px) {
    .cap-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cap-grid > .s3, .cap-grid > .s4 { grid-column: span 2; }
  }
  @container (max-width: 480px) {
    .cap-grid { grid-template-columns: minmax(0, 1fr); }
    .cap-grid > .s2, .cap-grid > .s3, .cap-grid > .s4 { grid-column: span 1; }
  }
  .cap-ev { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; align-items: start; }
  .cap-form input, .cap-form select, .cap-form textarea { max-width: 100%; min-width: 0; }
  .cap-form input:focus, .cap-form select:focus, .cap-form textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  .cap-form img { max-width: 100%; height: auto; }
  @container (max-width: 760px) { .cap-ev { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cap-part-body { padding: 12px; } }
  @container (max-width: 480px) {
    .cap-ev { grid-template-columns: minmax(0, 1fr); }
    .cap-part-body { padding: 10px; }
    .cap-part-head { padding: 8px 10px; }
    .cap-form input, .cap-form select, .cap-form textarea { font-size: 16px; }   /* no zoom-on-focus on phones */
  }
  .cap-info:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

const durationLabel = (n: number) => (n === 0 ? 'Same day (0 extra days)' : `+${n} ${n === 1 ? 'day' : 'days'}`);

// ─── DateFieldDMY: typed or picked, always DISPLAYS DD-MM-YYYY ────────────────
// Exported: CorrectiveActionStatement.tsx and the Risk Assessment module reuse it.

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
  // Done during render (not in an effect) so React does not need an extra render pass.
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

// ─── Drive folder picker ─────────────────────────────────────────────────────

const NO_FOLDER_PICKER = 'The server has no default folder yet. Paste a Drive folder link above and click Use folder (or ask the administrator to set EVIDENCE_FOLDER_ID).';

function FolderPicker({ cfg }: { cfg: UploadConfig }) {
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
      setNotice(input
        ? `Files will be saved to “${info.name}” when you click Save.`
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
          {notice || `Files will be saved to “${name}” when you click Save.`}
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

/** Suggested buyers for "Audited by" — any other name can still be typed. */
const DEFAULT_BUYERS = [
  'Primark', 'H&M', 'GAP', 'Walmart', 'Target', 'Zara', 'Marks & Spencer',
  'C&A', 'Tesco', 'Next', 'Springfield', 'TMS',
];

type FormProps = Omit<CorrectiveActionFormProps, 'onUploadingChange'> & {
  /** Files chosen with "Attach file" that are NOT in Drive yet (one entry per evidence slot). Owned by the Manager. */
  pending: (File | null)[];
  onPendingChange: (slotIndex: number, file: File | null) => void;
  /** An already-saved, app-uploaded file was removed with ✕ — the Manager deletes it from Drive on Update. */
  onSavedFileRemoved: (driveUrl: string) => void;
  /** Error from the Manager's Save (upload / folder / database problem). */
  saveError?: string;
  /** How many NC entries are already saved under this audit (shown in Part 2). */
  savedEntriesForAudit?: number;
};

export default function CorrectiveActionFormComponent({
  data, setData, pending, onPendingChange, onSavedFileRemoved, saveError, savedEntriesForAudit = 0,
}: FormProps) {
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

  // Audit period: Audit Date + the chosen number of days (0–5).
  const auditDays = Math.min(5, Math.max(0, Number(data.auditDays) || 0));
  const auditEnd  = data.auditDate ? addDaysIso(data.auditDate, auditDays) : '';
  const auditDaysInvalid = data.auditDate === '' && auditDays > 0;

  const fileRef = useRef<HTMLInputElement>(null);
  const [attachError, setAttachError] = useState('');

  // ✕ → "Remove?" confirmation state
  const [confirmSlot, setConfirmSlot] = useState<number | null>(null);

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

  // Local picture previews of the not-yet-saved files (released when they change).
  const previews = useMemo(
    () => pending.map(f => (f && f.type.startsWith('image/') ? URL.createObjectURL(f) : '')),
    [pending],
  );
  useEffect(() => () => { previews.forEach(u => { if (u) URL.revokeObjectURL(u); }); }, [previews]);

  const setEvidence = (index: number, url: string, name: string) => {
    const slot = EVIDENCE_SLOTS[index];
    setData({ ...data, [slot.url]: url, [slot.name]: name } as typeof data);
  };

  // ✕: a not-yet-saved file is dropped; a saved uploaded file is cleared and queued for Drive deletion
  // (done by the Manager on Update); a pasted link is only cleared.
  const removeEvidence = (i: number) => {
    setAttachError('');
    if (pending[i]) {
      onPendingChange(i, null);
    } else {
      const slot = EVIDENCE_SLOTS[i];
      const url  = data[slot.url];
      if (url && data[slot.name]) onSavedFileRemoved(url);     // has a file name = uploaded by the app
      setEvidence(i, '', '');
    }
    setConfirmSlot(null);
  };

  // Each chosen file goes into the next empty evidence slot (1, then 2, then 3).
  // Nothing is uploaded here — files are sent to Drive when Save is clicked.
  const attachFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setAttachError('');

    const taken = new Set<number>();
    const nextFree = () => EVIDENCE_SLOTS.findIndex((slot, i) => !data[slot.url] && !pending[i] && !taken.has(i));
    if (nextFree() === -1) {
      setAttachError('All three evidence slots are in use — remove one first.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const problems: string[] = [];
    for (const file of files) {
      const slot = nextFree();
      if (slot === -1) { problems.push(`No free slot left for “${file.name}”.`); continue; }
      const invalid = validateEvidenceFile(file);
      if (invalid) { problems.push(`${file.name}: ${invalid}`); continue; }
      taken.add(slot);
      onPendingChange(slot, file);
    }
    if (fileRef.current) fileRef.current.value = '';           // allow choosing the same file again
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
  const shownError = saveError || attachError;

  return (
    <div className="cap-form" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowWrap: 'anywhere', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{FORM_CSS}</style>

      {/* ══════════════ PART 1 — AUDIT (once per buyer audit) ══════════════ */}
      <section className="cap-part" aria-label="Part 1 — Audit">
        <div className="cap-part-head">
          {/* <span style={{ width: 26, height: 26, flex: '0 0 26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a5f', color: '#fff', borderRadius: '50%', fontSize: 12.5, fontWeight: 700, fontFamily: font }}>১</span> */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>Part 1 · Audit</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>Enter once for this buyer audit — all NC entries below belong to it</div>
          </div>
        </div>
        <div className="cap-part-body">
          <div className="cap-grid">
            <div style={fieldWrap}>
              <label style={labelStyle}>Audited by *</label>
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
              <label style={labelStyle}>Audit Date *</label>
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
              <label style={labelStyle}>Audit duration</label>
              <select
                value={String(auditDays)}
                onChange={e => set('auditDays', e.target.value)}
                disabled={!data.auditDate}
                aria-label="Audit duration in extra days"
                style={{ ...inputStyle, cursor: data.auditDate ? 'pointer' : 'not-allowed' }}
              >
                {AUDIT_DURATION_OPTIONS.map(n => <option key={n} value={n}>{durationLabel(n)}</option>)}
              </select>
              {auditDaysInvalid && <div style={{ marginTop: 3, fontSize: 11, color: '#64748b', fontFamily: font }}>Select the Audit Date first</div>}
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Audit period</label>
              <div style={readOnlyBox} aria-live="polite">
                {auditEnd
                  ? (auditDays === 0 ? formatDMY(data.auditDate) : `${formatDMY(data.auditDate)}  →  ${formatDMY(auditEnd)}`)
                  : '—'}
              </div>
              <div style={{ marginTop: 3, fontSize: 11, color: '#64748b', fontFamily: font }}>Calculated automatically</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ PART 2 — NON-COMPLIANCE ENTRY ══════════════ */}
      <section className="cap-part" aria-label="Part 2 — Non-compliance">
        <div className="cap-part-head">
          {/* <span style={{ width: 26, height: 26, flex: '0 0 26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a5f', color: '#fff', borderRadius: '50%', fontSize: 12.5, fontWeight: 700, fontFamily: font }}>২</span> */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>Part 2 · Non-compliance (NC)</div>
            <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>One NC per entry — repeat for each non-compliance of this audit</div>
          </div>
          {savedEntriesForAudit > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#166534', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: '2px 10px', fontFamily: font, whiteSpace: 'nowrap' }}>
              {savedEntriesForAudit} NC saved for this audit
            </span>
          )}
        </div>
        <div className="cap-part-body">
          <div className="cap-grid">

            <div style={fieldWrap}>
              <label style={labelStyle}>NC ID *</label>
              <input value={data.ncId} onChange={e => changeNcId(e.target.value)} placeholder="e.g., NC-012" style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>NC Reference</label>
              <input value={data.ncReference} onChange={e => set('ncReference', e.target.value)} placeholder="Standard clause" style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>NC Category / Keyword</label>
              <input value={data.ncCategory} onChange={e => set('ncCategory', e.target.value)} placeholder="e.g., Fire exit" style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Responsible Person(s)</label>
              <input value={data.responsiblePersons} onChange={e => set('responsiblePersons', e.target.value)} placeholder="Names, comma separated" style={inputStyle} />
            </div>

            <div className="s4" style={fieldWrap}>
              <label style={labelStyle}>NC Description *</label>
              <textarea value={data.ncDescription} onChange={e => set('ncDescription', e.target.value)} placeholder="Describe the non-conformance" style={textareaStyle(3)} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Root Cause Analysis</label>
              <textarea value={data.rootCause} onChange={e => set('rootCause', e.target.value)} placeholder="Why did it happen?" style={textareaStyle(2)} />
            </div>
            <div className="s3" style={fieldWrap}>
              <label style={labelStyle}>Corrective Action Plan (CAP)</label>
              <textarea value={data.correctiveAction} onChange={e => set('correctiveAction', e.target.value)} placeholder="Planned corrective action" style={textareaStyle(2)} />
            </div>

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

            {/* Evidence: attach box + the three slots */}
            <div className="s4 cap-ev">
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
                  onChange={e => attachFiles(e.target.files)}
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
                      position: 'absolute', top: 32, left: 0, zIndex: 30, width: 340, maxWidth: 'calc(100vw - 48px)',
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, textAlign: 'left',
                      boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)',
                    }}
                  >
                    <FolderPicker cfg={cfg} />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canUpload}
                  onClick={() => fileRef.current?.click()}
                  title={canUpload
                    ? `Attach up to three files (PNG, JPEG, JPG, PDF, Word, Excel — max ${MAX_EVIDENCE_MB} MB each). They are uploaded to Drive when you click Save.`
                    : 'File upload is not set up — this factory has no Apps Script URL / key. Paste a link in the evidence boxes instead'}
                  style={{
                    ...smallBtn, border: '1px dashed #93c5fd', background: '#fff', color: '#2563eb',
                    cursor: !canUpload ? 'not-allowed' : 'pointer', opacity: !canUpload ? 0.5 : 1,
                  }}
                >
                  Attach file
                </button>
                {!canUpload && (
                  <div style={{ fontSize: 10.5, fontFamily: font, color: '#64748b', textAlign: 'center' }}>
                    Upload not set up — paste links instead
                  </div>
                )}
                {shownError && (
                  <div role="alert" style={{ fontSize: 11, fontFamily: font, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>{shownError}</div>
                )}
              </div>

              {EVIDENCE_SLOTS.map((slot, i) => {
                const url    = data[slot.url];
                const name   = data[slot.name];
                const file   = pending[i];
                const filled = Boolean(url || file);
                return (
                  <div key={slot.url} style={fieldWrap}>
                    <label style={labelStyle}>{slot.label}</label>
                    <input
                      value={file ? file.name : url ? (name || 'Linked file') : ''}
                      readOnly
                      onPaste={e => {
                        e.preventDefault();
                        if (filled) return;                          // remove the current file/link first
                        const text = e.clipboardData.getData('text').trim();
                        if (text) setEvidence(i, text, '');
                      }}
                      placeholder="Paste a link"
                      aria-label={`${slot.label} link`}
                      style={{ ...inputStyle, cursor: filled ? 'default' : 'text' }}
                    />
                    {filled && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6, minWidth: 0 }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          {file ? (
                            <>
                              {previews[i] ? (
                                <img
                                  src={previews[i]}
                                  alt={file.name}
                                  style={{ maxWidth: 150, maxHeight: 150, objectFit: 'contain', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc' }}
                                />
                              ) : (
                                <div style={{ maxWidth: 150, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', fontSize: 11.5, fontFamily: font, color: '#475569', textAlign: 'center' }}>
                                  📄 {file.name}
                                </div>
                              )}
                              <span style={{ fontSize: 10.5, fontFamily: font, fontWeight: 600, color: '#92400e', textAlign: 'center' }}>
                                Not saved yet — uploads when you click Save
                              </span>
                            </>
                          ) : (
                            <EvidenceThumb url={url} name={name} maxWidth={150} center />
                          )}
                        </div>
                        {confirmSlot === i ? (
                          <div role="alertdialog" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 11, fontFamily: font, fontWeight: 600, color: '#b91c1c' }}>
                            <span>Remove?</span>
                            <button
                              type="button"
                              onClick={() => removeEvidence(i)}
                              style={{ ...smallBtn, padding: '3px 8px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
                            >Yes</button>
                            <button
                              type="button"
                              onClick={() => setConfirmSlot(null)}
                              style={{ ...smallBtn, padding: '3px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}
                            >No</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Remove ${slot.label}`}
                            title={file
                              ? 'Remove this file'
                              : name
                                ? 'Remove — the file is deleted from Drive when you click Update'
                                : 'Remove link'}
                            onClick={() => setConfirmSlot(i)}
                            style={{ ...smallBtn, padding: '3px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}
                          >✕</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}