// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionExcelImport.tsx — the Excel-upload button in the corner of the CAP form.
// Click → a window to UPLOAD CAP DATA BY EXCEL: 1 download the template · 2 choose the filled file (checked and
// previewed) · 3 import. Every ready row is saved as one NC record; problem / duplicate rows are listed and skipped.
// The Manager does the saving (onImport) so Drive/DB rules stay in one place.
// Path: src/components/modules/correctiveAction/CorrectiveActionExcelImport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CorrectiveActionData } from './types';
import { formatDMY } from './types';
import { downloadCapTemplate, parseCapExcel, importKey } from './capImport';
import type { ImportParse, ImportRow } from './capImport';

const font = "'Noto Sans Bengali', Arial, sans-serif";

interface Props {
  existingRecords: Record<string, unknown>[];
  /** Saves the rows (the Manager). Resolves with how many were saved. */
  onImport: (rows: CorrectiveActionData[]) => Promise<{ saved: number; failed: number }>;
}

const btn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap',
};

export default function CorrectiveActionExcelImport({ existingRecords, onImport }: Props) {
  const [open, setOpen]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed]   = useState<ImportParse | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingKeys = useMemo(() => new Set(existingRecords.map(importKey)), [existingRecords]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy]);

  const reset = () => { setParsed(null); setFileName(''); setMessage(null); if (fileRef.current) fileRef.current.value = ''; };
  const close = () => { if (!busy) { setOpen(false); reset(); } };

  const choose = async (file: File | null) => {
    if (!file) return;
    setMessage(null); setParsed(null); setFileName(file.name); setBusy(true);
    try { setParsed(await parseCapExcel(file, existingKeys)); }
    catch (err) { setParsed({ rows: [], fatal: err instanceof Error ? err.message : 'The file could not be read.' }); }
    finally { setBusy(false); }
  };

  const ready   = parsed?.rows.filter((r: ImportRow) => !r.problem) ?? [];
  const skipped = parsed?.rows.filter((r: ImportRow) => r.problem) ?? [];

  const doImport = async () => {
    if (!ready.length) return;
    setBusy(true); setMessage(null);
    try {
      const r = await onImport(ready.map((x: ImportRow) => x.data));
      setMessage(r.failed
        ? { ok: false, text: `${r.saved} saved, ${r.failed} could not be saved. Check your connection and upload again — saved NC IDs are skipped automatically.` }
        : { ok: true,  text: `${r.saved} NC ${r.saved === 1 ? 'entry' : 'entries'} imported. Open the Statement to see them.` });
      setParsed(null); setFileName(''); if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Import failed.' });
    } finally { setBusy(false); }
  };

  const step = (n: number, title: string, body: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: n > 1 ? '1px solid #f1f5f9' : 'none' }}>
      <span style={{ flex: '0 0 24px', height: 24, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', fontFamily: font, marginBottom: 6 }}>{title}</div>
        {body}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Upload data by Excel"
        title="Upload data by Excel"
        style={{
          width: 28, height: 28, padding: 0, borderRadius: '50%', flex: '0 0 28px', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac',
        }}
      >
        {/* spreadsheet sheet with an upload arrow */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M12 18v-5M9.5 15.2 12 12.7l2.5 2.5" />
        </svg>
      </button>

      {open && (
        <div
          role="presentation"
          onMouseDown={e => { if (e.target === e.currentTarget) close(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Upload CAP data by Excel"
            style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px -12px rgba(15,23,42,0.45)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ width: 4, height: 18, background: '#0f172a', borderRadius: 2, flex: '0 0 4px', alignSelf: 'flex-start', marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', fontFamily: font }}>Upload data by Excel</div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>Add many NC entries at once — one Excel row = one NC</div>
              </div>
              <button type="button" onClick={close} disabled={busy} aria-label="Close" style={{ ...btn, alignSelf: 'center', padding: '4px 10px', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>✕</button>
            </div>

            <div style={{ padding: '4px 16px 14px', overflowY: 'auto', fontFamily: font }}>
              {step(1, 'Download the template', (
                <>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>
                    Fill the “CAP Import” sheet. Audit columns are needed on the first row of an audit only; a blank cell copies the row above.
                    Dates are dd-mm-yyyy. Evidence can be pasted as links (files can be attached later with Edit).
                  </div>
                  <button type="button" onClick={() => { void downloadCapTemplate(); }} style={{ ...btn, background: '#fff', border: '1px solid #2563eb', color: '#2563eb' }}>
                    ⬇ Download template (.xlsx)
                  </button>
                </>
              ))}

              {step(2, 'Choose the filled file', (
                <>
                  <input ref={fileRef} type="file" accept=".xlsx" onChange={e => { void choose(e.target.files?.[0] ?? null); }} style={{ display: 'none' }} aria-label="Choose Excel file" />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} style={{ ...btn, background: '#fff', border: '1px dashed #93c5fd', color: '#2563eb', opacity: busy ? 0.6 : 1 }}>
                      Choose Excel file
                    </button>
                    <span style={{ fontSize: 12, color: '#64748b', minWidth: 0, overflowWrap: 'anywhere' }}>{busy && !parsed ? 'Reading…' : fileName || 'No file chosen'}</span>
                  </div>

                  {parsed?.fatal && <div role="alert" style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{parsed.fatal}</div>}

                  {parsed && parsed.rows.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>{ready.length} ready</span>
                        {skipped.length > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>{skipped.length} skipped</span>}
                      </div>
                      <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                              {['Row', 'Audited by', 'Audit', 'NC ID', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.rows.map((r: ImportRow) => (
                              <tr key={r.row} style={{ borderTop: '1px solid #f1f5f9', background: r.problem ? '#fef2f2' : undefined }}>
                                <td style={{ padding: '4px 8px' }}>{r.row}</td>
                                <td style={{ padding: '4px 8px', overflowWrap: 'anywhere' }}>{r.data.auditConductedBy || '—'}</td>
                                <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>{r.data.auditDate ? formatDMY(r.data.auditDate) : '—'}</td>
                                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{r.data.ncId || '—'}</td>
                                <td style={{ padding: '4px 8px', color: r.problem ? '#b91c1c' : '#166534', fontWeight: 600 }}>{r.problem || 'Ready'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ))}

              {step(3, 'Import', (
                <>
                  <button
                    type="button"
                    onClick={() => { void doImport(); }}
                    disabled={busy || ready.length === 0}
                    style={{ ...btn, background: '#0f172a', border: '1px solid #0f172a', color: '#fff', opacity: busy || ready.length === 0 ? 0.5 : 1, cursor: busy || ready.length === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {busy && parsed ? 'Importing…' : ready.length ? `Import ${ready.length} NC ${ready.length === 1 ? 'entry' : 'entries'}` : 'Import'}
                  </button>
                  {message && <div role="status" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: message.ok ? '#166534' : '#dc2626' }}>{message.text}</div>}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}