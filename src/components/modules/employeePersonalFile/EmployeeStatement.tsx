// ─────────────────────────────────────────────────────────────────────────────
// EmployeeStatement.tsx — every saved personal file, built like the Maternity statement:
// KPI cards · search / Month-Year calendar / "+ New record" · status chips with live counts (file completeness) ·
// column funnels (Select all / Deselect all) with ▲▼ sort stacked under them · coloured row bar ·
// row actions (documents · edit · delete with inline confirm) · totals footer.
// Filters are owned by the Manager so Print, PDF and Excel follow what you see.
//
// SCREEN FIT: exactly 8 rows at a glance; the PAGE never scrolls — only the table scrolls (header + totals stay pinned).
// FILTER POPUPS: rendered in a portal on <body> with fixed positioning, so the scroll area can never clip them.
// Path: src/components/modules/employeePersonalFile/EmployeeStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { EmployeeRow, EmployeeFilters, EmpSortField, MonthBasis } from './employeeModel';
import {
  EMPTY_EMPLOYEE_FILTERS, STATUS_STYLE, filterRows, summarize, columnValue, countActiveFilters, formatDMY, money,
} from './employeeModel';
import { font, CONTROL_H, inputStyle, th, td, mini } from '../livingWage/ui';

interface Col {
  key: string; label: string; w: number;
  sub?: string;                                   // small caption under the label
  right?: boolean;                                // numeric column: right-aligned
  sort?: EmpSortField;
  field?: string;                                 // one column filter
  fields?: { label: string; field: string }[];    // several column filters in one header
}
const COLS: Col[] = [
  { key: 'sl',       label: 'SL', w: 3 },
  { key: 'cardNo',   label: 'Card No', w: 7, sort: 'cardNo', field: 'cardNo' },
  { key: 'info',     label: 'Employee Info', sub: 'Name · Designation · Section', w: 17, sort: 'name',
    fields: [{ label: 'Designation', field: 'designation' }, { label: 'Section', field: 'section' }, { label: 'Department', field: 'department' }] },
  { key: 'personal', label: 'ব্যক্তিগত তথ্য', sub: 'পিতা · জন্ম · লিঙ্গ', w: 14,
    fields: [{ label: 'Gender', field: 'gender' }, { label: 'Blood', field: 'bloodGroup' }] },
  { key: 'joining',  label: 'যোগদান', w: 9, sort: 'joining', field: 'joining' },
  { key: 'service',  label: 'চাকরির মেয়াদ', w: 9, sort: 'service', field: 'service' },
  { key: 'contact',  label: 'যোগাযোগ', sub: 'মোবাইল · জেলা', w: 15 },
  { key: 'gross',    label: 'মোট বেতন', w: 9, sort: 'gross', field: 'gross', right: true },
  { key: 'status',   label: 'ফাইলের অবস্থা', sub: 'তথ্য সম্পূর্ণতা', w: 10, sort: 'complete' },
  { key: 'actions',  label: '', w: 7 },
];

/** Below this component width the table keeps TABLE_MIN_W and scrolls sideways inside its own area. */
const NARROW_PX = 900;
const TABLE_MIN_W = 900;
/** Below this width the table switches to compact cells so every column still fits without sideways scrolling. */
const COMPACT_PX = 1250;
/** Table area never gets shorter than this (very small windows scroll the table, not the page). */
const TABLE_MIN_H = 240;
/** Space left under the table (just enough that the card's bottom border stays visible). */
const BOTTOM_GAP = 2;
/** true = the browser page itself never scrolls while this screen is open (restored on leave). */
const PREVENT_PAGE_SCROLL = true;
/** The list is sized so exactly this many rows fit on screen at a glance (the rest scroll), with the totals row always visible. */
const VISIBLE_ROWS = 8;
const ROW_MIN_H = 50;
const NAVY = '#1e3a5f';
const NONE = '\u0000none';                         // "nothing selected" marker for a column filter (empty list = no filter)

/** Header filter + sort buttons: compact, so the two sit close together in their vertical stack. */
const STACK_BTN: CSSProperties = { height: 16, minHeight: 0, lineHeight: 1, margin: 0 };
const num: CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const wrap: CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const subStyle: CSSProperties = { fontSize: 10.5, color: '#64748b', fontWeight: 400, lineHeight: 1.3 };
// Headers wrap only between words, so a Bangla word is never split.
const headBox: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, margin: 0, padding: 0 };
const headWrap: CSSProperties = { whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'normal', lineHeight: 1.4 };
const STATUS_DOT: Record<string, string> = { Complete: '#16a34a', Partial: '#2563eb', Incomplete: '#f59e0b' };

// ─── Column filter popup (portal + fixed position: never clipped by the scroll area) ─────────────────

const POP_W = 268;

function ColumnFilter({ label, selected, getOptions, onChange }: {
  label: string; selected: string[]; getOptions: () => string[]; onChange: (sel: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; maxH: number }>({ left: 8, top: 0, maxH: 360 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
    const openDown = below >= 280 || below >= above;
    const room = openDown ? below : above;
    setPos({
      left: Math.max(8, Math.min(r.right - POP_W, window.innerWidth - POP_W - 8)),
      top: openDown ? r.bottom + 6 : undefined,
      bottom: openDown ? undefined : window.innerHeight - r.top + 6,
      maxH: Math.max(190, Math.min(400, room)),
    });
  };

  // The popup position is measured in the click handler (see the button below), not in an effect —
  // so opening it never sets state from inside an effect.

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) close(); };   // the list may scroll; anything else closes
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const options = open ? getOptions() : [];
  const noneSelected = selected.includes(NONE);
  const allSelected = !noneSelected && selected.length === 0;
  const isChecked = (v: string) => (noneSelected ? false : allSelected ? true : selected.includes(v));
  const shown = q.trim() ? options.filter(o => o.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const active = noneSelected || selected.length > 0;

  const toggle = (v: string) => {
    const current = options.filter(isChecked);
    const next = isChecked(v) ? current.filter(x => x !== v) : [...current, v];
    onChange(next.length === options.length ? [] : next.length === 0 ? [NONE] : next);
  };

  const link = (enabled: boolean, color: string): CSSProperties => ({
    background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 700, fontFamily: font,
    color: enabled ? color : '#cbd5e1', cursor: enabled ? 'pointer' : 'default',
  });

  const popup = open ? (
    <div ref={popRef} role="dialog" aria-label={`Filter ${label}`}
      style={{
        position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: POP_W, maxHeight: pos.maxH, zIndex: 10000,
        display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #94a3b8', borderRadius: 0,
        padding: 12, fontFamily: font, boxSizing: 'border-box',
      }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" aria-label={`Search ${label}`}
        style={{ ...inputStyle, flex: 'none', height: 34, marginBottom: 8, boxSizing: 'border-box' }} />
      <div className="ms-scroll" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 2 }}>
        {shown.length === 0 && <div style={{ padding: '10px 4px', fontSize: 12, color: '#94a3b8' }}>No values</div>}
        {shown.map(o => (
          <label key={o} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: '#1e293b', lineHeight: 1.4 }}>
            <input type="checkbox" checked={isChecked(o)} onChange={() => toggle(o)} style={{ marginTop: 2, flex: 'none' }} />
            <span style={{ minWidth: 0, wordBreak: 'break-word' }}>{o}</span>
          </label>
        ))}
      </div>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
        <button type="button" disabled={allSelected} onClick={() => onChange([])} style={link(!allSelected, '#2563eb')}>Select all</button>
        <button type="button" disabled={noneSelected} onClick={() => onChange([NONE])} style={link(!noneSelected, '#dc2626')}>Deselect all</button>
        <button type="button" onClick={() => setOpen(false)}
          style={{ marginLeft: 'auto', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} type="button" aria-label={`Filter ${label}`} aria-expanded={open} title={`Filter by ${label}`}
        onClick={() => { setQ(''); if (!open) place(); setOpen(o => !o); }} style={{ ...mini(active), ...STACK_BTN }}>{active ? '●' : '▾'}</button>
      {popup && createPortal(popup, document.body)}
    </>
  );
}

// ─── Month-Year calendar popup (toolbar) ─────────────────────────────────────────────────────────────────

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BASIS_TABS: { key: MonthBasis; label: string }[] = [
  { key: 'joining', label: 'যোগদানের তারিখ' }, { key: 'saved', label: 'সংরক্ষণের তারিখ' },
];
const MY_W = 300;

/**
 * Calendar popup: tabs choose what the month is matched against (যোগদানের তারিখ · সংরক্ষণের তারিখ),
 * the year has ‹ › arrows (no limit; click the year to take the whole year), a Jan–Dec grid picks the month.
 */
function MonthYearPicker({ basis, year, month, onChange }: {
  basis: MonthBasis; year: string; month: string; onChange: (p: { basis?: MonthBasis; year?: string; month?: string }) => void;
}) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(now.getFullYear());
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 8, top: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const down = window.innerHeight - r.bottom - 12 >= 350 || window.innerHeight - r.bottom >= r.top;
    setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - MY_W - 8)), top: down ? r.bottom + 6 : undefined, bottom: down ? undefined : window.innerHeight - r.top + 6 });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false); };
    const onScroll = (e: Event) => { if (!popRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
  const on = Boolean(year);
  const label = !year ? 'All months / All years' : `${month ? MONTHS_EN[Number(month) - 1] + ' ' : 'Whole year '}${year}`;
  const basisLabel = BASIS_TABS.find(t => t.key === basis)?.label ?? '';
  const arrow: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#334155', padding: '2px 10px', fontFamily: font };
  const link = (enabled: boolean): CSSProperties => ({ background: 'none', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 700, fontFamily: font, color: enabled ? '#2563eb' : '#cbd5e1', cursor: enabled ? 'pointer' : 'default' });

  const popup = open ? (
    <div ref={popRef} role="dialog" aria-label="Month-Year filter"
      style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: MY_W, zIndex: 10000, background: '#fff', border: '1px solid #94a3b8', padding: 12, fontFamily: font, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, gap: 3, marginBottom: 12 }}>
        {BASIS_TABS.map(t => (
          <button key={t.key} type="button" onClick={() => onChange({ basis: t.key })} aria-pressed={basis === t.key}
            style={{ flex: 1, border: 'none', padding: '7px 2px', fontSize: 12, fontWeight: 700, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap', background: basis === t.key ? NAVY : 'transparent', color: basis === t.key ? '#fff' : '#475569' }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" aria-label="Previous year" onClick={() => setView(y => y - 1)} style={arrow}>‹</button>
        <button type="button" title="Whole year" onClick={() => { onChange({ year: String(view), month: '' }); setOpen(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800, fontFamily: font, color: year === String(view) && !month ? '#2563eb' : '#0f172a', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{view}</button>
        <button type="button" aria-label="Next year" onClick={() => setView(y => y + 1)} style={arrow}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {MONTHS_EN.map((m, k) => {
          const mm = String(k + 1).padStart(2, '0'), sel = year === String(view) && month === mm, cur = view === now.getFullYear() && mm === nowMonth;
          return (
            <button key={m} type="button" aria-pressed={sel} onClick={() => { onChange({ year: String(view), month: mm }); setOpen(false); }}
              style={{ padding: '10px 0', fontSize: 12.5, fontFamily: font, cursor: 'pointer', border: `1px solid ${sel ? NAVY : cur ? '#93c5fd' : '#e2e8f0'}`, background: sel ? NAVY : '#fff', color: sel ? '#fff' : '#334155', fontWeight: sel ? 700 : 500 }}>{m}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
        <button type="button" disabled={!on} onClick={() => { onChange({ year: '', month: '' }); setOpen(false); }} style={link(on)}>Clear</button>
        <button type="button" onClick={() => { onChange({ year: String(now.getFullYear()), month: nowMonth }); setOpen(false); }} style={link(true)}>This month</button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} type="button" aria-expanded={open} aria-label="Month-Year filter"
        onClick={() => { if (!open) { place(); setView(year ? Number(year) : now.getFullYear()); } setOpen(o => !o); }}
        style={{ ...inputStyle, minWidth: 230, height: CONTROL_H, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: on ? '#eff6ff' : '#fff', borderColor: on ? '#93c5fd' : '#cbd5e1' }}>
        <span>{label}{on ? ` · ${basisLabel}` : ''}</span><span aria-hidden="true" style={{ color: '#64748b' }}>▾</span>
      </button>
      {popup && createPortal(popup, document.body)}
    </>
  );
}

/** Inclusive number of days between two ISO dates (start and end both counted). */
const leaveDays = (from: string, to: string): number => {
  const a = Date.parse(`${from}T00:00:00Z`), b = Date.parse(`${to}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) + 1 : 0;
};

// ─── Statement ───────────────────────────────────────────────────────────────

/**
 * Locks every scrollable ancestor — the browser page AND the module shell's content area — at the top,
 * so no second (right-side) scrollbar runs the full height of the screen. Returns the function that restores them.
 */
function lockScrollParents(start: HTMLElement | null): () => void {
  if (!PREVENT_PAGE_SCROLL) return () => {};
  const saved: { el: HTMLElement; y: string; top: number }[] = [];
  let el: HTMLElement | null = start?.parentElement ?? null;
  while (el && el !== document.documentElement) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') {
      saved.push({ el, y: el.style.overflowY, top: el.scrollTop });
      el.scrollTop = 0;
      el.style.overflowY = 'hidden';
    }
    el = el.parentElement;
  }
  return () => saved.forEach(s => { s.el.style.overflowY = s.y; s.el.scrollTop = s.top; });
}

/**
 * The lowest y-position (in window coordinates) that is really visible for the table: the bottom of the browser window,
 * or the bottom of the nearest ancestor that clips its content (the module shell's content area), whichever is higher.
 * Using only window.innerHeight let the table run under the shell's edge and hide the totals row.
 */
function visibleBottom(start: HTMLElement | null): number {
  let bottom = window.visualViewport?.height ?? window.innerHeight;
  let el: HTMLElement | null = start?.parentElement ?? null;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    if (['hidden', 'clip', 'auto', 'scroll', 'overlay'].includes(cs.overflowY)) {
      bottom = Math.min(bottom, el.getBoundingClientRect().bottom - (parseFloat(cs.paddingBottom) || 0));
    }
    el = el.parentElement;
  }
  return bottom;
}

interface Props {
  rows: EmployeeRow[];
  filters: EmployeeFilters;
  onFiltersChange: (f: EmployeeFilters) => void;
  onEdit: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function EmployeeStatement({ rows, filters, onFiltersChange, onEdit, onOpen, onDelete, onAdd }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [viewH, setViewH]         = useState(520);
  const [narrow, setNarrow]       = useState(false);
  const [compact, setCompact]     = useState(false);
  const [headH, setHeadH]         = useState(64);
  const [footH, setFootH]         = useState(44);
  const rootRef   = useRef<HTMLDivElement>(null);
  const topRef    = useRef<HTMLDivElement>(null);      // KPI cards + filter bar (its height changes when filters wrap)
  const scrollRef = useRef<HTMLDivElement>(null);      // the table's own scroll area
  const theadRef  = useRef<HTMLTableSectionElement>(null);
  const tfootRef  = useRef<HTMLTableSectionElement>(null);
  const setFilter = (p: Partial<EmployeeFilters>) => onFiltersChange({ ...filters, ...p });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const statusCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, status: [] });
    const c: Record<string, number> = { Complete: 0, Partial: 0, Incomplete: 0 };
    base.forEach(r => { c[r.status]++; });
    return { total: base.length, c };
  }, [rows, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    const values = Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field))));
    // Dates list oldest → newest, amounts smallest → largest, everything else alphabetically (numbers inside text compared as numbers).
    const dmy = (v: string) => v.split('-').reverse().join('-');
    const amount = (v: string) => parseFloat(v.replace(/,/g, '')) || 0;
    if (field === 'joining') return values.sort((a, b) => dmy(a).localeCompare(dmy(b)));
    if (field === 'gross') return values.sort((a, b) => amount(a) - amount(b));
    return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: EmpSortField) => {
    const cur = filters.sort;
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

  // Fit the screen: table height = window bottom − table top. Re-measured on resize and whenever the top block changes height.
  useLayoutEffect(() => {
    const unlock = lockScrollParents(rootRef.current);      // first: reset + lock outer scrollers, so the measurement below is the final position
    const measure = () => {
      const el = scrollRef.current;
      if (el) setViewH(Math.max(TABLE_MIN_H, Math.floor(visibleBottom(rootRef.current) - el.getBoundingClientRect().top - BOTTOM_GAP)));
      const w = rootRef.current?.clientWidth ?? COMPACT_PX;
      setNarrow(w < NARROW_PX);
      if (theadRef.current) setHeadH(theadRef.current.offsetHeight);
      if (tfootRef.current) setFootH(tfootRef.current.offsetHeight);
      setCompact(w < COMPACT_PX);
    };
    measure();
    const raf = requestAnimationFrame(measure);           // once more after fonts / child layout settle
    const late = window.setTimeout(measure, 300);          // and after web fonts / the module shell have finished loading
    void document.fonts?.ready.then(measure);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) { if (rootRef.current) ro.observe(rootRef.current); if (topRef.current) ro.observe(topRef.current); }
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(late); ro?.disconnect(); window.removeEventListener('resize', measure); unlock(); };
  }, []);

  // No page scroll while the Statement is open (only the table scrolls).
  useEffect(() => {
    if (!PREVENT_PAGE_SCROLL) return;
    const html = document.documentElement, body = document.body;
    const prev = { h: html.style.overflow, b: body.style.overflow };
    window.scrollTo(0, 0);
    html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
    return () => { html.style.overflow = prev.h; body.style.overflow = prev.b; };
  }, []);

  const active = countActiveFilters(filters);
  // Row height: the visible table area (minus header and totals row) is split into VISIBLE_ROWS equal rows.
  const rowH = Math.max(ROW_MIN_H, Math.floor((viewH - headH - footH) / VISIBLE_ROWS));
  // Taller header: text wraps onto several lines instead of overlapping the next column.
  const thTall: CSSProperties = { ...th, whiteSpace: 'normal', height: 'auto', minHeight: 64, paddingTop: 12, paddingBottom: 12, verticalAlign: 'top', textAlign: 'left', lineHeight: 1.4 };
  // The header sticks to the top of the table's own scroll area, so it never moves while the rows scroll.
  const thS: CSSProperties = { ...thTall, position: 'sticky', top: 0, zIndex: 3, background: '#f1f5f9', borderBottom: `2px solid ${NAVY}`, color: NAVY, fontSize: 11.5, fontWeight: 700 };
  const lbl: CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 };
  const chip = (on: boolean, fg: string, bg: string): CSSProperties => ({
    padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
    border: `1px solid ${on ? fg : '#e2e8f0'}`, background: on ? bg : '#fff', color: on ? fg : '#475569',
  });
  const kpi = (label: string, value: string, color = NAVY) => (
    <div style={{ background: '#fff', border: '1px solid #b4c0d0', borderRadius: 0, padding: '7px 12px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: font, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
  const toggleStatus = (v: string) => setFilter({ status: filters.status.includes(v) ? filters.status.filter(x => x !== v) : [...filters.status, v] });

  const headCell = (c: Col) => {
    const caption = (
      <span style={{ ...headWrap, textAlign: c.right ? 'right' : 'left' }} title={c.label}>
        {c.label}
        {c.sub && <span style={{ display: 'block', fontSize: 9.5, fontWeight: 400, color: '#64748b' }}>{c.sub}</span>}
      </span>
    );
    if (!c.sort && !c.field && !c.fields) return <div style={{ ...headBox, justifyContent: c.right ? 'flex-end' : 'space-between' }}>{caption}</div>;
    const sorted = c.sort && filters.sort.field === c.sort;
    // Several values in ONE filter ("Designation: X", "Section: Y" …).
    const group = c.fields;
    const tag = (label: string) => `${label}: `;
    const groupOptions = () => (group ?? []).flatMap(f => columnOptions(f.field).map(v => tag(f.label) + v));
    const groupSelected = (group ?? []).flatMap(f => (filters.columns?.[f.field] ?? []).map(v => (v === NONE ? NONE : tag(f.label) + v)));
    const groupChange = (sel: string[]) => {
      const cols = { ...(filters.columns ?? {}) };
      if (sel.includes(NONE)) (group ?? []).forEach(f => { cols[f.field] = [NONE]; });
      else (group ?? []).forEach(f => { cols[f.field] = sel.filter(x => x.startsWith(tag(f.label))).map(x => x.slice(tag(f.label).length)); });
      setFilter({ columns: cols });
    };
    // Same flow in every header: caption on the left, a vertical button stack on the right —
    // the filter funnel always on TOP, the ascending / descending sort always BELOW it.
    return (
      <div style={headBox}>
        {caption}
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0, flex: 'none' }}>
          {c.field && <ColumnFilter label={c.label} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={sel => setColumn(c.field!, sel)} />}
          {group && <ColumnFilter label={group.map(f => f.label).join(' / ')} selected={groupSelected} getOptions={groupOptions} onChange={groupChange} />}
          {c.sort && <button type="button" aria-label={`Sort ${c.label}`} title={sorted ? (filters.sort.dir === 'asc' ? 'Ascending — click for descending' : 'Descending — click to clear') : 'Sort ascending'} onClick={() => cycleSort(c.sort!)} style={{ ...mini(Boolean(sorted)), ...STACK_BTN }}>{sorted ? (filters.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
        </span>
      </div>
    );
  };

  const iconBtn = (color: string): CSSProperties => ({ background: 'none', border: '1px solid transparent', borderRadius: 5, color, cursor: 'pointer', fontSize: 13, padding: '2px 4px', lineHeight: 1 });
  const actions = (r: EmployeeRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      <button type="button" className="ms-icon" onClick={() => onOpen(r.id)} title="নিয়োগপত্র ও ডকুমেন্ট খুলুন" aria-label={`Documents of ${r.name}`} style={iconBtn('#475569')}>🖨</button>
      <button type="button" className="ms-icon" onClick={() => onEdit(r.id)} title="সম্পাদনা" aria-label={`Edit ${r.name}`} style={iconBtn('#2563eb')}>✎</button>
      <button type="button" className="ms-icon" onClick={() => setConfirmId(r.id)} title="মুছুন" aria-label={`Delete ${r.name}`} style={iconBtn('#dc2626')}>🗑</button>
    </span>
  );

  // Footer: totals of exactly the rows on screen (SL … যোগাযোগ = 7 columns, then the salary total, then 2 columns).
  const footBase: CSSProperties = { position: 'sticky', bottom: 0, zIndex: 2, background: '#e2e8f0', borderTop: `2px solid ${NAVY}`, padding: '12px 10px', fontFamily: font, fontSize: 13.5, fontWeight: 800, color: NAVY };

  return (
    <div ref={rootRef} className={compact ? 'ms-compact' : undefined} style={{ background: '#fff', borderRadius: 0, border: '1px solid #b4c0d0', overflow: 'clip' }}>
      <style>{`
        .ms-row td { transition: background .12s; vertical-align: middle; }
        .ms-row:nth-child(even) td { background: #fafbfd; }
        .ms-row:hover td { background: #eef4ff; }
        .ms-icon:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
        /* compact cells on narrower screens: every column fits, no sideways scrolling */
        .ms-compact td { padding: 6px 5px !important; font-size: 11.5px !important; }
        .ms-compact th { padding: 8px 5px !important; font-size: 11px !important; }
        /* slim, modern scrollbars (table area and filter lists) */
        .ms-scroll { scrollbar-width: thin; scrollbar-color: #94a3b8 transparent; }
        .ms-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .ms-scroll::-webkit-scrollbar-track { background: transparent; }
        .ms-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        .ms-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; background-clip: padding-box; border: 2px solid transparent; }
        .ms-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>

      <div ref={topRef}>
        <div style={{ padding: '8px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
          {kpi('Records', String(sum.count), NAVY)}
          {kpi('মোট মাসিক বেতন', `৳ ${money(sum.totalGross)}`, '#047857')}
          {kpi('সম্পূর্ণ ফাইল', String(sum.completeCount), '#15803d')}
          {kpi('অসম্পূর্ণ ফাইল', String(sum.incompleteCount), sum.incompleteCount ? '#92400e' : '#15803d')}
          {kpi('ছবি সংযুক্ত', `${sum.photoCount} / ${sum.count}`, '#1d4ed8')}
        </div>

        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ padding: '8px 14px 4px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 230 }}>
              <label htmlFor="emp-q" style={lbl}>Search (name / card no / designation / section / mobile / NID)</label>
              <input id="emp-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
                style={{ ...inputStyle, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
            </div>
            <div>
              <span style={lbl}>Month-Year</span>
              <MonthYearPicker basis={filters.basis} year={filters.year} month={filters.month} onChange={setFilter} />
            </div>
            {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_EMPLOYEE_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
            <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New record</button>
          </div>
          <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" aria-pressed={filters.status.length === 0} onClick={() => setFilter({ status: [] })} style={chip(filters.status.length === 0, NAVY, '#e0e7ff')}>সব {statusCounts.total}</button>
            {(['Complete', 'Partial', 'Incomplete'] as const).map(s => (
              <button key={s} type="button" aria-pressed={filters.status.includes(s)} onClick={() => toggleStatus(s)} style={chip(filters.status.includes(s), STATUS_STYLE[s].color, STATUS_STYLE[s].bg)}>{STATUS_STYLE[s].label} {statusCounts.c[s]}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {rows.length} records</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="ms-scroll" style={{ overflow: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable', height: 'auto', maxHeight: viewH, minHeight: TABLE_MIN_H }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? TABLE_MIN_W : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead ref={theadRef} style={{ verticalAlign: 'top' }}><tr style={{ verticalAlign: 'top' }}>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 40, fontWeight: 600 }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>🗂</div>
                {rows.length === 0 ? 'এখনো কোনো রেকর্ড সংরক্ষণ করা হয়নি — “+ New record” চাপুন।' : 'বর্তমান ফিল্টারে কোনো রেকর্ড মেলেনি'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const st = STATUS_STYLE[r.status];
              return (
                <tr key={r.id || i} className="ms-row" style={{ height: rowH }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#64748b', borderLeft: `3px solid ${STATUS_DOT[r.status]}` }}>{i + 1}</td>
                  <td style={{ ...td, ...wrap }}>{r.cardNo || '—'}</td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>{r.designation || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{[r.section, r.department].filter(Boolean).join(' · ') || '—'}</div>
                  </td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ lineHeight: 1.35 }}>{r.father || '—'}</div>
                    <div style={subStyle}>{r.dob ? `${formatDMY(r.dob)}${r.age ? ` (${r.age})` : ''}` : '—'}</div>
                    <div style={subStyle}>{[r.gender, r.bloodGroup].filter(Boolean).join(' · ') || '—'}</div>
                  </td>
                  <td style={td}><div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDMY(r.joining) || '—'}</div>{r.grade && <div style={subStyle}>গ্রেড {r.grade}</div>}</td>
                  <td style={{ ...td, ...wrap }}>{r.service || '—'}</td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ whiteSpace: 'nowrap' }}>{r.mobile || '—'}</div>
                    <div style={subStyle}>{r.presentDistrict || r.permanentDistrict || '—'}</div>
                  </td>
                  <td style={{ ...td, ...num, fontWeight: 700 }}>{r.gross ? money(r.gross) : '—'}</td>
                  <td style={td} title={r.missing.length ? `বাকি: ${r.missing.join(', ')}` : 'সব তথ্য আছে'}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[r.status] }} />{st.label}
                    </span>
                    <div style={{ height: 4, background: '#e2e8f0', marginTop: 5 }}><div style={{ width: `${r.pct}%`, height: '100%', background: STATUS_DOT[r.status] }} /></div>
                    <div style={subStyle}>{r.filled}/{r.total} · {r.hasPhoto ? 'ছবি আছে' : 'ছবি নেই'}</div>
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>{actions(r)}</td>
                </tr>
              );
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot ref={tfootRef}>
              <tr>
                <td colSpan={7} style={{ ...footBase, textAlign: 'right' }}>মোট ({filtered.length} জন)</td>
                <td style={{ ...footBase, ...num, fontSize: 14.5, color: '#047857' }}>{money(sum.totalGross)}</td>
                <td colSpan={2} style={{ ...footBase, fontSize: 12.5, color: sum.incompleteCount > 0 ? '#92400e' : '#15803d' }}>{sum.incompleteCount > 0 ? `অসম্পূর্ণ ${sum.incompleteCount}` : 'সব সম্পূর্ণ'}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
