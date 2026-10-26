// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentStatement.tsx — list of saved risk entries (filtered, sortable).
// Path: src/components/modules/riskAssessment/RiskAssessmentStatement.tsx
//
// Filters are OWNED BY RiskAssessmentManager (`filters` / `onFiltersChange`) and applied
// with the shared filterRiskEntries() from types.ts — so what you see is what prints
// and exports. Pinned filter bar; column headers stick under it. Funnel buttons filter
// by column values; ↕/▲/▼ sorts Section, Risk Assessment (score) and Action date.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  RISK_LEVEL_OPTIONS, RISK_LEVEL_STYLE, EMPTY_RISK_FILTERS, BLANK_VALUE,
  buildRiskEntries, filterRiskEntries, countActiveRiskFilters, hasActiveRiskFilters,
  riskColumnValue, assessmentText, formatDMY,
  type RiskFilters, type RiskSortField, type RiskLevelName,
} from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const CONTROL_H = 34;
const NARROW_PX = 900;

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 7,
  fontSize: 12.5, fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none',
};
const thBase: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font, color: '#374151', background: '#f8fafc',
  boxShadow: 'inset 0 -1px 0 #e2e8f0', textAlign: 'left', verticalAlign: 'bottom',
};
const tdS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12.5, fontFamily: font, color: '#1e293b',
  borderBottom: '1px solid #e2e8f0', verticalAlign: 'top',
};
const textCell: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const filterLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 };
const FILTER_CSS = `
  .ras-ctl:focus-visible { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.18); outline: none; }
  .ras-chip:focus-visible, .ras-mini:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
`;

// ─── Icons ───────────────────────────────────────────────────────────────────

function Svg({ children, size = 14 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>{children}</svg>
  );
}
const SearchIcon = () => <Svg><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>;
const XIcon = () => <Svg size={10}><path d="M18 6L6 18M6 6l12 12" /></Svg>;

// ─── Column-header filter (funnel + searchable checklist) ────────────────────

const HF_W = 240;

interface HeaderFilterProps {
  label: string;
  isDate: boolean;
  selected: string[];
  getOptions: () => string[];
  onChange: (selected: string[]) => void;
}

function HeaderFilter({ label, isDate, selected, getOptions, onChange }: HeaderFilterProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos]     = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const show = (v: string) => (isDate && v !== BLANK_VALUE ? formatDMY(v) : v);

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

  const active    = selected.length > 0;
  const options   = open ? getOptions() : [];
  const shown     = options.filter(o => show(o).toLowerCase().includes(query.trim().toLowerCase()));
  const effective = active ? selected : options;

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
        ref={btnRef} type="button" className="ras-mini"
        onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPopover(); }}
        aria-haspopup="dialog" aria-expanded={open} aria-label={`Filter ${label}`}
        title={active ? `Filtered (${selected.length})` : 'Filter'}
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
          ref={popRef} role="dialog" aria-label={`Filter ${label}`}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: HF_W, zIndex: 1000, textTransform: 'none',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font,
            boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)',
          }}
        >
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8, fontWeight: 400 }} />
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6, fontWeight: 400 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 400, color: '#1e293b', cursor: 'pointer' }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />
                <span style={textCell}>{show(o)}</span>
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

// ─── Table columns ───────────────────────────────────────────────────────────

interface Col { key: string; label: string; w: number; field?: string; sort?: RiskSortField; date?: boolean }

// widths sum to 100
const COLS: Col[] = [
  { key: 'sl',       label: 'ক্রমঃ', w: 3 },
  { key: 'section',  label: 'সেকশন / বিভাগ / অবস্থান', w: 8, field: 'section', sort: 'section' },
  { key: 'source',   label: 'ঝুঁকির উৎস / কার্যক্রম', w: 9, field: 'source' },
  { key: 'hazard',   label: 'চিহ্নিত বিপদ / ঝুঁকি', w: 11 },
  { key: 'impact',   label: 'সম্ভাব্য প্রভাব / পরিণতি', w: 10 },
  { key: 'controls', label: 'বিদ্যমান নিয়ন্ত্রণ ব্যবস্থা', w: 10 },
  { key: 'assess',   label: 'ঝুঁকি মূল্যায়ন (সম্ভাবনা × তীব্রতা = ঝুঁকির মাত্রা)', w: 11, field: 'riskLevel', sort: 'score' },
  { key: 'cause',    label: 'ঝুঁকির মূল কারণ', w: 9 },
  { key: 'action',   label: 'সংশোধনমূলক / প্রতিরোধমূলক ব্যবস্থা', w: 12, field: 'correctiveActionDate', sort: 'actionDate', date: true },
  { key: 'person',   label: 'দায়িত্বপ্রাপ্ত ব্যক্তির নাম ও পদবি', w: 10, field: 'responsiblePersonName' },
  { key: 'actions',  label: 'Actions', w: 7 },
];

const pill = (level: RiskLevelName): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 700,
  background: RISK_LEVEL_STYLE[level].bg, color: RISK_LEVEL_STYLE[level].color,
});

interface Props {
  records: DbRecord[];
  filters?: RiskFilters;
  onFiltersChange?: (filters: RiskFilters) => void;
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onExportExcel?: () => void;
}

export default function RiskAssessmentStatement({
  records, filters = EMPTY_RISK_FILTERS, onFiltersChange = () => {}, onEdit, onDelete, onExportExcel,
}: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toolbarH, setToolbarH] = useState(0);
  const [narrow, setNarrow]     = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const setFilter = (patch: Partial<RiskFilters>) => onFiltersChange({ ...filters, ...patch });

  const entries  = useMemo(() => buildRiskEntries(records), [records]);
  const filtered = useMemo(() => filterRiskEntries(entries, filters), [entries, filters]);

  // Chip counts: every OTHER filter applied, the level selection itself ignored.
  const levelCounts = useMemo(() => {
    const base = filterRiskEntries(entries, { ...filters, levels: [] });
    const counts: Record<string, number> = {};
    for (const e of base) counts[e.level] = (counts[e.level] ?? 0) + 1;
    return { counts, total: base.length };
  }, [entries, filters]);

  const activeCount   = countActiveRiskFilters(filters);
  const rangeConflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const toggleLevel   = (lv: string) => setFilter({
    levels: filters.levels.includes(lv) ? filters.levels.filter(x => x !== lv) : [...filters.levels, lv],
  });

  // Values offered by a column filter: every OTHER filter applied, this column's own ignored.
  const columnOptions = (field: string): string[] => {
    const cols = { ...(filters.columns ?? {}) };
    delete cols[field];
    const base = filterRiskEntries(entries, { ...filters, columns: cols });
    return Array.from(new Set(base.map(e => riskColumnValue(e, field)))).sort();
  };
  const setColumn = (field: string, selected: string[]) =>
    setFilter({ columns: { ...(filters.columns ?? {}), [field]: selected } });

  const cycleSort = (field: RiskSortField) => {
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

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
      if (rootRef.current) ro.observe(rootRef.current);
    }
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const thS: React.CSSProperties = narrow ? thBase : { ...thBase, position: 'sticky', top: toolbarH, zIndex: 2 };
  const thActions: React.CSSProperties = narrow
    ? { ...thBase, position: 'sticky', right: 0, zIndex: 3, boxShadow: 'inset 0 -1px 0 #e2e8f0, inset 1px 0 0 #e2e8f0' }
    : thS;
  const tdActions: React.CSSProperties = narrow
    ? { ...tdS, position: 'sticky', right: 0, zIndex: 1, background: '#fff', boxShadow: 'inset 1px 0 0 #e2e8f0' }
    : tdS;

  const headCell = (c: Col) => {
    if (!c.field && !c.sort) return c.label;
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    const sortedHere = c.sort && cur.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {c.sort && (
            <button
              type="button" className="ras-mini" onClick={() => cycleSort(c.sort!)} aria-label={`Sort ${c.label}`}
              title={sortedHere ? (cur.dir === 'asc' ? 'Ascending — click for descending' : 'Descending — click to clear') : 'Sort ascending'}
              style={{
                flexShrink: 0, padding: '2px 5px', cursor: 'pointer', borderRadius: 5, fontSize: 11, fontWeight: 700,
                border: `1px solid ${sortedHere ? '#93c5fd' : 'transparent'}`,
                background: sortedHere ? '#dbeafe' : 'transparent', color: sortedHere ? '#1d4ed8' : '#64748b',
              }}
            >{sortedHere ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
          )}
          {c.field && (
            <HeaderFilter
              label={c.label}
              isDate={Boolean(c.date)}
              selected={filters.columns?.[c.field] ?? []}
              getOptions={() => columnOptions(c.field!)}
              onChange={sel => setColumn(c.field!, sel)}
            />
          )}
        </span>
      </div>
    );
  };

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <style>{FILTER_CSS}</style>

      {/* Pinned toolbar */}
      <div
        ref={toolbarRef}
        style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)' }}
      >
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="ras-search" style={filterLabel}>Search (সেকশন / উৎস / ঝুঁকি / ব্যক্তি)</label>
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'inline-flex' }}><SearchIcon /></span>
              <input
                id="ras-search" className="ras-ctl" value={filters.search}
                onChange={e => setFilter({ search: e.target.value })}
                onKeyDown={e => { if (e.key === 'Escape' && filters.search) { e.preventDefault(); setFilter({ search: '' }); } }}
                placeholder="Search…" autoComplete="off"
                style={{
                  ...inputStyle, width: '100%', height: CONTROL_H, boxSizing: 'border-box', paddingLeft: 30, paddingRight: 30,
                  borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1', background: filters.search.trim() ? '#eff6ff' : '#fff',
                }}
              />
              {filters.search && (
                <button
                  type="button" className="ras-mini" aria-label="Clear search" title="Clear (Esc)" onClick={() => setFilter({ search: '' })}
                  style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 10, lineHeight: 1, display: 'inline-flex', alignItems: 'center', padding: '3px 5px', cursor: 'pointer' }}
                ><XIcon /></button>
              )}
            </div>
          </div>

          {([['Action Date From', 'dateFrom'], ['Action Date To', 'dateTo']] as const).map(([label, key]) => (
            <div key={key}>
              <label style={filterLabel}>{label}</label>
              <DateFieldDMY
                value={filters[key]}
                onChange={v => setFilter({ [key]: v } as Partial<RiskFilters>)}
                ariaLabel={label}
                min={key === 'dateTo' ? filters.dateFrom || undefined : undefined}
                max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                invalid={rangeConflict}
                clearable
                boxStyle={{
                  ...inputStyle, minWidth: 150, height: CONTROL_H, boxSizing: 'border-box',
                  borderColor: rangeConflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1',
                  background: filters[key] ? '#eff6ff' : '#fff',
                }}
              />
            </div>
          ))}

          {activeCount > 0 && (
            <button
              type="button" className="ras-ctl" onClick={() => onFiltersChange(EMPTY_RISK_FILTERS)}
              style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}
            >Clear Filters ({activeCount})</button>
          )}
        </div>

        {rangeConflict && (
          <div role="alert" style={{ padding: '0 16px 6px', fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>
            Action Date From is after Action Date To — no records can match.
          </div>
        )}

        <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button" className="ras-chip" aria-pressed={filters.levels.length === 0} onClick={() => setFilter({ levels: [] })}
            style={{
              padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
              border: `1px solid ${filters.levels.length === 0 ? '#1e3a5f' : '#e2e8f0'}`,
              background: filters.levels.length === 0 ? '#1e3a5f' : '#fff', color: filters.levels.length === 0 ? '#fff' : '#475569',
            }}
          >সব {levelCounts.total}</button>
          {RISK_LEVEL_OPTIONS.filter(lv => (levelCounts.counts[lv] ?? 0) > 0 || filters.levels.includes(lv)).map(lv => {
            const on = filters.levels.includes(lv);
            const n  = levelCounts.counts[lv] ?? 0;
            const st = RISK_LEVEL_STYLE[lv];
            return (
              <button
                key={lv} type="button" className="ras-chip" aria-pressed={on} onClick={() => toggleLevel(lv)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                  fontFamily: font, cursor: 'pointer', border: `1px solid ${on ? st.bg : '#e2e8f0'}`,
                  background: on ? st.bg : '#fff', color: on ? st.color : '#475569', opacity: n === 0 && !on ? 0.55 : 1,
                }}
              >
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: st.bg === '#ffffff' ? st.color : (lv === 'অত্যন্ত উচ্চ' ? '#7f1d1d' : st.color) }} />
                {lv} <span style={{ fontWeight: 500 }}>{n}</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {onExportExcel && (
              <button
                type="button" className="ras-ctl" onClick={onExportExcel} disabled={filtered.length === 0} title="Download the filtered list as Excel"
                style={{
                  height: 28, padding: '0 12px', background: '#166534', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12,
                  fontFamily: font, fontWeight: 600, cursor: filtered.length ? 'pointer' : 'not-allowed', opacity: filtered.length ? 1 : 0.5,
                }}
              >⬇ Excel</button>
            )}
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {records.length} entries</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? 1300 : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead>
            <tr>{COLS.map(c => <th key={c.key} style={c.key === 'actions' ? thActions : thS}>{headCell(c)}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length} style={{ ...tdS, textAlign: 'center', color: '#64748b', padding: 32 }}>
                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: hasActiveRiskFilters(filters) ? 8 : 0 }}>কোনো এন্ট্রি পাওয়া যায়নি</div>
                  {hasActiveRiskFilters(filters) && (
                    <button type="button" onClick={() => onFiltersChange(EMPTY_RISK_FILTERS)}
                      style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
                      Clear Filters
                    </button>
                  )}
                </td>
              </tr>
            )}
            {filtered.map((e, index) => {
              const r = e.rec;
              const id = String(r.id ?? '');
              const text = (v: unknown) => String(v ?? '') || '—';
              const actionDate = formatDMY(String(r.correctiveActionDate ?? '').slice(0, 10));
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, ...textCell, fontWeight: 600 }}>{text(r.section)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(r.source)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(r.riskIdentification)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(r.impact)}</td>
                  <td style={{ ...tdS, ...textCell }}>{text(r.remedy)}</td>
                  <td style={tdS}>
                    {e.level
                      ? <span style={pill(e.level)}>{assessmentText(e.likelihood, e.severity, e.level)}</span>
                      : '—'}
                  </td>
                  <td style={{ ...tdS, ...textCell }}>{text(r.causeInvestigation)}</td>
                  <td style={tdS}>
                    <div style={textCell}>{text(r.correctiveAction)}</div>
                    {actionDate && <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: '#475569' }}>{actionDate}</div>}
                  </td>
                  <td style={{ ...tdS, ...textCell }}>
                    {text(r.responsiblePersonName)}{r.responsiblePersonDesignation ? `, ${r.responsiblePersonDesignation}` : ''}
                  </td>
                  <td style={tdActions}>
                    {confirmDeleteId === id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11 }}>Sure?</span>
                        <button onClick={() => { onDelete(id); setConfirmDeleteId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => onEdit(r)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
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
    </div>
  );
}