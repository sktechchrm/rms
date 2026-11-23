// ─────────────────────────────────────────────────────────────────────────────
// SettlementImportModal.tsx — "Excel দিয়ে তথ্য আপলোড": 1 Download template · 2 Choose file · 3 Import.
// Path: src/components/modules/finalSettlement/SettlementImportModal.tsx
// The modal only hands the file to onImport(); parsing and the destination form are the parent's job.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { font } from '../livingWage/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  /** Resolve with an error message to show inside the modal, or null when the import worked (the parent then closes it). */
  onImport: (file: File) => Promise<string | null>;
}

const stepNo: CSSProperties = { width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontFamily: font };
const stepTitle: CSSProperties = { fontWeight: 800, fontSize: 13.5, color: '#0f172a', fontFamily: font };
const hint: CSSProperties = { fontSize: 12, color: '#64748b', fontFamily: font, lineHeight: 1.55, margin: '4px 0 10px' };

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

function ImportDialog({ onClose, onDownloadTemplate, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const run = async () => {
    if (!file || busy) return;
    setBusy(true); setError('');
    const msg = await onImport(file);
    setBusy(false);
    if (msg) setError(msg);
  };

  return createPortal(
    <div onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label="Upload data by Excel" style={{ width: 'min(560px, 100%)', maxHeight: '100%', overflow: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 20px 50px rgba(15,23,42,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span aria-hidden="true" style={{ width: 4, borderRadius: 2, background: '#0f172a' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', fontFamily: font }}>Excel দিয়ে তথ্য আপলোড</div>
              <div style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>একসাথে অনেক কর্মী যোগ করুন — Excel-এর একটি সারি = একজন কর্মী</div>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} disabled={busy}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#334155' }}>✕</button>
        </div>

        <Step n={1} title="টেমপ্লেট ডাউনলোড করুন">
          <p style={hint}>
            “{'Settlement Import'}” শিটটি পূরণ করুন। চাকরি নিষ্পত্তির ধরন ও নিষ্পত্তির তারিখ গ্রুপের প্রথম সারিতেই যথেষ্ট — ফাঁকা ঘরে উপরের সারির মান ধরা হয়।
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
              onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); e.target.value = ''; }} />
            <button type="button" onClick={() => pick.current?.click()}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px dashed #93c5fd', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 12.5, fontFamily: font, cursor: 'pointer' }}>
              Excel ফাইল নির্বাচন
            </button>
            <span style={{ fontSize: 12.5, color: file ? '#0f172a' : '#64748b', fontFamily: font, wordBreak: 'break-all' }}>{file ? file.name : 'কোনো ফাইল নির্বাচিত হয়নি'}</span>
          </div>
        </Step>

        <Step n={3} title="Import" last>
          {error && <div role="alert" style={{ margin: '8px 0', padding: '8px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, fontFamily: font }}>{error}</div>}
          <button type="button" onClick={run} disabled={!file || busy}
            style={{ marginTop: 8, padding: '9px 22px', borderRadius: 8, border: 'none', background: file && !busy ? '#0f172a' : '#94a3b8', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: font, cursor: file && !busy ? 'pointer' : 'not-allowed' }}>
            {busy ? 'পড়া হচ্ছে…' : 'Import'}
          </button>
        </Step>
      </div>
    </div>,
    document.body,
  );
}