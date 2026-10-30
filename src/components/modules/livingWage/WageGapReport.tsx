// ─────────────────────────────────────────────────────────────────────────────
// WageGapReport.tsx — Step 3: actual gross salary vs living wage.
// Pinned filters, status chips, column funnels, sort, department summary.
// Filters are owned by LivingWageManager (shared with print and Excel).
// Path: src/components/modules/livingWage/WageGapReport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  EMPTY_GAP_FILTERS, BLANK_VALUE, buildGapEntries, filterGapEntries, gapStats, departmentSummary, gapColumnValue,
  countActiveGapFilters, hasActiveGapFilters, empName, money,
} from './types';
import type { GapFilters, GapSortField } from './types';
import { font, CONTROL_H, inputStyle, th, td, mini } from './ui';

function HeaderFilter({ label, selected, getOptions, onChange }: { label: string; selected: string[]; getOptions: () => string[]; onChange: (s: string[]) => void }) {
  const NONE = '__none__';   // marker: "everything deselected" (matches no row)
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
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

  const active = selected.length > 0;
  const ticked = selected.filter(x => x !== NONE);                    // values actually chosen
  const options = open ? getOptions() : [];
  const shown = options.filter(o => o.toLowerCase().includes(query.trim().toLowerCase()));
  const effective = active ? ticked : options;                        // nothing selected = everything ticked
  const toggle = (v: string) => {
    const next = effective.includes(v) ? effective.filter(x => x !== v) : [...effective, v];
    if (next.length === 0) onChange([NONE]);                          // last tick removed → none selected
    else if (next.length === options.length) onChange([]);            // everything ticked → no filter
    else onChange(next);
  };
  const openPop = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 248)) });
    setQuery(''); setOpen(true);
  };

  return (
    <>
      <button ref={btnRef} type="button" aria-label={`Filter ${label}`} title="Filter" onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPop(); }} style={mini(active)}>
        ⏷{active && <span style={{ fontSize: 9, marginLeft: 2 }}>{ticked.length}</span>}
      </button>
      {open && (
        <div ref={popRef} role="dialog" aria-label={`Filter ${label}`} style={{ position: 'fixed', top: pos.top, left: pos.left, width: 240, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font, boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" style={{ ...inputStyle, marginBottom: 8, fontWeight: 400 }} />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />{o}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <span style={{ display: 'inline-flex', gap: 10 }}>
              <button type="button" disabled={!active} onClick={() => onChange([])} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: active ? '#2563eb' : '#cbd5e1', cursor: active ? 'pointer' : 'default' }}>Select all</button>
              <button type="button" disabled={ticked.length === 0 && active} onClick={() => onChange([NONE])} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: ticked.length === 0 && active ? '#cbd5e1' : '#b91c1c', cursor: ticked.length === 0 && active ? 'default' : 'pointer' }}>Deselect all</button>
            </span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

interface Props {
  employees: DbRecord[];
  livingWage: number;
  isLoading: boolean;
  filters: GapFilters;
  datasetLabel: string;
  onFiltersChange: (f: GapFilters) => void;
}

const COLS: { key: string; label: string; w: number; field?: string; sort?: GapSortField }[] = [
  { key: 'sl', label: 'SL', w: 4 },
  { key: 'card', label: 'ID/Card No', w: 8, field: 'cardNo', sort: 'cardNo' },
  { key: 'name', label: 'Name', w: 17, sort: 'name' },
  { key: 'desig', label: 'Designation', w: 15, field: 'designation' },
  { key: 'dept', label: 'Department', w: 14, field: 'department' },
  { key: 'gross', label: 'Gross salary', w: 10, sort: 'salary' },
  { key: 'lw', label: 'Living wage', w: 10 },
  { key: 'gap', label: 'Gap', w: 13, sort: 'gap' },
  { key: 'status', label: 'Status', w: 9 },
];

export default function WageGapReport({ employees, livingWage, isLoading, filters, datasetLabel, onFiltersChange }: Props) {
  const [toolbarH, setToolbarH] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const setFilter = (p: Partial<GapFilters>) => onFiltersChange({ ...filters, ...p });

  const entries  = useMemo(() => buildGapEntries(employees, livingWage), [employees, livingWage]);
  const filtered = useMemo(() => filterGapEntries(entries, filters), [entries, filters]);
  const stats    = useMemo(() => gapStats(filtered), [filtered]);
  const depts    = useMemo(() => departmentSummary(filtered), [filtered]);
  const statusCounts = useMemo(() => {
  const base = filterGapEntries(entries, { ...filters, status: [] });
    return { total: base.length, below: base.filter(e => !e.gap.meetsLivingWage).length, meets: base.filter(e => e.gap.meetsLivingWage).length };
  }, [entries, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterGapEntries(entries, { ...filters, columns: cols }).map(e => gapColumnValue(e, field)))).sort();
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: GapSortField) => {
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

  useLayoutEffect(() => {
    const measure = () => setToolbarH(toolbarRef.current?.offsetHeight ?? 0);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro && toolbarRef.current) ro.observe(toolbarRef.current);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  if (isLoading) return <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8', fontFamily: font }}>Loading employee wage data...</div>;

  const active = countActiveGapFilters(filters);
  const cur = filters.sort ?? { field: '', dir: 'asc' };
  const thS = { ...th, position: 'sticky' as const, top: toolbarH, zIndex: 2 };
  const metric = (label: string, value: string, color = '#1e3a5f') => (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: font }}>{value}</div>
    </div>
  );
  const chip = (on: boolean, color: string, bg: string): React.CSSProperties => ({
    padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
    border: `1px solid ${on ? color : '#e2e8f0'}`, background: on ? bg : '#fff', color: on ? color : '#475569',
  });
  const headCell = (c: typeof COLS[number]) => {
    if (!c.field && !c.sort) return c.label;
    const sorted = c.sort && cur.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {c.sort && <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.sort!)} style={mini(Boolean(sorted))}>{sorted ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
          {c.field && <HeaderFilter label={c.label} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumn(c.field!, s)} />}
        </span>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
        {metric('Living wage (Tk)', money(livingWage))}
        {metric('Average gross salary', money(stats.avgActual))}
        {metric('Median gross salary', money(stats.median))}
        {metric('Below living wage', `${stats.below} / ${stats.n}`, stats.below ? '#b91c1c' : '#15803d')}
        {metric('Average gap', `${stats.avgGapPct.toFixed(1)}%`, stats.avgGapPct > 0 ? '#b91c1c' : '#15803d')}
        {metric('Cost to close gap / month', money(stats.shortfallTotal), stats.shortfallTotal ? '#b91c1c' : '#15803d')}
      </div>

      {depts.length > 1 && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: font, minWidth: 520 }}>
            <thead><tr>{['Department', 'Employees', 'Avg. gross', 'Below', 'Avg. gap'].map(h => <th key={h} style={{ ...th, boxShadow: 'none', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
            <tbody>{depts.map(d => (
              <tr key={d.department}>
                <td style={td}>{d.department}</td><td style={td}>{d.count}</td><td style={td}>{money(d.avgGross)}</td>
                <td style={{ ...td, color: d.below ? '#b91c1c' : '#15803d', fontWeight: 600 }}>{d.below}</td>
                <td style={td}>{d.avgGapPct.toFixed(1)}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)', padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search name / designation / department / card" autoComplete="off"
          style={{ ...inputStyle, flex: 1, minWidth: 220, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
        <button type="button" aria-pressed={!filters.status.length} onClick={() => setFilter({ status: [] })} style={chip(!filters.status.length, '#1e3a5f', '#e0e7ff')}>All {statusCounts.total}</button>
        <button type="button" aria-pressed={filters.status.includes('below')} onClick={() => setFilter({ status: filters.status.includes('below') ? filters.status.filter(x => x !== 'below') : [...filters.status, 'below'] })} style={chip(filters.status.includes('below'), '#b91c1c', '#fee2e2')}>Below {statusCounts.below}</button>
        <button type="button" aria-pressed={filters.status.includes('meets')} onClick={() => setFilter({ status: filters.status.includes('meets') ? filters.status.filter(x => x !== 'meets') : [...filters.status, 'meets'] })} style={chip(filters.status.includes('meets'), '#166534', '#dcfce7')}>Meets {statusCounts.meets}</button>
        {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_GAP_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {entries.length} with wage data · {datasetLabel}</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
        <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
        <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 28 }}>
              <div style={{ fontWeight: 600, marginBottom: hasActiveGapFilters(filters) ? 8 : 0 }}>No employee wage data to compare</div>
              {hasActiveGapFilters(filters) && <button type="button" onClick={() => onFiltersChange(EMPTY_GAP_FILTERS)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear Filters</button>}
            </td></tr>
          )}
          {filtered.map(({ emp, gap }, index) => {
            const r = emp as unknown as Record<string, unknown>;
            const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
            return (
              <tr key={String(r.id ?? index)}>
                <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                <td style={{ ...td, ...wrap }}>{String(r.cardNo ?? '') || '—'}</td>
                <td style={{ ...td, ...wrap, fontWeight: 600 }}>{empName(emp)}</td>
                <td style={{ ...td, ...wrap }}>{String(r.designation ?? '') || '—'}</td>
                <td style={{ ...td, ...wrap }}>{String(r.department ?? '') || '—'}</td>
                <td style={td}>{money(gap.actualWage)}</td>
                <td style={td}>{money(gap.livingWage)}</td>
                <td style={{ ...td, color: gap.gapAmount > 0 ? '#b91c1c' : '#15803d', fontWeight: 600 }}>{gap.gapAmount > 0 ? '−' : '+'}{money(Math.abs(gap.gapAmount))} ({gap.gapPercent.toFixed(1)}%)</td>
                <td style={td}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: gap.meetsLivingWage ? '#dcfce7' : '#fee2e2', color: gap.meetsLivingWage ? '#166534' : '#b91c1c' }}>{gap.meetsLivingWage ? '✓ Meets' : '⚠ Below'}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: 'none' }}>{BLANK_VALUE}</div>
    </div>
  );
}