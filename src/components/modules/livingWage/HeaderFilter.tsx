// Column-header funnel: searchable checklist with Select all / Deselect all.
// Empty selection = no filter. NONE_VALUE = "everything deselected" (matches no row).
import { useEffect, useRef, useState } from 'react';
import { font, inputStyle, mini } from './ui';

export const NONE_VALUE = '__none__';

interface Props {
  label: string;
  selected: string[];
  getOptions: () => string[];
  onChange: (selected: string[]) => void;
}

export default function HeaderFilter({ label, selected, getOptions, onChange }: Props) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey); window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', close); };
  }, [open]);

  const active    = selected.length > 0;
  const ticked    = selected.filter(x => x !== NONE_VALUE);
  const options   = open ? getOptions() : [];
  const shown     = options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()));
  const effective = active ? ticked : options;

  const toggle = (v: string) => {
    const next = effective.includes(v) ? effective.filter(x => x !== v) : [...effective, v];
    if (next.length === 0) onChange([NONE_VALUE]);
    else if (next.length === options.length) onChange([]);
    else onChange(next);
  };
  const openPop = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 248)) });
    setQuery(''); setOpen(true);
  };
  const noneTicked = active && ticked.length === 0;

  return (
    <>
      <button ref={btnRef} type="button" aria-label={`Filter ${label}`} title="Filter" onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPop(); }} style={mini(active)}>
        ⏷{active && <span style={{ fontSize: 9, marginLeft: 2 }}>{ticked.length}</span>}
      </button>
      {open && (
        <div ref={popRef} role="dialog" aria-label={`Filter ${label}`} style={{ position: 'fixed', top: pos.top, left: pos.left, width: 240, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font, boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)', textTransform: 'none' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" style={{ ...inputStyle, marginBottom: 8, fontWeight: 400 }} />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6, fontWeight: 400 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 400, cursor: 'pointer' }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />{o}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <span style={{ display: 'inline-flex', gap: 10 }}>
              <button type="button" disabled={!active} onClick={() => onChange([])} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: active ? '#2563eb' : '#cbd5e1', cursor: active ? 'pointer' : 'default' }}>Select all</button>
              <button type="button" disabled={noneTicked} onClick={() => onChange([NONE_VALUE])} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: noneTicked ? '#cbd5e1' : '#b91c1c', cursor: noneTicked ? 'default' : 'pointer' }}>Deselect all</button>
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}