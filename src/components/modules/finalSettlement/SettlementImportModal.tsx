// ─────────────────────────────────────────────────────────────────────────────
// SettlementImportModal.tsx — "Excel দিয়ে তথ্য আপলোড": 1 Download template · 2 Choose file (+ preview) · 3 Import.
// Path: src/components/modules/finalSettlement/SettlementImportModal.tsx
// Choosing a file reads it at once and shows what will be imported (Ready / needs review per row).
// Importing never saves — the parent puts the rows into the multi-employee form.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { font } from '../livingWage/ui';
import { parseSettlementWorkbook } from './settlementImport';
import type { ImportResult } from './settlementImport';
import { formatDMY } from './settlementModel';

interface Props {
  open: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  /** Used for rows whose Settlement Date cell is empty. */
  defaultDate: string;
  onImport: (result: ImportResult) => void;
}

const stepNo: CSSProperties = { width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: font };
const stepTitle: CSSProperties = { fontWeight: 800, fontSize: 13.5, color: '#0f172a', fontFamily: font };
const hint: CSSProperties = { fontSize: 12, color: '#64748b', fontFamily: font, lineHeight: 1.55, margin: '4px 0 10px' };
const pth: CSSProperties = { padding: '6px 10px', fontSize: 11.5, fontWeight: 700, color: '#334155', textAlign: 'left', background: '#f1f5f9', fontFamily: font, position: 'sticky', top: 0 };
const ptd: CSSProperties = { padding: '5px 10px', fontSize: 12, color: '#1e293b', fontFamily: font, borderTop: '1px solid #eef2f7', verticalAlign: 'top' };

function Step({ n, title, last, children }: { n: number; title: string; last?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: last ? undefined : '1px solid #e2e8f0' }}>
      <span style={stepNo}>{n}</span>
      <div style={{ minWidth: 0, flex: 1 }}><div style={stepTitle}>{title}</div>{children}</div>
    </div>
  );
}

/** The body only exists while the modal is open, so its state starts fresh every time (no reset effect needed). */
export default function SettlementImportModal(props: Props) {
  return props.open ? <ImportDialog {...props} /> : null;
}

function ImportDialog({ onClose, onDownloadTemplate, defaultDate, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const pick = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const choose = async (f: File | null) => {
    setFile(f); setResult(null); setError('');
    if (!f) return;
    setReading(true);
    try { setResult(parseSettlementWorkbook(await f.arrayBuffer(), defaultDate)); }
    catch (e) { setError(e instanceof Error ? e.message : 'ফাইলটি পড়া যায়নি।'); }
    setReading(false);
  };

  const ready = result?.preview.filter(r => r.status === 'ready').length ?? 0;
  const review = result ? result.preview.length - ready : 0;

  return createPortal(
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label="Upload data by Excel" style={{ width: 'min(620px, 100%)', maxHeight: '100%', overflow: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 20px 50px rgba(15,23,42,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span aria-hidden="true" style={{ width: 4, borderRadius: 2, background: '#0f172a' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', fontFamily: font }}>Excel দিয়ে তথ্য আপলোড</div>
              <div style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>একসাথে অনেক কর্মী যোগ করুন — Excel-এর একটি সারি = একজন কর্মী</div>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#334155' }}>✕</button>
        </div>

        <Step n={1} title="টেমপ্লেট ডাউনলোড করুন">
          <p style={hint}>
            “Settlement Import” শিটটি পূরণ করুন। চাকরি নিষ্পত্তির ধরন (কলাম A-এর ড্রপডাউন) ও নিষ্পত্তির তারিখ গ্রুপের প্রথম সারিতেই যথেষ্ট — ফাঁকা ঘরে উপরের সারির মান ধরা হয়।
            তারিখ dd-mm-yyyy। আমদানির পর সারিগুলো ফর্মে আসবে; যাচাই করে সংরক্ষণ করুন।
          </p>
          <button type="button" onClick={onDownloadTemplate}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #2563eb', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
            ⬇ টেমপ্লেট ডাউনলোড (.xlsx)
          </button>
        </Step>

        <Step n={2} title="পূরণ করা ফাইল নির্বাচন করুন">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            <input ref={pick} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0] ?? null; e.target.value = ''; void choose(f); }} />
            <button type="button" onClick={() => pick.current?.click()}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px dashed #93c5fd', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
              Excel ফাইল নির্বাচন
            </button>
            <span style={{ fontSize: 12.5, color: file ? '#0f172a' : '#64748b', fontFamily: font, wordBreak: 'break-all' }}>{file ? file.name : 'কোনো ফাইল নির্বাচিত হয়নি'}</span>
          </div>

          {reading && <div style={{ marginTop: 10, fontSize: 12.5, color: '#64748b', fontFamily: font }}>পড়া হচ্ছে…</div>}
          {error && <div role="alert" style={{ margin: '10px 0 0', padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, fontFamily: font }}>{error}</div>}

          {result && (
            <>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {ready > 0 && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: 12, fontWeight: 700, fontFamily: font }}>{ready} ready</span>}
                {review > 0 && <span style={{ padding: '3px 10px', borderRadius: 999, background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', fontSize: 12, fontWeight: 700, fontFamily: font }}>{review} to review</span>}
              </div>
              <div style={{ marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 210, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={pth}>Row</th><th style={pth}>নাম</th><th style={pth}>নিষ্পত্তির ধরন</th><th style={pth}>সর্বশেষ উপস্থিতি</th><th style={pth}>Status</th></tr></thead>
                  <tbody>
                    {result.preview.map(r => (
                      <tr key={r.row}>
                        <td style={ptd}>{r.row}</td>
                        <td style={{ ...ptd, fontWeight: 700 }}>{r.name || '—'}{r.cardNo ? ` (${r.cardNo})` : ''}</td>
                        <td style={ptd}>{r.type || '—'}</td>
                        <td style={ptd}>{r.lastAttendance ? formatDMY(r.lastAttendance) : '—'}</td>
                        <td style={{ ...ptd, fontWeight: 700, color: r.status === 'ready' ? '#166534' : '#92400e' }} title={r.note}>
                          {r.status === 'ready' ? 'Ready' : 'Review'}{r.note && <div style={{ fontWeight: 400, fontSize: 11, color: '#92400e' }}>{r.note}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {review > 0 && <div style={{ marginTop: 6, fontSize: 11.5, color: '#92400e', fontFamily: font }}>“Review” সারিগুলোও ফর্মে আসবে — সেখানে ঠিক করে নিন।</div>}
            </>
          )}
        </Step>

        <Step n={3} title="Import" last>
          <button type="button" disabled={!result || reading} onClick={() => result && onImport(result)}
            style={{ marginTop: 8, padding: '9px 22px', borderRadius: 8, border: 'none', background: result && !reading ? '#0f172a' : '#94a3b8', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: font, cursor: result && !reading ? 'pointer' : 'not-allowed' }}>
            {result ? `${result.employees} জন কর্মী Import করুন` : 'Import'}
          </button>
        </Step>
      </div>
    </div>,
    document.body,
  );
}