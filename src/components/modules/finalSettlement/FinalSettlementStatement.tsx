// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementStatement.tsx — every saved settlement: KPI cards, pinned filters, status chips,
// date range, column funnels (Select all / Deselect all), sort, and row actions.
// Filters are owned by FinalSettlement.tsx so Print, PDF and Excel follow what you see.
// Path: src/components/modules/finalSettlement/FinalSettlementStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { SettlementRow, SettlementFilters, SettlementSortField } from './settlementModel';
import {
  EMPTY_SETTLEMENT_FILTERS, STATUS_COLORS, filterRows, summarize, columnValue, countActiveFilters, formatDMY, money,
} from './settlementModel';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import HeaderFilter from '../livingWage/HeaderFilter';
import { font, CONTROL_H, inputStyle, th, td, mini } from '../livingWage/ui';

interface Col { key: string; label: string; w: number; sort?: SettlementSortField; field?: string }
const COLS: Col[] = [
  { key: 'sl', label: 'SL', w: 3 },
  { key: 'cardNo', label: 'Card No', w: 7, sort: 'cardNo', field: 'cardNo' },
  { key: 'name', label: 'Name', w: 12, sort: 'name' },
  { key: 'designation', label: 'Designation', w: 8, field: 'designation' },
  { key: 'section', label: 'Section', w: 7, field: 'section' },
  { key: 'termination', label: 'Settlement type', w: 12, field: 'termination' },
  { key: 'date', label: 'Settlement date', w: 8, sort: 'settlementDate' },
  { key: 'service', label: 'Service', w: 8 },
  { key: 'receivable', label: 'Payable (A)', w: 7 },
  { key: 'deductions', label: 'Deduction (B)', w: 6 },
  { key: 'net', label: 'Net payable', w: 7, sort: 'net' },
  { key: 'status', label: 'Payment', w: 6 },
  { key: 'actions', label: '', w: 9 },
];
const NARROW_PX = 1100;
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

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
  const [toolbarH, setToolbarH]   = useState(0);
  const [narrow, setNarrow]       = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const setFilter = (p: Partial<SettlementFilters>) => onFiltersChange({ ...filters, ...p });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const all = useMemo(() => summarize(rows), [rows]);
  const statusCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, status: [] });
    return { total: base.length, Pending: base.filter(r => r.status === 'Pending').length, Paid: base.filter(r => r.status === 'Paid').length };
  }, [rows, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: SettlementSortField) => {
    const cur = filters.sort;
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

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
  const kpi = (label: string, value: string, color = '#1e3a5f') => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontFamily: font }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: font }}>{value}</div>
    </div>
  );
  const toggleStatus = (v: string) => setFilter({ status: filters.status.includes(v) ? filters.status.filter(x => x !== v) : [...filters.status, v] });

  const headCell = (c: Col) => {
    if (!c.sort && !c.field) return c.label;
    const sorted = c.sort && filters.sort.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {c.sort && <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.sort!)} style={mini(Boolean(sorted))}>{sorted ? (filters.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
          {c.field && <HeaderFilter label={c.label} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumn(c.field!, s)} />}
        </span>
      </div>
    );
  };

  const actions = (r: SettlementRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 7 }}>
      <button type="button" onClick={() => onBill(r.id)} title="Open payment bill" aria-label={`Bill of ${r.name}`} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: 0 }}>🖨</button>
      {r.status === 'Pending' && <button type="button" onClick={() => onMarkPaid(r.id)} title="Mark as paid" aria-label={`Mark ${r.name} paid`} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 700 }}>✓</button>}
      <button type="button" onClick={() => onEdit(r.id)} title="Edit" aria-label={`Edit ${r.name}`} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
      <button type="button" onClick={() => setConfirmId(r.id)} title="Delete" aria-label={`Delete ${r.name}`} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}>🗑</button>
    </span>
  );

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
        {kpi('Settlements', String(sum.count))}
        {kpi('Total net payable', money(sum.totalNet), '#047857')}
        {kpi('Pending', `${sum.pendingCount} · ${money(sum.pendingAmount)}`, sum.pendingCount ? '#92400e' : '#15803d')}
        {kpi('Paid', `${sum.paidCount} · ${money(sum.paidAmount)}`, '#15803d')}
        {kpi('Payable (A) / Deduction (B)', `${money(sum.totalReceivable)} / ${money(sum.totalDeductions)}`)}
      </div>

      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)' }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
          <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New settlement</button>
        </div>
        {conflict && <div role="alert" style={{ padding: '0 14px 4px', fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: font }}>“From” is after “to” — nothing can match.</div>}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={filters.status.length === 0} onClick={() => setFilter({ status: [] })} style={chip(filters.status.length === 0, '#1e3a5f', '#e0e7ff')}>All {statusCounts.total}</button>
          {(['Pending', 'Paid'] as const).map(s => (
            <button key={s} type="button" aria-pressed={filters.status.includes(s)} onClick={() => toggleStatus(s)} style={chip(filters.status.includes(s), STATUS_COLORS[s].color, STATUS_COLORS[s].bg)}>{s} {statusCounts[s]}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {all.count} settlements</span>
        </div>
      </div>

      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? 1250 : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>
                {rows.length === 0 ? 'No settlements saved yet — use “+ New settlement”.' : 'No settlements match the current filters'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const st = STATUS_COLORS[r.status || 'None'];
              return (
                <tr key={r.id || i}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600, boxShadow: r.net < 0 ? 'inset 3px 0 0 #dc2626' : r.status === 'Pending' ? 'inset 3px 0 0 #f59e0b' : undefined }}>{i + 1}</td>
                  <td style={{ ...td, ...wrap }}>{r.cardNo || '—'}</td>
                  <td style={{ ...td, ...wrap, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ ...td, ...wrap }}>{r.designation || '—'}</td>
                  <td style={{ ...td, ...wrap }}>{r.section || '—'}</td>
                  <td style={{ ...td, ...wrap }}>{r.termination || '—'}</td>
                  <td style={td}>{formatDMY(r.settlementDate) || '—'}</td>
                  <td style={{ ...td, ...wrap }}>{r.service}<div style={{ fontSize: 10.5, color: '#64748b' }}>benefit {r.benefitYears} yr</div></td>
                  <td style={td}>{money(r.receivable)}</td>
                  <td style={td}>{money(r.deductions)}</td>
                  <td style={{ ...td, fontWeight: 700, color: r.net < 0 ? '#b91c1c' : '#047857' }}>{money(r.net)}</td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                    {r.status === 'Paid' && r.paymentDate && <div style={{ fontSize: 10.5, color: '#64748b' }}>{formatDMY(r.paymentDate)}</div>}
                  </td>
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