// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementStatement.tsx — every saved settlement: KPI cards, pinned filters, status chips,
// date range, column funnels (Select all / Deselect all), sort, row actions and a totals footer.
// Payment columns show the DUE date derived from the last attendance date:
//   বেতন (salary)                  → last attendance + 7 working days
//   অন্যান্য পাওনা (comp./benefits) → last attendance + 30 days
// Pending + due date passed → red with "N দিন বিলম্ব"; due within 3 days → amber; Paid → green tick + payment date.
// Filters are owned by FinalSettlement.tsx so Print, PDF and Excel follow what you see.
//
// SCREEN FIT: the table area is measured from its real top edge down to the bottom of the window, so the
// PAGE never scrolls — only the table scrolls (slim scrollbar, header + totals row stay pinned).
// FILTER POPUP: rendered in a portal on <body> with fixed positioning, so the table's scroll area can never
// clip it; it flips above the button when there is no room below and its option list scrolls on its own.
// Path: src/components/modules/finalSettlement/FinalSettlementStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SettlementRow, SettlementFilters, SettlementSortField } from './settlementModel';
import {
  EMPTY_SETTLEMENT_FILTERS, STATUS_COLORS, filterRows, summarize, columnValue, countActiveFilters, formatDMY, money, todayIso,
  addWorkingDays, addCalendarDays, SALARY_DUE_WORKING_DAYS, OTHER_DUE_CALENDAR_DAYS,
} from './settlementModel';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, CONTROL_H, inputStyle, th, td, mini } from '../livingWage/ui';

interface Col {
  key: string; label: string; w: number;
  sub?: string;                                   // small caption under the label
  right?: boolean;                                // numeric column: right-aligned
  sort?: SettlementSortField;
  field?: string;                                 // one column filter
  fields?: { label: string; field: string }[];    // several column filters in one header
}
const COLS: Col[] = [
  { key: 'sl', label: 'SL', w: 3 },
  { key: 'cardNo', label: 'Card No', w: 6, sort: 'cardNo', field: 'cardNo' },
  { key: 'info', label: 'Employee Info', sub: 'Name · Designation · Section', w: 12, sort: 'name',
    fields: [{ label: 'Designation', field: 'designation' }, { label: 'Section', field: 'section' }] },
  { key: 'termination', label: 'Settlement type', w: 9, field: 'termination' },
  { key: 'date', label: 'Settlement date', w: 7, sort: 'settlementDate', field: 'settlementDate' },
  { key: 'service', label: 'Service', w: 10, sort: 'service', field: 'service' },
  { key: 'receivable', label: 'Payable (A)', w: 8, sort: 'receivable', field: 'receivable', right: true },
  { key: 'deductions', label: 'Deduction (B)', w: 7, sort: 'deductions', field: 'deductions', right: true },
  { key: 'net', label: 'Net payable', w: 9, sort: 'net', field: 'net', right: true },
  { key: 'status', label: 'পরিশোধের অবস্থা', w: 6 },
  { key: 'salaryDate', label: 'বেতন পরিশোধ', sub: `${SALARY_DUE_WORKING_DAYS} কর্মদিবসের মধ্যে`, w: 8 },
  { key: 'otherDate', label: 'অন্যান্য পাওনা পরিশোধ', sub: `${OTHER_DUE_CALENDAR_DAYS} দিনের মধ্যে`, w: 8 },
  { key: 'actions', label: '', w: 7 },
];

/** Below this component width the table keeps TABLE_MIN_W and scrolls sideways inside its own area. */
const NARROW_PX = 900;
const TABLE_MIN_W = 900;
/** Below this width the table switches to compact cells (smaller padding / font) so every column still fits without sideways scrolling. */
const COMPACT_PX = 1250;
/** Table area never gets shorter than this (very small windows scroll the table, not the page). */
const TABLE_MIN_H = 240;
/** Space left under the table, so the card's bottom border stays visible. */
const BOTTOM_GAP = 14;
/** true = the browser page itself never scrolls while this screen is open (restored on leave). */
const PREVENT_PAGE_SCROLL = true;
const DUE_SOON_DAYS = 3;
const NAVY = '#1e3a5f';
const NONE = '\u0000none';                         // "nothing selected" marker for a column filter (empty list = no filter)

/** Header filter + sort buttons: compact, so the two sit close together in their vertical stack. */
const STACK_BTN: CSSProperties = { height: 16, minHeight: 0, lineHeight: 1, margin: 0 };
const num: CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const wrap: CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
// Headers wrap only between words, so a Bangla word is never split.
const headBox: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, margin: 0, padding: 0 };
const headWrap: CSSProperties = { whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'normal', lineHeight: 1.4 };

// Bangla status words (the stored values stay 'Pending' / 'Paid').
const STATUS_BN: Record<string, string> = { Pending: 'বকেয়া', Paid: 'পরিশোধিত', None: '—' };
const STATUS_DOT: Record<string, string> = { Pending: '#f59e0b', Paid: '#16a34a', None: '#94a3b8' };

const daysBetween = (fromIso: string, toIso: string): number => {
  const a = fromIso.slice(0, 10).split('-').map(Number), b = toIso.slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
};

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

  useLayoutEffect(() => { if (open) place(); }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps

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
        display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #94a3b8', borderRadius: 12,
        padding: 12, fontFamily: font, boxSizing: 'border-box',
      }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" aria-label={`Search ${label}`}
        style={{ ...inputStyle, flex: 'none', height: 34, marginBottom: 8, boxSizing: 'border-box' }} />
      <div className="fss-scroll" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 2 }}>
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
        onClick={() => { setQ(''); setOpen(o => !o); }} style={{ ...mini(active), ...STACK_BTN }}>{active ? '●' : '▾'}</button>
      {popup && createPortal(popup, document.body)}
    </>
  );
}

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

interface Props {
  rows: SettlementRow[];
  filters: SettlementFilters;
  onFiltersChange: (f: SettlementFilters) => void;
  onEdit: (id: string) => void;
  onBill: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onAdd: () => void;
}

export default function FinalSettlementStatement({ rows, filters, onFiltersChange, onEdit, onBill, onDelete, onMarkPaid, onAdd }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [viewH, setViewH]         = useState(520);
  const [narrow, setNarrow]       = useState(false);
  const [compact, setCompact]     = useState(false);
  const rootRef   = useRef<HTMLDivElement>(null);
  const topRef    = useRef<HTMLDivElement>(null);      // KPI cards + filter bar (its height changes when filters wrap)
  const scrollRef = useRef<HTMLDivElement>(null);      // the table's own scroll area
  const setFilter = (p: Partial<SettlementFilters>) => onFiltersChange({ ...filters, ...p });
  const today = todayIso();

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const all = useMemo(() => summarize(rows), [rows]);
  const statusCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, status: [] });
    return { total: base.length, Pending: base.filter(r => r.status === 'Pending').length, Paid: base.filter(r => r.status === 'Paid').length };
  }, [rows, filters]);
  // Pending rows whose salary or other-dues deadline has already passed.
  const overdueCount = useMemo(() => filtered.filter(r => {
    if (r.status !== 'Pending' || !r.lastAttendance) return false;
    const sal = addWorkingDays(r.lastAttendance, SALARY_DUE_WORKING_DAYS), oth = addCalendarDays(r.lastAttendance, OTHER_DUE_CALENDAR_DAYS);
    return (r.salaryAmount + r.otAmount > 0.005 && sal && sal < today) || (r.receivable - r.salaryAmount - r.otAmount > 0.005 && oth && oth < today);
  }).length, [filtered, today]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    const values = Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field))));
    // Dates list oldest → newest, amounts smallest → largest, everything else alphabetically (numbers inside text compared as numbers).
    const dmy = (v: string) => v.split('-').reverse().join('-');
    const amount = (v: string) => parseFloat(v.replace(/,/g, '')) || 0;
    if (field === 'settlementDate') return values.sort((a, b) => dmy(a).localeCompare(dmy(b)));
    if (field === 'receivable' || field === 'deductions' || field === 'net') return values.sort((a, b) => amount(a) - amount(b));
    return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: SettlementSortField) => {
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
      if (el) setViewH(Math.max(TABLE_MIN_H, Math.floor(window.innerHeight - el.getBoundingClientRect().top - BOTTOM_GAP)));
      const w = rootRef.current?.clientWidth ?? COMPACT_PX;
      setNarrow(w < NARROW_PX);
      setCompact(w < COMPACT_PX);
    };
    measure();
    const raf = requestAnimationFrame(measure);           // once more after fonts / child layout settle
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) { if (rootRef.current) ro.observe(rootRef.current); if (topRef.current) ro.observe(topRef.current); }
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', measure); unlock(); };
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
  const conflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
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
    <div style={{ background: '#fff', border: '1px solid #b4c0d0', borderRadius: 8, padding: '7px 12px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: font, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
  const toggleStatus = (v: string) => setFilter({ status: filters.status.includes(v) ? filters.status.filter(x => x !== v) : [...filters.status, v] });

  /**
   * A payment-deadline cell. `amount` is the part of the settlement this deadline covers;
   * when it is zero there is nothing to pay for that part, so the cell shows "—".
   */
  const dueCell = (due: string, amount: number, r: SettlementRow): ReactNode => {
    if (!due || amount <= 0.005) return <span style={{ color: '#cbd5e1' }}>—</span>;
    const amt = <div style={{ fontSize: 10.5, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>৳ {money(amount)}</div>;
    if (r.status === 'Paid') {
      return (
        <div style={{ lineHeight: 1.35 }}>
          <div style={{ color: '#15803d', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ {formatDMY(r.paymentDate) || 'পরিশোধিত'}</div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>শেষ তারিখ {formatDMY(due)}</div>
          {amt}
        </div>
      );
    }
    if (r.status !== 'Pending') {
      return <div style={{ lineHeight: 1.35 }}><div style={{ whiteSpace: 'nowrap' }}>{formatDMY(due)}</div>{amt}</div>;
    }
    const left = daysBetween(today, due);                       // > 0 future, 0 today, < 0 past
    const late = left < 0, soon = left >= 0 && left <= DUE_SOON_DAYS;
    const color = late ? '#b91c1c' : soon ? '#b45309' : '#334155';
    const note = late ? `${-left} দিন বিলম্ব` : left === 0 ? 'আজই শেষ দিন' : `${left} দিন বাকি`;
    return (
      <div style={{ lineHeight: 1.35 }} title={late ? 'তারিখ পার হয়েছে, এখনও বকেয়া' : undefined}>
        <div style={{ color, fontWeight: late || soon ? 700 : 500, whiteSpace: 'nowrap' }}>{formatDMY(due)}</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: late ? '#dc2626' : soon ? '#d97706' : '#64748b' }}>{note}</div>
        {amt}
      </div>
    );
  };

  const headCell = (c: Col) => {
    const caption = (
      <span style={{ ...headWrap, textAlign: c.right ? 'right' : 'left' }} title={c.label}>
        {c.label}
        {c.sub && <span style={{ display: 'block', fontSize: 9.5, fontWeight: 400, color: '#64748b' }}>{c.sub}</span>}
      </span>
    );
    if (!c.sort && !c.field && !c.fields) return <div style={{ ...headBox, justifyContent: c.right ? 'flex-end' : 'space-between' }}>{caption}</div>;
    const sorted = c.sort && filters.sort.field === c.sort;
    // Employee Info: ONE filter that lists Designation and Section values together ("Designation: X", "Section: Y").
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
  const actions = (r: SettlementRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      <button type="button" className="fss-icon" onClick={() => onBill(r.id)} title="Open payment bill" aria-label={`Bill of ${r.name}`} style={iconBtn('#475569')}>🖨</button>
      {r.status === 'Pending' && <button type="button" className="fss-icon" onClick={() => onMarkPaid(r.id)} title="পরিশোধিত হিসেবে চিহ্নিত করুন" aria-label={`Mark ${r.name} paid`} style={{ ...iconBtn('#16a34a'), fontWeight: 800 }}>✓</button>}
      <button type="button" className="fss-icon" onClick={() => onEdit(r.id)} title="Edit" aria-label={`Edit ${r.name}`} style={iconBtn('#2563eb')}>✎</button>
      <button type="button" className="fss-icon" onClick={() => setConfirmId(r.id)} title="Delete" aria-label={`Delete ${r.name}`} style={iconBtn('#dc2626')}>🗑</button>
    </span>
  );

  // Footer: totals of exactly the rows on screen (SL … Service = 6 columns, then A / B / Net, then 4 columns).
  const footBase: CSSProperties = { position: 'sticky', bottom: 0, zIndex: 2, background: '#eef2f7', borderTop: `2px solid ${NAVY}`, padding: '9px 10px', fontFamily: font, fontSize: 12.5, fontWeight: 800, color: NAVY };

  return (
    <div ref={rootRef} className={compact ? 'fss-compact' : undefined} style={{ background: '#fff', borderRadius: 12, border: '1px solid #b4c0d0', overflow: 'clip' }}>
      <style>{`
        .fss-row td { transition: background .12s; }
        .fss-row:nth-child(even) td { background: #fafbfd; }
        .fss-row:hover td { background: #eef4ff; }
        .fss-icon:hover { background: #e2e8f0 !important; border-color: #cbd5e1 !important; }
        /* compact cells on narrower screens: every column fits, no sideways scrolling */
        .fss-compact td { padding: 6px 5px !important; font-size: 11.5px !important; }
        .fss-compact th { padding: 8px 5px !important; font-size: 11px !important; }
        /* slim, modern scrollbars (table area and filter lists) */
        .fss-scroll { scrollbar-width: thin; scrollbar-color: #94a3b8 transparent; }
        .fss-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .fss-scroll::-webkit-scrollbar-track { background: transparent; }
        .fss-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        .fss-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; background-clip: padding-box; border: 2px solid transparent; }
        .fss-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>

      <div ref={topRef}>
        <div style={{ padding: '8px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
          {kpi('Settlements', String(sum.count), NAVY)}
          {kpi('Total net payable', `৳ ${money(sum.totalNet)}`, '#047857')}
          {kpi('বকেয়া', `${sum.pendingCount} · ৳ ${money(sum.pendingAmount)}`, sum.pendingCount ? '#92400e' : '#15803d')}
          {kpi('পরিশোধিত', `${sum.paidCount} · ৳ ${money(sum.paidAmount)}`, '#15803d')}
          {kpi('সময়সীমা পার', String(overdueCount), overdueCount ? '#b91c1c' : '#15803d')}
        </div>

        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ padding: '8px 14px 4px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 230 }}>
              <label htmlFor="fs-q" style={lbl}>Search (name / card no / designation / section / type)</label>
              <input id="fs-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
                style={{ ...inputStyle, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
            </div>
            {([['Settlement date — from', 'dateFrom'], ['Settlement date — to', 'dateTo']] as const).map(([label, key]) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <DateFieldDMY value={filters[key]} onChange={v => setFilter({ [key]: v } as Partial<SettlementFilters>)} ariaLabel={label} clearable invalid={conflict}
                  min={key === 'dateTo' ? filters.dateFrom || undefined : undefined} max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                  boxStyle={{ ...inputStyle, minWidth: 150, height: CONTROL_H, background: filters[key] ? '#eff6ff' : '#fff', borderColor: conflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1' }} />
              </div>
            ))}
            {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_SETTLEMENT_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
            <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New settlement</button>
          </div>
          {conflict && <div role="alert" style={{ padding: '0 14px 4px', fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: font }}>“From” is after “to” — nothing can match.</div>}
          <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button type="button" aria-pressed={filters.status.length === 0} onClick={() => setFilter({ status: [] })} style={chip(filters.status.length === 0, NAVY, '#e0e7ff')}>সব {statusCounts.total}</button>
            {(['Pending', 'Paid'] as const).map(s => (
              <button key={s} type="button" aria-pressed={filters.status.includes(s)} onClick={() => toggleStatus(s)} style={chip(filters.status.includes(s), STATUS_COLORS[s].color, STATUS_COLORS[s].bg)}>{STATUS_BN[s]} {statusCounts[s]}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {all.count} settlements</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="fss-scroll" style={{ overflow: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable', height: 'auto', maxHeight: viewH, minHeight: TABLE_MIN_H }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? TABLE_MIN_W : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead style={{ verticalAlign: 'top' }}><tr style={{ verticalAlign: 'top' }}>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 40, fontWeight: 600 }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>🗂</div>
                {rows.length === 0 ? 'No settlements saved yet — use “+ New settlement”.' : 'No settlements match the current filters'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const key = r.status || 'None';
              const st = STATUS_COLORS[key];
              const salaryPart = r.salaryAmount + r.otAmount;
              const otherPart = r.receivable - salaryPart;
              const salaryDue = r.lastAttendance ? addWorkingDays(r.lastAttendance, SALARY_DUE_WORKING_DAYS) : '';
              const otherDue = r.lastAttendance ? addCalendarDays(r.lastAttendance, OTHER_DUE_CALENDAR_DAYS) : '';
              return (
                <tr key={r.id || i} className="fss-row">
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600, color: '#64748b', borderLeft: `3px solid ${r.net < 0 ? '#dc2626' : r.status === 'Pending' ? '#f59e0b' : '#16a34a'}` }}>{i + 1}</td>
                  <td style={{ ...td, ...wrap }}>
                    {r.cardNo || '—'}
                  </td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.4 }}>{r.designation || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{r.section || '—'}</div>
                  </td>
                  <td style={{ ...td, ...wrap }}>
                    {r.termination
                      ? <span style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: 11.5, fontWeight: 600, color: '#334155', lineHeight: 1.4 }}>{r.termination}</span>
                      : '—'}
                  </td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDMY(r.settlementDate) || '—'}</td>
                  <td style={{ ...td, ...wrap }}>{r.service}<div style={{ fontSize: 10.5, color: '#64748b' }}>benefit {r.benefitYears} yr</div></td>
                  <td style={{ ...td, ...num }}>{money(r.receivable)}</td>
                  <td style={{ ...td, ...num, color: r.deductions > 0 ? '#b45309' : '#94a3b8' }}>{money(r.deductions)}</td>
                  <td style={{ ...td, ...num, fontWeight: 800, fontSize: 13, color: r.net < 0 ? '#b91c1c' : '#047857' }}>{money(r.net)}</td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[key] }} />{STATUS_BN[key]}
                    </span>
                  </td>
                  <td style={td}>{dueCell(salaryDue, salaryPart, r)}</td>
                  <td style={td}>{dueCell(otherDue, otherPart, r)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{actions(r)}</td>
                </tr>
              );
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={6} style={{ ...footBase, textAlign: 'right' }}>মোট ({filtered.length} জন)</td>
                <td style={{ ...footBase, ...num }}>{money(sum.totalReceivable)}</td>
                <td style={{ ...footBase, ...num }}>{money(sum.totalDeductions)}</td>
                <td style={{ ...footBase, ...num, color: sum.totalNet < 0 ? '#b91c1c' : '#047857' }}>{money(sum.totalNet)}</td>
                <td colSpan={4} style={footBase} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}