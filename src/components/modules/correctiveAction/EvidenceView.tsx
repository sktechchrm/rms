// ─────────────────────────────────────────────────────────────────────────────
// EvidenceView.tsx — one shared way to SHOW an evidence file (form, Statement, Print View).
// The image is requested from Drive at 1050 × 1500 px (300 DPI for 3.5 × 5 in) and fitted
// inside a box whose shape comes from `ratio` (default 7 / 10; the Print View uses 4 / 3
// for a shorter box). Click a preview to enlarge it; the file name is a real link to the
// file. The link address is never printed as text — only the file name.
// In print mode the preview and name are centred in their cell.
// Path: src/components/modules/correctiveAction/EvidenceView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

const font = "'Noto Sans Bengali', Arial, sans-serif";

function driveFileId(url: string): string {
  const m = /\/d\/([a-zA-Z0-9_-]+)/.exec(url) || /[?&]id=([a-zA-Z0-9_-]+)/.exec(url);
  return m ? m[1] : '';
}

/** Drive thumbnail at 1050 × 1500 px. */
function driveThumbUrl(url: string): string {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1050-h1500` : '';
}

function badgeText(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'IMG';
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx'].includes(ext)) return 'DOC';
  if (['xls', 'xlsx'].includes(ext)) return 'XLS';
  return 'FILE';
}

interface EvidenceThumbProps {
  url: unknown;
  name?: unknown;
  /** Max display width in px. */
  maxWidth?: number;
  /** Box shape, width / height. Default 7 / 10 (tall); use 4 / 3 for a shorter box. */
  ratio?: string;
  /** Print mode: no enlarge button, name wraps and stays a link, content centred. */
  print?: boolean;
    /** Centre the preview and name in their container (print mode always centres). */
  center?: boolean;
}

export function EvidenceThumb({ url, name, maxWidth = 170, ratio = '7 / 10', print = false, center = false }: EvidenceThumbProps) {
  const href  = String(url ?? '');
  const label = String(name ?? '') || 'Linked file';
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom]     = useState(false);
  const centered = print || center;
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  if (!href) return <span>—</span>;

  const src    = driveThumbUrl(href);
  const hasImg = Boolean(src) && !failed;

  const face = (
    <span
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', aspectRatio: ratio, boxSizing: 'border-box',
        border: '1px solid #94a3b8', borderRadius: 4, overflow: 'hidden',
        background: '#f8fafc', color: '#475569', fontSize: 14, fontWeight: 700, fontFamily: font,
      }}
    >
      {hasImg ? (
        <img
          src={src}
          alt={label}
          width={1050}
          height={1500}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      ) : badgeText(String(name ?? ''))}
    </span>
  );

  const link: React.CSSProperties = {
    fontSize: print ? 9 : 11.5, fontFamily: font, lineHeight: 1.3, wordBreak: 'break-word', overflowWrap: 'anywhere',
    color: print ? '#000' : '#2563eb', textDecoration: print ? 'none' : 'underline',
  };

  return (
    <div
      style={{
        width: '100%', maxWidth, display: 'flex', flexDirection: 'column', gap: 4,
        textAlign: centered ? 'center' : 'left',
        margin: centered ? '0 auto' : undefined,
      }}
    >
      {print || !hasImg ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label}`} style={{ display: 'block' }}>{face}</a>
      ) : (
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label={`Enlarge ${label}`}
          title="Click to enlarge"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'zoom-in', display: 'block', width: '100%' }}
        >{face}</button>
      )}

      <a href={href} target="_blank" rel="noopener noreferrer" title="Open file" style={link}>
        {label}{print ? '' : ' ↗'}
      </a>

      {zoom && !print && (
        <div
          role="dialog"
          aria-label={label}
          onClick={() => setZoom(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16,
          }}
        >
          <img
            src={src}
            alt={label}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 'min(1050px, 94vw)', maxHeight: '82vh', objectFit: 'contain', background: '#fff', borderRadius: 6 }}
          />
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 10, alignItems: 'center', fontFamily: font }}>
            <a
              href={href} target="_blank" rel="noopener noreferrer"
              style={{ background: '#2563eb', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >Open file ↗</a>
            <button
              type="button" onClick={() => setZoom(false)}
              style={{ background: '#fff', color: '#1e293b', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}