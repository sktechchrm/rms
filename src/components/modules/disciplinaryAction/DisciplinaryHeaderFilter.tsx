// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryHeaderFilter.tsx — NEW. The column-header control of the Disciplinary Statement, laid out like the
// Corrective Action Statement: ONE ▾ button in the header, and the popover holds the sort row (A→Z / Z→A / Off),
// a tri-state "Select all" checkbox, the searchable value list and Done.
// The popover is drawn into document.body (a portal), so the sticky header and scroll area never clip it.
// "Nothing ticked" is stored as a marker value, so every row is hidden until something is ticked again.
// Path: src/components/modules/disciplinaryAction/DisciplinaryHeaderFilter.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { font, inputStyle } from '../livingWage/ui';

const POP_W = 240;
/** Stored in the selection when nothing is ticked: matches no value, so no row shows. */
export const NONE_MARK = '__none__';

export interface DisciplinaryHeaderFilterProps {
  label: string;
  selected: string[];
  getOptions: () => string[];
  onChange: (selected: string[]) => void;
  /** Only for sortable columns: current direction (null = off) and how to change it. */
  sort?: { active: 'asc' | 'desc' | null; onSort: (dir: 'asc' | 'desc' | null) => void };
}

export default function DisciplinaryHeaderFilter({ label, selected, getOptions, onChange, sort }: DisciplinaryHeaderFilterProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); btnRef.current?.focus(); } };
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const active  = selected.length > 0;
  const lit     = active || Boolean(sort?.active);
  const options = open ? getOptions() : [];
  const shown   = options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()));
  const picked  = selected.filter(x => x !== NONE_MARK);
  const effective = active ? picked : options;        // nothing selected = everything ticked

  const toggle = (v: string) => {
    const next = effective.includes(v) ? effective.filter(x => x !== v) : [...effective, v];
    if (next.length === 0) onChange([NONE_MARK]);                           // all unticked → show nothing
    else onChange(next.length === options.length ? [] : next);             // all ticked → no filter
  };

  const checkedAll  = options.length > 0 && options.every(o => effective.includes(o));
  const someChecked = options.some(o => effective.includes(o));
  const toggleAll   = () => onChange(checkedAll ? [NONE_MARK] : []);

  const openPopover = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - POP_W - 8)) });
    setQuery('');
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPopover(); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        title={active ? `Filtered (${picked.length})` : `Filter ${label}`}
        style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 4px', cursor: 'pointer',
          borderRadius: 5, border: `1px solid ${lit ? '#93c5fd' : 'transparent'}`,
          background: lit ? '#dbeafe' : 'transparent', color: lit ? '#1d4ed8' : '#64748b',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1, transform: open ? 'rotate(180deg)' : 'none', transition: '.15s' }}>▾</span>
        {active && <span style={{ fontSize: 9, fontWeight: 700 }}>{picked.length}</span>}
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label={`Filter ${label}`}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: POP_W, zIndex: 1000, textTransform: 'none',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font,
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)',
          }}
        >
          {sort && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {([['asc', 'A → Z'], ['desc', 'Z → A'], [null, 'Off']] as const).map(([dir, text]) => {
                const on = sort.active === dir;
                return (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sort.onSort(dir)}
                    aria-pressed={on}
                    style={{
                      flex: 1, padding: '4px 0', fontSize: 12, fontWeight: 600, fontFamily: font, borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${on ? '#93c5fd' : '#e2e8f0'}`, background: on ? '#dbeafe' : '#fff', color: on ? '#1d4ed8' : '#475569',
                    }}
                  >{text}</button>
                );
              })}
            </div>
          )}
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${label}`}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8, fontWeight: 400 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 600, color: '#1e3a5f', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={checkedAll}
              ref={el => { if (el) el.indeterminate = someChecked && !checkedAll; }}
              onChange={toggleAll}
              aria-label={`Select all ${label}`}
            />
            Select all
          </label>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6, fontWeight: 400 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 400, color: '#1e293b', cursor: 'pointer', borderRadius: 5 }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />
                <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{o}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={() => setOpen(false)}
              style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}