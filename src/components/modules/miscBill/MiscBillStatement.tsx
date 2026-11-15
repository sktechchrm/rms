// ─────────────────────────────────────────────────────────────────────────────
// MiscBillStatement.tsx — every saved bill: summary cards, pinned search / date range / "+ New bill",
// template chips with live counts, column funnels (Select all / Deselect all), ▲▼ sort, and row actions
// (preview · edit · delete with inline confirm). Filters are owned by the Manager, so Print, PDF and Excel
// follow exactly what is on screen.
// Path: src/components/modules/miscBill/MiscBillStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { BillRow, BillFilters, BillSortField } from './miscBillModel';
import { EMPTY_BILL_FILTERS, filterRows, summarize, columnValue, countActiveFilters, formatDMY, money } from './miscBillModel';
import type { MiscBillTemplate } from './types';
import { TEMPLATE_OPTIONS } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import HeaderFilter from '../livingWage/HeaderFilter';
import { font, CONTROL_H, inputStyle, th, td, mini } from '../livingWage/ui';

interface Col { key: string; label: string; w: number; sort?: BillSortField; field?: string }
const COLS: Col[] = [
  { key: 'sl',       label: 'SL', w: 4 },
  { key: 'date',     label: 'Bill Date', w: 10, sort: 'date' },
  { key: 'template', label: 'Template', w: 14, field: 'templateLabel' },
  { key: 'subject',  label: 'Subject', w: 24, sort: 'subject' },
  { key: 'entries',  label: 'Entries', w: 8 },
  { key: 'total',    label: 'Grand Total (Tk)', w: 13, sort: 'total' },
  { key: 'by',       label: 'Prepared By', w: 13, field: 'preparedBy' },
  { key: 'actions',  label: '', w: 14 },
];
const NARROW_PX = 1000;
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const subStyle: React.CSSProperties = { fontSize: 10.5, color: '#64748b', fontWeight: 400, lineHeight: 1.3 };

const TEMPLATE_COLOR: Record<MiscBillTemplate, { bg: string; color: string }> = {
  holiday:    { bg: '#dbeafe', color: '#1d4ed8' },
  festival:   { bg: '#ede9fe', color: '#6d28d9' },
  adjustment: { bg: '#fef3c7', color: '#92400e' },
};

interface Props {
  rows: BillRow[];
  filters: BillFilters;
  onFiltersChange: (f: BillFilters) => void;
  onPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export default function MiscBillStatement({ rows, filters, onFiltersChange, onPreview, onEdit, onDelete, onAdd }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toolbarH, setToolbarH]   = useState(0);
  const [narrow, setNarrow]       = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const setFilter = (p: Partial<BillFilters>) => onFiltersChange({ ...filters, ...p });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const tplCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, templates: [] });
    const c: Record<string, number> = { holiday: 0, festival: 0, adjustment: 0 };
    base.forEach(r => { c[r.template]++; });
    return { total: base.length, c };
  }, [rows, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field))))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, s: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: s } });
  const cycleSort = (field: BillSortField) => {
    const cur = filters.sort;
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };
  const toggleTemplate = (v: string) => setFilter({ templates: filters.templates.includes(v) ? filters.templates.filter(x => x !== v) : [...filters.templates, v] });

  useLayoutEffect(() => {
    const measure = () => { setToolbarH(toolbarRef.current?.offsetHeight ?? 0); setNarrow((rootRef.current?.clientWidth ?? NARROW_PX) < NARROW_PX); };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) { if (toolbarRef.current) ro.observe(toolbarRef.current); if (rootRef.current) ro.observe(rootRef.current); }
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const active = countActiveFilters(filters);
  const conflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const thS = narrow ? th : { ...th, position: 'sticky' as const, top: toolbarH, zIndex: 2 };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 };
  const chip = (on: boolean, fg: string, bg: string): React.CSSProperties => ({
    padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
    border: `1px solid ${on ? fg : '#e2e8f0'}`, background: on ? bg : '#fff', color: on ? fg : '#475569',
  });
  const kpi = (label: string, value: string, color = '#1e3a5f', sub?: string) => (
    <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11.5, color: '#475569', fontFamily: font, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: font }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font }}>{sub}</div>}
    </div>
  );

  const headCell = (c: Col) => {
    const sorted = c.sort && filters.sort.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        {(c.sort || c.field) && (
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            {c.field && <HeaderFilter label={c.label} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumn(c.field!, s)} />}
            {c.sort && <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.sort!)} style={mini(Boolean(sorted))}>{sorted ? (filters.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
          </span>
        )}
      </div>
    );
  };

  const actions = (r: BillRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <button type="button" onClick={() => onPreview(r.id)} title="Open bill preview" aria-label={`Preview ${r.subject}`} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: 0 }}>🖨</button>
      <button type="button" onClick={() => onEdit(r.id)} title="Edit" aria-label={`Edit ${r.subject}`} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
      <button type="button" onClick={() => setConfirmId(r.id)} title="Delete" aria-label={`Delete ${r.subject}`} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}>🗑</button>
    </span>
  );

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {kpi('Bills', String(sum.bills), '#1e3a5f', `${sum.entries} entries`)}
        {kpi('Grand total (Tk)', money(sum.total), '#047857')}
        {kpi('Holiday Bill', money(sum.holiday.total), '#1d4ed8', `${sum.holiday.count} bill(s)`)}
        {kpi('Festival Holiday', money(sum.festival.total), '#6d28d9', `${sum.festival.count} bill(s)`)}
        {kpi('Adjustment', money(sum.adjustment.total), '#92400e', `${sum.adjustment.count} bill(s)`)}
      </div>

      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)' }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 230 }}>
            <label htmlFor="mb-q" style={lbl}>Search (subject / employee / card no / department)</label>
            <input id="mb-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
              style={{ ...inputStyle, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
          </div>
          {([['Bill date — from', 'dateFrom'], ['Bill date — to', 'dateTo']] as const).map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <DateFieldDMY value={filters[key]} onChange={v => setFilter({ [key]: v } as Partial<BillFilters>)} ariaLabel={label} clearable invalid={conflict}
                min={key === 'dateTo' ? filters.dateFrom || undefined : undefined} max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                boxStyle={{ ...inputStyle, minWidth: 150, height: CONTROL_H, background: filters[key] ? '#eff6ff' : '#fff', borderColor: conflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1' }} />
            </div>
          ))}
          {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_BILL_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
          <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New bill</button>
        </div>
        {conflict && <div role="alert" style={{ padding: '0 14px 4px', fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: font }}>“From” is after “to” — nothing can match.</div>}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={filters.templates.length === 0} onClick={() => setFilter({ templates: [] })} style={chip(filters.templates.length === 0, '#1e3a5f', '#e0e7ff')}>All {tplCounts.total}</button>
          {TEMPLATE_OPTIONS.map(o => (
            <button key={o.value} type="button" aria-pressed={filters.templates.includes(o.value)} onClick={() => toggleTemplate(o.value)}
              style={chip(filters.templates.includes(o.value), TEMPLATE_COLOR[o.value].color, TEMPLATE_COLOR[o.value].bg)}>
              {o.label} {tplCounts.c[o.value]}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {rows.length} bills</span>
        </div>
      </div>

      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? 1000 : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>
                {rows.length === 0 ? 'No bills saved yet — click “+ New bill”.' : 'No bills match the current filters'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const tc = TEMPLATE_COLOR[r.template];
              return (
                <tr key={r.id || i}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                  <td style={td}>{formatDMY(r.date) || '—'}</td>
                  <td style={td}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tc.bg, color: tc.color, whiteSpace: 'nowrap' }}>{r.templateLabel}</span></td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 600 }}>{r.subject || '—'}</div>
                    {r.items[0] && <div style={subStyle}>{r.items.length > 1 ? `${r.items[0].name || '—'} + ${r.items.length - 1} more` : r.items[0].name || '—'}</div>}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}>{r.entries}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#047857', textAlign: 'right' }}>{money(r.total)}</td>
                  <td style={{ ...td, ...wrap }}>{r.preparedBy || '—'}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{actions(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
