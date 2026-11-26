// ─────────────────────────────────────────────────────────────────────────────
// ComplianceChecklistImport.tsx — the Excel icon in the Auditing Areas card: upload a CUSTOMIZED CHECKLIST.
// Click → window: 1 download the template · 2 choose the filled file (checked and previewed) · 3 add the areas.
// The new areas (letters G, H, …) appear in Auditing Areas, the NC Ref list and the checklist viewer.
// They are kept in this browser (localStorage) — another computer needs the same upload. A–F are never changed.
// Path: src/components/modules/complianceAudit/ComplianceChecklistImport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { downloadChecklistTemplate, parseChecklistExcel } from './checklistImport';
import type { ChecklistParse } from './checklistImport';
import { loadCustomChecklist, saveCustomChecklist, freeAreaCodes, MAX_CUSTOM_AREAS, areaLabel } from './types';
import type { CustomChecklistArea } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const btn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' };
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

interface Props {
  /** The custom list changed. `removed` = labels ("G. Name") of areas that no longer exist, so the form can untick them. */
  onChanged: (removed: string[]) => void;
}

export default function ComplianceChecklistImport({ onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ChecklistParse | null>(null);
  const [custom, setCustom] = useState<CustomChecklistArea[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setCustom(loadCustomChecklist()); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy]);

  const reset = () => { setParsed(null); setFileName(''); if (fileRef.current) fileRef.current.value = ''; };
  const close = () => { if (!busy) { setOpen(false); reset(); setMessage(null); } };

  const choose = async (file: File | null) => {
    if (!file) return;
    setMessage(null); setParsed(null); setFileName(file.name); setBusy(true);
    try { setParsed(await parseChecklistExcel(file)); }
    catch (err) { setParsed({ areas: [], problems: [], fatal: err instanceof Error ? err.message : 'The file could not be read.' }); }
    finally { setBusy(false); }
  };

  // Same name as an existing custom area → replaces it (keeps its letter); otherwise the next free letter.
  const plan = (parsed?.areas ?? []).map(a => ({ ...a, existing: custom.find(c => norm(c.name) === norm(a.name)) }));
  const newCount = plan.filter(p => !p.existing).length;
  const spare = freeAreaCodes(custom.map(c => c.code)).length;
  const tooMany = newCount > spare;

  const add = () => {
    if (!parsed || !plan.length || tooMany) return;
    const used = custom.map(c => c.code);
    const free = freeAreaCodes(used);
    const next = [...custom];
    plan.forEach(p => {
      const area = { name: p.name, points: p.points };
      if (p.existing) next[next.findIndex(c => c.code === p.existing!.code)] = { ...area, code: p.existing.code };
      else next.push({ ...area, code: free.shift()! });
    });
    next.sort((a, b) => a.code.localeCompare(b.code));
    const stored = saveCustomChecklist(next);
    setCustom(next);
    onChanged([]);
    setMessage({ ok: stored, text: stored
      ? `${plan.length} ${plan.length === 1 ? 'area' : 'areas'} added to Auditing Areas.`
      : 'Added for now, but this browser would not keep it — it will be gone after a reload (private window or storage blocked).' });
    reset();
  };

  const remove = (code: string) => {
    const gone = custom.find(c => c.code === code);
    if (!gone) return;
    const next = custom.filter(c => c.code !== code);
    saveCustomChecklist(next);
    setCustom(next);
    onChanged([areaLabel(gone)]);
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
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Upload a customized checklist by Excel" title="Upload a customized checklist by Excel"
        style={{ width: 30, height: 30, padding: 0, borderRadius: '50%', flex: '0 0 30px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 18v-5M9.5 15.2 12 12.7l2.5 2.5" />
        </svg>
      </button>

      {open && (
        <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}
          style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <div role="dialog" aria-modal="true" aria-label="Upload a customized checklist by Excel"
            style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px -12px rgba(15,23,42,0.45)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <span style={{ width: 4, height: 18, background: '#0f172a', borderRadius: 2, flex: '0 0 4px', marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', fontFamily: font }}>Upload a customized checklist</div>
                <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>Adds your own areas after A–F · kept in this browser</div>
              </div>
              <button type="button" onClick={close} disabled={busy} aria-label="Close" style={{ ...btn, padding: '4px 10px', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>✕</button>
            </div>

            <div style={{ padding: '4px 16px 14px', overflowY: 'auto', fontFamily: font }}>
              {step(1, 'Download the template', (
                <>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, lineHeight: 1.5 }}>
                    One row = one Code of Conduct point: Area Name, Sub-group (optional), Code of Conduct Point, Principle No. of Standard (optional), Severity (optional).
                    Each different Area Name becomes a new area.
                  </div>
                  <button type="button" onClick={() => { void downloadChecklistTemplate(); }} style={{ ...btn, background: '#fff', border: '1px solid #2563eb', color: '#2563eb' }}>⬇ Download template (.xlsx)</button>
                </>
              ))}

              {step(2, 'Choose the filled file', (
                <>
                  <input ref={fileRef} type="file" accept=".xlsx" onChange={e => { void choose(e.target.files?.[0] ?? null); }} style={{ display: 'none' }} aria-label="Choose Excel file" />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} style={{ ...btn, background: '#fff', border: '1px dashed #93c5fd', color: '#2563eb', opacity: busy ? 0.6 : 1 }}>Choose Excel file</button>
                    <span style={{ fontSize: 12, color: '#64748b', minWidth: 0, overflowWrap: 'anywhere' }}>{busy ? 'Reading…' : fileName || 'No file chosen'}</span>
                  </div>
                  {parsed?.fatal && <div role="alert" style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{parsed.fatal}</div>}
                  {parsed && plan.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                          <thead><tr style={{ background: '#f1f5f9' }}>{['Area', 'Points', 'Result'].map(h => <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 700 }}>{h}</th>)}</tr></thead>
                          <tbody>
                            {plan.map(p => (
                              <tr key={p.name} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '4px 8px', overflowWrap: 'anywhere' }}>{p.name}</td>
                                <td style={{ padding: '4px 8px' }}>{p.points.length}</td>
                                <td style={{ padding: '4px 8px', fontWeight: 600, color: p.existing ? '#b45309' : '#166534' }}>{p.existing ? `Replaces ${p.existing.code}.` : 'New area'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {tooMany && <div role="alert" style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Only {spare} more {spare === 1 ? 'area fits' : 'areas fit'} (up to {MAX_CUSTOM_AREAS} custom areas). Remove one below or use fewer Area Names.</div>}
                      {parsed.problems.length > 0 && (
                        <details style={{ marginTop: 6, fontSize: 12, color: '#92400e' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{parsed.problems.length} note{parsed.problems.length === 1 ? '' : 's'}</summary>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18, maxHeight: 120, overflow: 'auto' }}>{parsed.problems.map((t, i) => <li key={i}>{t}</li>)}</ul>
                        </details>
                      )}
                    </div>
                  )}
                </>
              ))}

              {step(3, 'Add to Auditing Areas', (
                <>
                  <button type="button" onClick={add} disabled={busy || !plan.length || tooMany}
                    style={{ ...btn, background: '#0f172a', border: '1px solid #0f172a', color: '#fff', opacity: busy || !plan.length || tooMany ? 0.5 : 1, cursor: busy || !plan.length || tooMany ? 'not-allowed' : 'pointer' }}>
                    {plan.length ? `Add ${plan.length} ${plan.length === 1 ? 'area' : 'areas'}` : 'Add'}
                  </button>
                  {message && <div role="status" style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: message.ok ? '#166534' : '#b45309' }}>{message.text}</div>}
                </>
              ))}

              {custom.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Your custom areas</div>
                  {custom.map(c => (
                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}><b>{c.code}.</b> {c.name} <span style={{ color: '#64748b' }}>· {c.points.length} points</span></span>
                      <button type="button" onClick={() => remove(c.code)} style={{ ...btn, padding: '3px 10px', fontSize: 12, background: '#fff', border: '1px solid #fca5a5', color: '#b91c1c' }}>Remove</button>
                    </div>
                  ))}
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Removing an area does not change audits already saved — their NC Refs keep their text.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}