// Round "i" button that opens a small message popover (replaces the blue message boxes).
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const font = "'Noto Sans Bengali', Arial, sans-serif";

export default function InfoBall({ title = 'Information', children, width = 340 }: { title?: string; children: ReactNode; width?: number }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close); window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef} type="button" onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-label={title} title={title}
        style={{
          width: 22, height: 22, padding: 0, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, background: open ? '#2563eb' : '#eff6ff', color: open ? '#fff' : '#1d4ed8', border: '1px solid #93c5fd',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      {open && (
        <div
          ref={popRef} role="dialog" aria-label={title}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width, maxWidth: 'calc(100vw - 16px)', zIndex: 1000, background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, fontFamily: font, fontSize: 12.5, lineHeight: 1.55, color: '#1e293b',
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)', fontWeight: 400, textTransform: 'none',
          }}
        >
          <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>{title}</div>
          {children}
        </div>
      )}
    </>
  );
}