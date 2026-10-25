// ─────────────────────────────────────────────────────────────────────────────
// CorrectiveActionStatement.tsx — list of saved CAP / NC records, shown as TWO
// tables over the same (filtered) records, in the same order, with the same SL No.:
//   Page 1 — NC details:  SL No., Audit Conducted By, Audit Date, NC ID,
//            NC Description, NC Reference, NC Category / Keyword, Root Cause
//            Analysis, Corrective Action Plan (CAP), Target Completion Date,
//            Responsible Person(s), CAP Status  (+ Actions on screen)
//   Page 2 — Evidence:    SL No., NC ID, NC Category / Keyword, CAP Status,
//            Evidence 1, Evidence 2, Evidence 3 (previews, click to enlarge)
// Path: src/components/modules/correctiveAction/CorrectiveActionStatement.tsx
//
// Filters are OWNED BY CorrectiveActionManager (`filters` / `onFiltersChange`) and
// applied with the shared filterCapEntries() from types.ts, so what you see is what
// prints and what exports. The "⬇ Excel" button calls `onExportExcel`.
//
// COLUMN-HEADER FILTERS: key columns have a funnel button opening a searchable
// checklist of that column's values (only values still present under the other
// filters). Selections live in `filters.columns`.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  CAP_STATUS_OPTIONS,
  CAP_STATE_STYLE,
  DUE_SOON_DAYS,
  buildCapEntries,
  filterCapEntries,
  hasActiveCapFilters,
  countActiveCapFilters,
  EMPTY_CAP_FILTERS,
  formatDMY,
  capColumnValue,
  BLANK_VALUE,
  type CapFilters,
} from './types';
import { DateFieldDMY } from './CorrectiveActionForm';
import { EvidenceThumb } from './EvidenceView';

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
const STATUS_ORDER = ['overdue', 'due-soon', 'on-track', 'done', 'no-date'] as const;
const filterLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3,
};

const NARROW_PX = 760;   // below this container width, fall back to horizontal scroll


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

// ─── Alerts info ball ────────────────────────────────────────────────────────

const ALERT_POP_W = 300;

interface AlertsInfoProps {
  expired: number;
  dueSoon: number;
  onPick: (status: 'overdue' | 'due-soon') => void;
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
    { key: 'overdue'  as const, n: expired, text: 'overdue (target date passed)',     bg: '#fee2e2', fg: '#b91c1c' },
    { key: 'due-soon' as const, n: dueSoon, text: `due within ${DUE_SOON_DAYS} days`, bg: '#fef3c7', fg: '#92400e' },
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
        aria-label={`${total} action(s) need attention`}
        title="Actions needing attention"
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
          aria-label="Actions needing attention"
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
  basis: CapFilters['monthBasis'];
  month: string;                                   // 'YYYY-MM' or ''
  onChange: (patch: Partial<Pick<CapFilters, 'monthBasis' | 'month'>>) => void;
}

function MonthYearFilter({ basis, month, onChange }: MonthYearFilterProps) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => (month ? Number(month.slice(0, 4)) : new Date().getFullYear()));
  const [pos, setPos]           = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const now    = new Date();
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const basisLabel = basis === 'target' ? 'Target' : 'Audit';
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
          <div style={{ display: 'flex', gap: 2, padding: 3, background: '#f1f5f9', borderRadius: 8, marginBottom: 10 }}>
            <button type="button" style={seg(basis === 'audit')} onClick={() => onChange({ monthBasis: 'audit' })}>Audit Date</button>
            <button type="button" style={seg(basis === 'target')} onClick={() => onChange({ monthBasis: 'target' })}>Target Date</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button type="button" aria-label="Previous year" onClick={() => setViewYear(y => y - 1)}
              style={{ ...linkBtn(false), fontSize: 16, color: '#475569' }}>‹</button>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{viewYear}</span>
            <button type="button" aria-label="Next year" onClick={() => setViewYear(y => y + 1)}
              style={{ ...linkBtn(false), fontSize: 16, color: '#475569' }}>›</button>
          </div>

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

// ─── Column-header filter (funnel button + searchable checklist) ─────────────

const FILTER_FIELD: Record<string, string> = {
  'Audit Conducted By': 'auditConductedBy', 'Audit Date': 'auditDate', 'NC ID': 'ncId',
  'NC Reference': 'ncReference', 'NC Category / Keyword': 'ncCategory',
  'Target Completion Date': 'targetDate', 'Responsible Person(s)': 'responsiblePersons', 'CAP Status': 'capStatus',
};
const HF_W = 240;

interface HeaderFilterProps {
  label: string;
  field: string;
  selected: string[];
  getOptions: () => string[];
  onChange: (selected: string[]) => void;
}

function HeaderFilter({ label, field, selected, getOptions, onChange }: HeaderFilterProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const isDate = field === 'auditDate' || field === 'targetDate';
  const show   = (v: string) => (isDate && v !== BLANK_VALUE ? formatDMY(v) : v);

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
  const options = open ? getOptions() : [];
  const shown   = options.filter(o => show(o).toLowerCase().includes(query.trim().toLowerCase()));
  const effective = active ? selected : options;     // nothing selected = everything ticked

  const toggle = (v: string) => {
    const next = effective.includes(v) ? effective.filter(x => x !== v) : [...effective, v];
    onChange(next.length === 0 || next.length === options.length ? [] : next);
  };

  const openPopover = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - HF_W - 8)) });
    setQuery('');
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="avs-mini"
        onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPopover(); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Filter ${label}`}
        title={active ? `Filtered (${selected.length})` : `Filter ${label}`}
        style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 4px', cursor: 'pointer',
          borderRadius: 5, border: `1px solid ${active ? '#93c5fd' : 'transparent'}`,
          background: active ? '#dbeafe' : 'transparent', color: active ? '#1d4ed8' : '#64748b',
        }}
      >
        <Svg size={11}><path d="M3 4h18l-7 8v6l-4 2v-8z" /></Svg>
        {active && <span style={{ fontSize: 9, fontWeight: 700 }}>{selected.length}</span>}
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label={`Filter ${label}`}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: HF_W, zIndex: 1000, textTransform: 'none',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font,
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)',
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${label}`}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8, fontWeight: 400 }}
          />
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6, fontWeight: 400 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 400, color: '#1e293b', cursor: 'pointer', borderRadius: 5 }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />
                <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{show(o)}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={() => onChange([])} disabled={!active}
              style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, fontFamily: font, cursor: active ? 'pointer' : 'default', color: active ? '#2563eb' : '#cbd5e1' }}>
              Select all
            </button>
            <button type="button" onClick={() => setOpen(false)}
              style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface Props {
  records: DbRecord[];
  /** Owned by CorrectiveActionManager. Optional only as a crash guard. */
  filters?: CapFilters;
  onFiltersChange?: (filters: CapFilters) => void;
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  /** Downloads the filtered list as Excel (the "⬇ Excel" button shows only when this is given). */
  onExportExcel?: () => void;
}

// (label, width %) — fixed-layout columns; each table sums to 100.
const PAGE1_COLS: [string, number][] = [
  ['SL No.', 3], ['Audit Conducted By', 7], ['Audit Date', 7], ['NC ID', 6], ['NC Description', 11],
  ['NC Reference', 6], ['NC Category / Keyword', 7], ['Root Cause Analysis', 11],
  ['Corrective Action Plan (CAP)', 12], ['Target Completion Date', 8], ['Responsible Person(s)', 8],
  ['CAP Status', 8], ['Actions', 6],
];
const PAGE2_COLS: [string, number][] = [
  ['SL No.', 4], ['NC ID', 8], ['NC Category / Keyword', 10], ['CAP Status', 9],
  ['Evidence 1', 23], ['Evidence 2', 23], ['Evidence 3', 23],
];

// Small colored pills for the CAP Status cell.
const CAP_STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  'Completed':            { bg: '#dcfce7', fg: '#166534' },
  'Closed':               { bg: '#dcfce7', fg: '#166534' },
  'In Progress':          { bg: '#dbeafe', fg: '#1d4ed8' },
  'Ongoing':              { bg: '#dbeafe', fg: '#1d4ed8' },
  'Pending Evidence':     { bg: '#fef3c7', fg: '#92400e' },
  'Pending Verification': { bg: '#fef3c7', fg: '#92400e' },
  'Open':                 { bg: '#f1f5f9', fg: '#475569' },
};
const pill = (tone: { bg: string; fg: string } | undefined): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
  background: tone?.bg ?? '#f1f5f9', color: tone?.fg ?? '#475569',
});
const textCell: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

const selectStyle = (active: boolean): React.CSSProperties => ({
  ...inputStyle, height: CONTROL_H, boxSizing: 'border-box', minWidth: 130,
  borderColor: active ? '#93c5fd' : '#cbd5e1',
  background: active ? '#eff6ff' : '#fff',
  color: active ? '#1d4ed8' : '#1e293b',
  fontWeight: active ? 600 : 400,
});

const sectionBar: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
  padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
  fontFamily: font, fontSize: 12, color: '#475569',
};

function EvidenceCell({ url, name }: { url: unknown; name: unknown }) {
  return <EvidenceThumb url={url} name={name} maxWidth={170} />;
}

export default function CorrectiveActionStatement({
  records,
  filters = EMPTY_CAP_FILTERS,   // safety net: never crash if the parent omits it
  onFiltersChange = () => {},
  onEdit, onDelete, onExportExcel,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toolbarH, setToolbarH] = useState(0);
  const [narrow, setNarrow]     = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const setFilter = (patch: Partial<CapFilters>) => onFiltersChange({ ...filters, ...patch });

  const entries  = useMemo(() => buildCapEntries(records), [records]);
  const filtered = useMemo(() => filterCapEntries(entries, filters), [entries, filters]);

  // Chip counts: every OTHER filter applied, the chip selection itself ignored.
  const statusCounts = useMemo(() => {
    const base = filterCapEntries(entries, { ...filters, statuses: [] });
    const counts: Record<string, number> = {};
    for (const e of base) counts[e.state] = (counts[e.state] ?? 0) + 1;
    return { counts, total: base.length };
  }, [entries, filters]);

  const activeCount   = countActiveCapFilters(filters);
  const rangeConflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const toggleStatus  = (st: string) => setFilter({
    statuses: filters.statuses.includes(st) ? filters.statuses.filter(x => x !== st) : [...filters.statuses, st],
  });

  // Values offered by a column filter: every OTHER filter applied, this column's own ignored.
  const columnOptions = (field: string): string[] => {
    const cols = { ...(filters.columns ?? {}) };
    delete cols[field];
    const base = filterCapEntries(entries, { ...filters, columns: cols });
    return Array.from(new Set(base.map(e => capColumnValue(e.rec, field)))).sort();
  };
  const setColumn = (field: string, selected: string[]) =>
    setFilter({ columns: { ...(filters.columns ?? {}), [field]: selected } });

  const SORT_FIELD: Record<string, 'ncId' | 'auditDate'> = { 'NC ID': 'ncId', 'Audit Date': 'auditDate' };

  const cycleSort = (field: 'ncId' | 'auditDate') => {
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

  const headCell = (label: string) => {
    const field = FILTER_FIELD[label];
    if (!field) return label;
    const sortField = SORT_FIELD[label];
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    const sortedHere = sortField && cur.field === sortField;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {sortField && (
            <button
              type="button"
              className="avs-mini"
              onClick={() => cycleSort(sortField)}
              aria-label={`Sort ${label}`}
              title={sortedHere ? (cur.dir === 'asc' ? 'Ascending — click for descending' : 'Descending — click to clear') : `Sort ${label} ascending`}
              style={{
                flexShrink: 0, padding: '2px 5px', cursor: 'pointer', borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: `1px solid ${sortedHere ? '#93c5fd' : 'transparent'}`,
                background: sortedHere ? '#dbeafe' : 'transparent', color: sortedHere ? '#1d4ed8' : '#64748b',
              }}
            >{sortedHere ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
          )}
          <HeaderFilter
            label={label}
            field={field}
            selected={filters.columns?.[field] ?? []}
            getOptions={() => columnOptions(field)}
            onChange={sel => setColumn(field, sel)}
          />
        </span>
      </div>
    );
  };

  const overdueCount = filtered.filter(({ state }) => state === 'overdue').length;
  const dueSoonCount = filtered.filter(({ state }) => state === 'due-soon').length;

  // Sticky headers must sit exactly under the pinned toolbar — measure it.
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
    ? thBase
    : { ...thBase, position: 'sticky', top: toolbarH, zIndex: 2 };
  const thActions: React.CSSProperties = narrow
    ? { ...thBase, position: 'sticky', right: 0, zIndex: 3, boxShadow: 'inset 0 -1px 0 #e2e8f0, inset 1px 0 0 #e2e8f0' }
    : thS;
  const tdActions: React.CSSProperties = narrow
    ? { ...tdS, position: 'sticky', right: 0, zIndex: 1, background: '#fff', boxShadow: 'inset 1px 0 0 #e2e8f0' }
    : tdS;

  const tableStyle = (minWidth: number): React.CSSProperties => ({
    width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? minWidth : 0,
  });
  const colgroup = (cols: [string, number][]) => (
    <colgroup>{cols.map(([label, w]) => <col key={label} style={{ width: `${w}%` }} />)}</colgroup>
  );
  const emptyRow = (span: number) => (
    <tr>
      <td colSpan={span} style={{ ...tdS, textAlign: 'center', color: '#64748b', padding: 32 }}>
        <div style={{ fontWeight: 600, color: '#475569', marginBottom: hasActiveCapFilters(filters) ? 8 : 0 }}>No records match the current filters</div>
        {hasActiveCapFilters(filters) && (
          <button
            type="button"
            onClick={() => onFiltersChange(EMPTY_CAP_FILTERS)}
            style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}
          >Clear Filters</button>
        )}
      </td>
    </tr>
  );

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <style>{FILTER_CSS}</style>

      {/* Pinned toolbar: filters + state chips + record count stay visible while scrolling */}
      <div
        ref={toolbarRef}
        style={{
          position: 'sticky', top: 0, zIndex: 20, background: '#fff',
          borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)',
        }}
      >
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="cas-search" style={filterLabel}>Search (NC / Auditor / Person / Keyword / Year)</label>
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'inline-flex' }}><SearchIcon /></span>
              <input
                id="cas-search"
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
            label="Audit Date From"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            invalid={rangeConflict}
            onChange={v => setFilter({ dateFrom: v })}
          />
          <DateFilterField
            label="Target Date To"
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
            <label htmlFor="cas-capstatus" style={filterLabel}>CAP Status</label>
            <select
              id="cas-capstatus"
              className="avs-ctl"
              value={filters.capStatus}
              onChange={e => setFilter({ capStatus: e.target.value })}
              style={selectStyle(Boolean(filters.capStatus))}
            >
              <option value="">All</option>
              {CAP_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              className="avs-ctl"
              onClick={() => onFiltersChange(EMPTY_CAP_FILTERS)}
              style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}
            >
              Clear Filters ({activeCount})
            </button>
          )}
        </div>

        {rangeConflict && (
          <div role="alert" style={{ padding: '0 16px 6px', fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
            Audit Date From is after Target Date To — no records can match.
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
            const style = CAP_STATE_STYLE[st];
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
            {onExportExcel && (
              <button
                type="button"
                className="avs-ctl"
                onClick={onExportExcel}
                disabled={filtered.length === 0}
                title="Download the filtered list as Excel"
                style={{
                  height: 28, padding: '0 12px', background: '#166534', color: '#fff', border: 'none',
                  borderRadius: 7, fontSize: 12, fontFamily: font, fontWeight: 600,
                  cursor: filtered.length ? 'pointer' : 'not-allowed', opacity: filtered.length ? 1 : 0.5,
                }}
              >⬇ Excel</button>
            )}
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>
              {filtered.length} of {records.length} records
            </span>
            <AlertsInfo
              expired={overdueCount}
              dueSoon={dueSoonCount}
              onPick={st => setFilter({ statuses: [st] })}
            />
          </div>
        </div>
      </div>

      {/* ── Page 1 — NC details ─────────────────────────────────────────── */}
      <div style={sectionBar}>
        <strong style={{ color: '#1e293b' }}>Page 1 — NC details</strong>
        <span>{filtered.length} record(s)</span>
      </div>
      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={tableStyle(1100)}>
          {colgroup(PAGE1_COLS)}
          <thead>
            <tr>
              {PAGE1_COLS.map(([label]) => (
                <th key={label} style={label === 'Actions' ? thActions : thS}>{headCell(label)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && emptyRow(PAGE1_COLS.length)}
            {filtered.map(({ rec, state, detail }, index) => {
              const id    = String(rec.id ?? '');
              const style = CAP_STATE_STYLE[state];
              const cap   = String(rec.capStatus ?? '');
              const text  = (v: unknown) => String(v ?? '') || '—';
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.auditConductedBy)}</td>
                  <td style={tdS}>{formatDMY(String(rec.auditDate ?? '')) || '—'}</td>
                  <td style={{ ...tdS, ...textCell, fontWeight: 600 }}>{text(rec.ncId)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.ncDescription)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.ncReference)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.ncCategory)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.rootCause)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.correctiveAction)}</td>
                  <td style={tdS}>
                    <div>{formatDMY(String(rec.targetDate ?? '')) || '—'}</div>
                    {state !== 'no-date' && (
                      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: style.color }}>
                        {state === 'done' ? 'Done' : detail}
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdS, ...textCell }}>{text(rec.responsiblePersons)}</td>
                  <td style={tdS}>{cap ? <span style={pill(CAP_STATUS_TONE[cap])}>{cap}</span> : '—'}</td>
                  <td style={tdActions}>
                    {confirmDeleteId === id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11 }}>Sure?</span>
                        <button onClick={() => { onDelete(id); setConfirmDeleteId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => onEdit(rec)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
                        <button onClick={() => setConfirmDeleteId(id)} title="Delete" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}>🗑</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Page 2 — Evidence (same NC IDs, same order and SL No.) ───────── */}
      <div style={{ ...sectionBar, marginTop: 12 }}>
        <strong style={{ color: '#1e293b' }}>Page 2 — Evidence</strong>
        <span>same {filtered.length} record(s) as Page 1</span>
      </div>
      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={tableStyle(720)}>
          {colgroup(PAGE2_COLS)}
          <thead>
            <tr>{PAGE2_COLS.map(([label]) => <th key={label} style={thS}>{headCell(label)}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && emptyRow(PAGE2_COLS.length)}
            {filtered.map(({ rec }, index) => {
              const id  = String(rec.id ?? '');
              const cap = String(rec.capStatus ?? '');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, ...textCell, fontWeight: 600 }}>{String(rec.ncId ?? '') || '—'}</td>
                  <td style={{ ...tdS, ...textCell }}>{String(rec.ncCategory ?? '') || '—'}</td>
                  <td style={tdS}>{cap ? <span style={pill(CAP_STATUS_TONE[cap])}>{cap}</span> : '—'}</td>
                  <td style={tdS}><EvidenceCell url={rec.evidence1} name={rec.evidence1Name} /></td>
                  <td style={tdS}><EvidenceCell url={rec.evidence2} name={rec.evidence2Name} /></td>
                  <td style={tdS}><EvidenceCell url={rec.evidence3} name={rec.evidence3Name} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}