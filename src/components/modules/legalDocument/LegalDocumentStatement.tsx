// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentStatement.tsx — list of saved document records, exact column
// spec: SL, Document Title, Category, Document No., Issuing
// Authority, Issue Date, Expiry Date, Status, Attachment, Actions.
// Path: src/components/modules/legalDocument/LegalDocumentStatement.tsx
//
// UPDATE (same behaviour as the Audit/Visit Statement):
//   - Filters are OWNED BY LegalDocumentManager (`filters` / `onFiltersChange`)
//     and applied with the shared filterLegalEntries() from types.ts — the same
//     function Print Preview and the hidden print copy use, so what you see is
//     what prints. They also survive switching tabs. The old "Print List"
//     button is gone; use the header Print / PDF buttons.
//   - Pinned filter bar (position: sticky) + sticky column header directly under
//     it; ONE page scrollbar, no inner scroll container, no custom scrollbar.
//     overflow: clip (not hidden) on the root keeps sticky working. Only on
//     containers narrower than NARROW_PX does it fall back to a horizontal
//     scroller (header not sticky, Actions pinned right).
//   - Filter bar: Search (icon, ✕, Esc; a 4-digit year lists documents ISSUED or
//     EXPIRING in that year), "Issue Date From" (issue date on/after), "Expiry
//     Date To" (expiry on/before), Month-Year (button + popover with an
//     Issue | Expiry toggle, year stepper, month grid), Category, multi-select
//     status chips with live counts, "Clear Filters (n)", empty-state reset.
//   - Dates ALWAYS display DD-MM-YYYY: the filter fields use DateFieldDMY
//     (from LegalDocumentForm.tsx) and table cells use formatDMY().
//   - The red "expired / due soon" banner moved into a round "i" ball at the
//     right end of the status row: a count badge colored by the worst alert,
//     and a popover whose rows apply that status filter. It hides itself when
//     there is nothing to flag.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  CATEGORY_OPTIONS,
  buildLegalEntries,
  filterLegalEntries,
  hasActiveLegalFilters,
  countActiveLegalFilters,
  EMPTY_LEGAL_FILTERS,
  formatDMY,
  type LegalFilters,
} from './types';
import { EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { DateFieldDMY } from './LegalDocumentForm';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 7,
  fontSize: 12.5, fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none',
};
const thBase: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  boxShadow: 'inset 0 -1px 0 #e2e8f0', textAlign: 'left', verticalAlign: 'bottom',
};
const tdS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12.5, fontFamily: font, color: '#1e293b',
  borderBottom: '1px solid #e2e8f0', verticalAlign: 'top',
};
const CONTROL_H = 34;   // one height for every filter control
const FILTER_CSS = `
  .avs-field:focus-within .avs-box, .avs-ctl:focus-visible { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); outline: none; }
  .avs-chip:focus-visible, .avs-mini:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;
const STATUS_ORDER = ['valid', 'due-soon', 'expired', 'unknown'] as const;
const filterLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3,
};

const NARROW_PX = 900;   // below this container width, fall back to horizontal scroll


// ─── Inline SVG icons (crisp, theme-colored via currentColor) ────────────────

function Svg({ children, size = 14 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}
const SearchIcon   = () => <Svg><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>;
const CalendarIcon = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>;
const XIcon        = ({ size = 10 }: { size?: number }) => <Svg size={size}><path d="M18 6L6 18M6 6l12 12" /></Svg>;
const InfoIcon     = () => <Svg size={16}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Svg>;

// ─── Alerts info ball (replaces the red banner) ──────────────────────────────

const ALERT_POP_W = 300;

interface AlertsInfoProps {
  expired: number;
  dueSoon: number;
  onPick: (status: 'expired' | 'due-soon') => void;
}

function AlertsInfo({ expired, dueSoon, onPick }: AlertsInfoProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
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

  const total = expired + dueSoon;
  if (total === 0) return null;   // nothing to flag → no ball

  const tone = expired > 0
    ? { bg: '#fee2e2', fg: '#b91c1c', ring: '#fca5a5' }
    : { bg: '#fef3c7', fg: '#92400e', ring: '#fcd34d' };

  const rows = [
    { key: 'expired'  as const, n: expired, text: 'already expired',                  bg: '#fee2e2', fg: '#b91c1c' },
    { key: 'due-soon' as const, n: dueSoon, text: 'expiring within the next 2 months', bg: '#fef3c7', fg: '#92400e' },
  ].filter(r => r.n > 0);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(r.right - ALERT_POP_W, window.innerWidth - ALERT_POP_W - 8)) });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="avs-ctl"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${total} document(s) need attention`}
        title="Documents needing attention"
        style={{
          position: 'relative', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          background: tone.bg, color: tone.fg, border: `1px solid ${tone.ring}`,
        }}
      >
        <InfoIcon />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', top: -6, right: -6, minWidth: 16, height: 16, padding: '0 4px', boxSizing: 'border-box',
            borderRadius: 8, background: tone.fg, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: font,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff',
          }}
        >{total > 99 ? '99+' : total}</span>
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Documents needing attention"
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: ALERT_POP_W, zIndex: 1000,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10,
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)', fontFamily: font,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', padding: '2px 4px 8px' }}>Needs attention</div>
          {rows.map(r => (
            <button
              key={r.key}
              type="button"
              className="avs-mini"
              onClick={() => { onPick(r.key); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '7px 6px', background: 'none', border: 'none', borderRadius: 7, cursor: 'pointer',
                fontFamily: font, fontSize: 12.5, color: '#1e293b',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ minWidth: 26, padding: '2px 7px', borderRadius: 10, background: r.bg, color: r.fg, fontWeight: 700, fontSize: 12, textAlign: 'center' }}>{r.n}</span>
              <span style={{ flex: 1 }}>{r.text}</span>
              <span aria-hidden="true" style={{ color: '#94a3b8' }}>›</span>
            </button>
          ))}
          <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 4px 2px', borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
            Select a row to filter the list
          </div>
        </div>
      )}
    </>
  );
}

// ─── Month-Year filter (button + popover) ────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const POP_WIDTH = 288;

interface MonthYearFilterProps {
  basis: LegalFilters['monthBasis'];
  month: string;                                   // 'YYYY-MM' or ''
  onChange: (patch: Partial<Pick<LegalFilters, 'monthBasis' | 'month'>>) => void;
}

function MonthYearFilter({ basis, month, onChange }: MonthYearFilterProps) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => (month ? Number(month.slice(0, 4)) : new Date().getFullYear()));
  const [pos, setPos]           = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const now    = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const basisLabel = basis === 'expiry' ? 'Expiry' : 'Issue';
  const selYear  = month ? Number(month.slice(0, 4)) : null;
  const selMonth = month ? Number(month.slice(5, 7)) : null;
  const buttonText = selYear && selMonth ? `${basisLabel} · ${MONTHS[selMonth - 1]} ${selYear}` : 'Select month';

  const openPopover = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - POP_WIDTH - 8)) });
    setViewYear(selYear ?? now.getFullYear());
    setOpen(true);
  };

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

  const active = Boolean(month);
  const seg = (on: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 8px', fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
    border: 'none', borderRadius: 6, background: on ? '#1e3a5f' : 'transparent', color: on ? '#fff' : '#475569',
  });
  const linkBtn = (disabled: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', padding: '4px 6px', fontSize: 12, fontWeight: 600, fontFamily: font,
    color: disabled ? '#cbd5e1' : '#2563eb', cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <>
      <button
        ref={btnRef}
        className="avs-ctl"
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          ...inputStyle, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          minWidth: 150, justifyContent: 'space-between', height: CONTROL_H, boxSizing: 'border-box',
          background: active ? '#eff6ff' : '#fff',
          borderColor: active ? '#93c5fd' : open ? '#94a3b8' : '#cbd5e1',
          color: active ? '#1d4ed8' : '#475569', fontWeight: active ? 600 : 400,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CalendarIcon />{buttonText}
        </span>
        {active && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear month filter"
            title="Clear"
            onClick={e => { e.stopPropagation(); onChange({ month: '' }); setOpen(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange({ month: '' }); } }}
            style={{ fontSize: 11, lineHeight: 1, display: 'inline-flex', alignItems: 'center', padding: '2px 5px', borderRadius: 10, background: '#dbeafe', color: '#1d4ed8' }}
          ><XIcon /></span>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Filter by month and year"
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: POP_WIDTH, zIndex: 1000,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12,
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)', fontFamily: font,
          }}
        >
          {/* Which column the month applies to */}
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#f1f5f9', borderRadius: 8, marginBottom: 10 }}>
            <button type="button" style={seg(basis === 'issue')} onClick={() => onChange({ monthBasis: 'issue' })}>Issue Date</button>
            <button type="button" style={seg(basis === 'expiry')} onClick={() => onChange({ monthBasis: 'expiry' })}>Expiry Date</button>
          </div>

          {/* Year stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button type="button" aria-label="Previous year" onClick={() => setViewYear(y => y - 1)}
              style={{ ...linkBtn(false), fontSize: 16, color: '#475569' }}>‹</button>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{viewYear}</span>
            <button type="button" aria-label="Next year" onClick={() => setViewYear(y => y + 1)}
              style={{ ...linkBtn(false), fontSize: 16, color: '#475569' }}>›</button>
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {MONTHS.map((m, i) => {
              const key = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
              const selected = key === month;
              const isNow = key === curKey;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { onChange({ month: key }); setOpen(false); }}
                  style={{
                    padding: '8px 0', fontSize: 12.5, fontWeight: selected ? 700 : 500, fontFamily: font, cursor: 'pointer',
                    borderRadius: 7,
                    border: `1px solid ${selected ? '#1e3a5f' : isNow ? '#93c5fd' : '#e2e8f0'}`,
                    background: selected ? '#1e3a5f' : '#fff', color: selected ? '#fff' : '#1e293b',
                  }}
                >{m}</button>
              );
            })}
          </div>

          {/* Shortcuts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <button type="button" disabled={!active} style={linkBtn(!active)}
              onClick={() => { onChange({ month: '' }); setOpen(false); }}>Clear</button>
            <button type="button" style={linkBtn(false)}
              onClick={() => { onChange({ month: curKey }); setOpen(false); }}>This month</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Date filter field: DD-MM-YYYY via the shared DateFieldDMY ───────────────

interface DateFilterFieldProps {
  label: string;
  value: string;                         // ISO 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  invalid?: boolean;
}

function DateFilterField({ label, value, onChange, min, max, invalid }: DateFilterFieldProps) {
  return (
    <div>
      <label style={filterLabel}>{label}</label>
      <DateFieldDMY
        value={value}
        onChange={onChange}
        ariaLabel={label}
        min={min}
        max={max}
        invalid={invalid}
        clearable
        boxStyle={{
          ...inputStyle, minWidth: 150, height: CONTROL_H, boxSizing: 'border-box',
          borderColor: invalid ? '#dc2626' : value ? '#93c5fd' : '#cbd5e1',
          background: value ? '#eff6ff' : '#fff',
          color: value ? '#1d4ed8' : '#94a3b8', fontWeight: value ? 600 : 400,
        }}
      />
    </div>
  );
}

interface Props {
  records: DbRecord[];
  /** Owned by LegalDocumentManager. Optional only as a crash guard; without
   *  the Manager passing both, filters won't persist or reach Print Preview. */
  filters?: LegalFilters;
  onFiltersChange?: (filters: LegalFilters) => void;
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
}

export default function LegalDocumentStatement({
  records,
  filters = EMPTY_LEGAL_FILTERS,   // safety net: never crash if the parent omits it
  onFiltersChange = () => {},
  onEdit, onDelete,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toolbarH, setToolbarH] = useState(0);
  const [narrow, setNarrow]     = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const setFilter = (patch: Partial<LegalFilters>) => onFiltersChange({ ...filters, ...patch });

  const entries  = useMemo(() => buildLegalEntries(records), [records]);
  const filtered = useMemo(() => filterLegalEntries(entries, filters), [entries, filters]);

  // Status chip counts: every OTHER filter applied, status itself ignored.
  const statusCounts = useMemo(() => {
    const base = filterLegalEntries(entries, { ...filters, statuses: [] });
    const counts: Record<string, number> = {};
    for (const e of base) counts[e.status] = (counts[e.status] ?? 0) + 1;
    return { counts, total: base.length };
  }, [entries, filters]);

  const activeCount   = countActiveLegalFilters(filters);
  const rangeConflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const toggleStatus  = (st: string) => setFilter({
    statuses: filters.statuses.includes(st) ? filters.statuses.filter(x => x !== st) : [...filters.statuses, st],
  });

  const expiredCount = filtered.filter(({ status }) => status === 'expired').length;
  const dueSoonCount = filtered.filter(({ status }) => status === 'due-soon').length;

  // Sticky header must sit exactly under the pinned toolbar, whose height
  // changes when the filter row wraps — measure it. Also detect narrow width.
  useLayoutEffect(() => {
    const measure = () => {
      const h = toolbarRef.current?.offsetHeight ?? 0;
      setToolbarH(prev => (prev === h ? prev : h));
      const w = rootRef.current?.clientWidth ?? NARROW_PX;
      setNarrow(prev => (prev === (w < NARROW_PX) ? prev : w < NARROW_PX));
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) {
      if (toolbarRef.current) ro.observe(toolbarRef.current);
      if (rootRef.current)    ro.observe(rootRef.current);
    }
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const thS: React.CSSProperties = narrow
    ? thBase                                                   // inside h-scroller: no sticky
    : { ...thBase, position: 'sticky', top: toolbarH, zIndex: 2 };
  const thActions: React.CSSProperties = narrow
    ? { ...thBase, position: 'sticky', right: 0, zIndex: 3, boxShadow: 'inset 0 -1px 0 #e2e8f0, inset 1px 0 0 #e2e8f0' }
    : thS;
  const tdActions: React.CSSProperties = narrow
    ? { ...tdS, position: 'sticky', right: 0, zIndex: 1, background: '#fff', boxShadow: 'inset 1px 0 0 #e2e8f0' }
    : tdS;

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <style>{FILTER_CSS}</style>

      {/* Pinned toolbar: filters + status chips + record count stay visible while scrolling */}
      <div
        ref={toolbarRef}
        style={{
          position: 'sticky', top: 0, zIndex: 20, background: '#fff',
          borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)',
        }}
      >
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="lds-search" style={filterLabel}>Search (Title / Authority / Document No. / Year)</label>
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'inline-flex' }}><SearchIcon /></span>
              <input
                id="lds-search"
                className="avs-ctl"
                value={filters.search}
                onChange={e => setFilter({ search: e.target.value })}
                onKeyDown={e => { if (e.key === 'Escape' && filters.search) { e.preventDefault(); setFilter({ search: '' }); } }}
                placeholder="Search, or type a year (e.g. 2026)"
                autoComplete="off"
                style={{
                  ...inputStyle, width: '100%', height: CONTROL_H, boxSizing: 'border-box',
                  paddingLeft: 30, paddingRight: 30,
                  borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1',
                  background: filters.search.trim() ? '#eff6ff' : '#fff',
                }}
              />
              {filters.search && (
                <button
                  type="button"
                  className="avs-mini"
                  aria-label="Clear search"
                  title="Clear (Esc)"
                  onClick={() => setFilter({ search: '' })}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 10, fontSize: 10, lineHeight: 1, display: 'inline-flex', alignItems: 'center', padding: '3px 5px', cursor: 'pointer' }}
                ><XIcon /></button>
              )}
            </div>
          </div>

          <DateFilterField
            label="Issue Date From"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            invalid={rangeConflict}
            onChange={v => setFilter({ dateFrom: v })}
          />
          <DateFilterField
            label="Expiry Date To"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            invalid={rangeConflict}
            onChange={v => setFilter({ dateTo: v })}
          />
          <div>
            <label style={filterLabel}>Month-Year</label>
            <MonthYearFilter basis={filters.monthBasis} month={filters.month} onChange={setFilter} />
          </div>
          <div>
            <label htmlFor="lds-category" style={filterLabel}>Category</label>
            <select
              id="lds-category"
              className="avs-ctl"
              value={filters.category}
              onChange={e => setFilter({ category: e.target.value })}
              style={{
                ...inputStyle, height: CONTROL_H, boxSizing: 'border-box', minWidth: 130,
                borderColor: filters.category ? '#93c5fd' : '#cbd5e1',
                background: filters.category ? '#eff6ff' : '#fff',
                color: filters.category ? '#1d4ed8' : '#1e293b',
                fontWeight: filters.category ? 600 : 400,
              }}
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              className="avs-ctl"
              onClick={() => onFiltersChange(EMPTY_LEGAL_FILTERS)}
              style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}
            >
              Clear Filters ({activeCount})
            </button>
          )}
        </div>

        {rangeConflict && (
          <div role="alert" style={{ padding: '0 16px 6px', fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
            Issue Date From is after Expiry Date To — no documents can match.
          </div>
        )}

        <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="avs-chip"
            aria-pressed={filters.statuses.length === 0}
            onClick={() => setFilter({ statuses: [] })}
            style={{
              padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
              border: `1px solid ${filters.statuses.length === 0 ? '#1e3a5f' : '#e2e8f0'}`,
              background: filters.statuses.length === 0 ? '#1e3a5f' : '#fff',
              color: filters.statuses.length === 0 ? '#fff' : '#475569',
            }}
          >
            All {statusCounts.total}
          </button>
          {STATUS_ORDER.filter(st => (statusCounts.counts[st] ?? 0) > 0 || filters.statuses.includes(st)).map(st => {
            const on    = filters.statuses.includes(st);
            const style = EXPIRY_STATUS_STYLE[st];
            const n     = statusCounts.counts[st] ?? 0;
            return (
              <button
                key={st}
                type="button"
                className="avs-chip"
                aria-pressed={on}
                onClick={() => toggleStatus(st)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
                  border: `1px solid ${on ? style.color : '#e2e8f0'}`,
                  background: on ? style.bg : '#fff',
                  color: on ? style.color : '#475569',
                  opacity: n === 0 && !on ? 0.55 : 1,
                }}
              >
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: style.color }} />
                {style.label} <span style={{ fontWeight: 500 }}>{n}</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>
              {filtered.length} of {records.length} documents
            </span>
            <AlertsInfo
              expired={expiredCount}
              dueSoon={dueSoonCount}
              onPick={st => setFilter({ statuses: [st] })}
            />
          </div>
        </div>
      </div>

      {/* Table: rows scroll with the page; header sticks under the toolbar.
          Horizontal scroller only on narrow containers (see file header). */}
      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: narrow ? 900 : 0 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Document Title</th>
              <th style={thS}>Category</th>
              <th style={thS}>Document No.</th>
              <th style={thS}>Issuing Authority</th>
              <th style={thS}>Issue Date</th>
              <th style={thS}>Expiry Date</th>
              <th style={thS}>Status</th>
              <th style={thS}>Attachment</th>
              <th style={{ ...thActions, width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} style={{ ...tdS, textAlign: 'center', color: '#64748b', padding: 32 }}>
                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: hasActiveLegalFilters(filters) ? 8 : 0 }}>No documents match the current filters</div>
                  {hasActiveLegalFilters(filters) && (
                    <button
                      type="button"
                      onClick={() => onFiltersChange(EMPTY_LEGAL_FILTERS)}
                      style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}
                    >Clear Filters</button>
                  )}
                </td>
              </tr>
            )}
            {filtered.map(({ rec, status }, index) => {
              const s  = EXPIRY_STATUS_STYLE[status];
              const id = String(rec.id ?? '');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={tdS}>{String(rec.documentTitle ?? '—')}</td>
                  <td style={tdS}>{String(rec.category ?? '—')}</td>
                  <td style={tdS}>{String(rec.documentNo ?? '—')}</td>
                  <td style={tdS}>{String(rec.issuingAuthority ?? '—')}</td>
                  <td style={tdS}>{formatDMY(String(rec.issueDate ?? '')) || '—'}</td>
                  <td style={tdS}>{formatDMY(String(rec.expiryDate ?? '')) || '—'}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={tdS}>
                    {rec.attachment ? (
                      <a href={String(rec.attachment)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Link</a>
                    ) : '—'}
                  </td>
                  <td style={tdActions}>
                    {confirmDeleteId === id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11 }}>Sure?</span>
                        <button onClick={() => { onDelete(id); setConfirmDeleteId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onEdit(rec)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>
                        <button onClick={() => setConfirmDeleteId(id)} title="Delete" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}