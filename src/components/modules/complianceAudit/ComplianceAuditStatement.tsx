// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditStatement.tsx — saved audits: pinned filters, column funnels, sort.
// Path: src/components/modules/complianceAudit/ComplianceAuditStatement.tsx
// Filters are owned by ComplianceAuditManager (shared filterAuditEntries).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS, EMPTY_AUDIT_FILTERS, BLANK_VALUE,
  buildAuditEntries, filterAuditEntries, countActiveAuditFilters, hasActiveAuditFilters, auditColumnValue, formatDMY,
  type AuditFilters, type AuditSortField,
} from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const H = 34;

const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 7, fontSize: 12.5, fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none' };
const thBase: React.CSSProperties = { padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font, color: '#374151', background: '#f8fafc', boxShadow: 'inset 0 -1px 0 #e2e8f0', textAlign: 'left', verticalAlign: 'bottom' };
const tdS: React.CSSProperties = { padding: '8px 10px', fontSize: 12.5, fontFamily: font, color: '#1e293b', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'anywhere' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 };
const mini = (active: boolean): React.CSSProperties => ({
  flexShrink: 0, padding: '2px 5px', cursor: 'pointer', borderRadius: 5, fontSize: 11, fontWeight: 700,
  border: `1px solid ${active ? '#93c5fd' : 'transparent'}`, background: active ? '#dbeafe' : 'transparent', color: active ? '#1d4ed8' : '#64748b',
});

// ─── Column funnel ───────────────────────────────────────────────────────────

function HeaderFilter({ label, isDate, selected, getOptions, onChange }: {
  label: string; isDate: boolean; selected: string[]; getOptions: () => string[]; onChange: (s: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const show = (v: string) => (isDate && v !== BLANK_VALUE ? formatDMY(v) : v);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', close); };
  }, [open]);

  const active = selected.length > 0;
  const options = open ? getOptions() : [];
  const shown = options.filter(o => show(o).toLowerCase().includes(query.trim().toLowerCase()));
  const effective = active ? selected : options;
  const toggle = (v: string) => {
    const next = effective.includes(v) ? effective.filter(x => x !== v) : [...effective, v];
    onChange(next.length === 0 || next.length === options.length ? [] : next);
  };
  const openPop = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 248)) });
    setQuery(''); setOpen(true);
  };

  return (
    <>
      <button ref={btnRef} type="button" aria-label={`Filter ${label}`} title="Filter"
        onClick={e => { e.stopPropagation(); if (open) setOpen(false); else openPop(); }} style={mini(active)}>
        ⏷{active && <span style={{ fontSize: 9, marginLeft: 2 }}>{selected.length}</span>}
      </button>
      {open && (
        <div ref={popRef} role="dialog" aria-label={`Filter ${label}`} style={{ position: 'fixed', top: pos.top, left: pos.left, width: 240, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontFamily: font, boxShadow: '0 10px 30px -8px rgba(15,23,42,0.28)', textTransform: 'none' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8, fontWeight: 400 }} />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {shown.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 6, fontWeight: 400 }}>No values</div>}
            {shown.map(o => (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', fontSize: 12.5, fontWeight: 400, cursor: 'pointer' }}>
                <input type="checkbox" checked={effective.includes(o)} onChange={() => toggle(o)} />{show(o)}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <button type="button" disabled={!active} onClick={() => onChange([])} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: active ? '#2563eb' : '#cbd5e1', cursor: active ? 'pointer' : 'default' }}>Select all</button>
            <button type="button" onClick={() => setOpen(false)} style={{ background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

interface Col { key: string; label: string; w: number; field?: string; sort?: AuditSortField; date?: boolean }
const COLS: Col[] = [
  { key: 'sl', label: 'SL', w: 4 },
  { key: 'site', label: 'Site Name', w: 17, field: 'siteName', sort: 'siteName' },
  { key: 'company', label: 'Company', w: 17, field: 'companyName' },
  { key: 'type', label: 'অডিট ধরন', w: 14, field: 'auditType' },
  { key: 'round', label: 'Audit Round', w: 12, field: 'auditRound' },
  { key: 'date', label: 'Audit Date', w: 12, field: 'auditDate', sort: 'auditDate', date: true },
  { key: 'nc', label: 'NC', w: 6 },
  { key: 'actions', label: 'Actions', w: 18 },
];

interface Props {
  records: DbRecord[];
  filters?: AuditFilters;
  onFiltersChange?: (f: AuditFilters) => void;
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintOne: (rec: DbRecord) => void;
}

export default function ComplianceAuditStatement({ records, filters = EMPTY_AUDIT_FILTERS, onFiltersChange = () => {}, onEdit, onDelete, onPrintOne }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toolbarH, setToolbarH] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const setFilter = (patch: Partial<AuditFilters>) => onFiltersChange({ ...filters, ...patch });
  const entries = useMemo(() => buildAuditEntries(records), [records]);
  const filtered = useMemo(() => filterAuditEntries(entries, filters), [entries, filters]);

  const typeCounts = useMemo(() => {
    const base = filterAuditEntries(entries, { ...filters, types: [] });
    const counts: Record<string, number> = {};
    for (const e of base) counts[String(e.rec.auditType ?? '')] = (counts[String(e.rec.auditType ?? '')] ?? 0) + 1;
    return { counts, total: base.length };
  }, [entries, filters]);

  const totalNc = filtered.reduce((s, e) => s + e.ncCount, 0);
  const activeCount = countActiveAuditFilters(filters);
  const rangeConflict = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    const base = filterAuditEntries(entries, { ...filters, columns: cols });
    return Array.from(new Set(base.map(e => auditColumnValue(e.rec, field)))).sort();
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: AuditSortField) => {
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

  const thS: React.CSSProperties = { ...thBase, position: 'sticky', top: toolbarH, zIndex: 2 };
  const cur = filters.sort ?? { field: '', dir: 'asc' };

  const headCell = (c: Col) => {
    if (!c.field && !c.sort) return c.label;
    const sorted = c.sort && cur.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {c.sort && <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.sort!)} style={mini(Boolean(sorted))}>{sorted ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
          {c.field && <HeaderFilter label={c.label} isDate={Boolean(c.date)} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumn(c.field!, s)} />}
        </span>
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)' }}>
        <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="cas-q" style={lbl}>Search (Site / Company / NC ID / NC Ref)</label>
            <input id="cas-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
              style={{ ...inputStyle, width: '100%', height: H, boxSizing: 'border-box', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1', background: filters.search.trim() ? '#eff6ff' : '#fff' }} />
          </div>
          {([['Audit Date From', 'dateFrom'], ['Audit Date To', 'dateTo']] as const).map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <DateFieldDMY value={filters[key]} onChange={v => setFilter({ [key]: v } as Partial<AuditFilters>)} ariaLabel={label} invalid={rangeConflict} clearable
                min={key === 'dateTo' ? filters.dateFrom || undefined : undefined} max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                boxStyle={{ ...inputStyle, minWidth: 150, height: H, boxSizing: 'border-box', background: filters[key] ? '#eff6ff' : '#fff', borderColor: rangeConflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1' }} />
            </div>
          ))}
          <div>
            <label htmlFor="cas-round" style={lbl}>Audit Round</label>
            <select id="cas-round" value={filters.round} onChange={e => setFilter({ round: e.target.value })} style={{ ...inputStyle, height: H, boxSizing: 'border-box', minWidth: 130 }}>
              <option value="">All</option>
              {AUDIT_ROUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {activeCount > 0 && (
            <button type="button" onClick={() => onFiltersChange(EMPTY_AUDIT_FILTERS)} style={{ height: H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
              Clear Filters ({activeCount})
            </button>
          )}
        </div>
        {rangeConflict && <div role="alert" style={{ padding: '0 16px 6px', fontSize: 12, fontFamily: font, color: '#dc2626', fontWeight: 600 }}>Audit Date From is after Audit Date To — no audits can match.</div>}

        <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={filters.types.length === 0} onClick={() => setFilter({ types: [] })}
            style={{ padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer', border: `1px solid ${filters.types.length === 0 ? '#1e3a5f' : '#e2e8f0'}`, background: filters.types.length === 0 ? '#1e3a5f' : '#fff', color: filters.types.length === 0 ? '#fff' : '#475569' }}>
            All {typeCounts.total}
          </button>
          {AUDIT_CATEGORY_OPTIONS.map(t => {
            const on = filters.types.includes(t);
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => setFilter({ types: on ? filters.types.filter(x => x !== t) : [...filters.types, t] })}
                style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer', border: `1px solid ${on ? '#1d4ed8' : '#e2e8f0'}`, background: on ? '#dbeafe' : '#fff', color: on ? '#1d4ed8' : '#475569' }}>
                {t} <span style={{ fontWeight: 500 }}>{typeCounts.counts[t] ?? 0}</span>
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>
            {filtered.length} of {records.length} audits · {totalNc} NC
          </span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
        <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
        <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={COLS.length} style={{ ...tdS, textAlign: 'center', color: '#64748b', padding: 32 }}>
              <div style={{ fontWeight: 600, marginBottom: hasActiveAuditFilters(filters) ? 8 : 0 }}>কোনো অডিট পাওয়া যায়নি</div>
              {hasActiveAuditFilters(filters) && <button type="button" onClick={() => onFiltersChange(EMPTY_AUDIT_FILTERS)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear Filters</button>}
            </td></tr>
          )}
          {filtered.map(({ rec, ncCount }, index) => {
            const id = String(rec.id ?? '');
            const internal = rec.auditType === 'Internal';
            return (
              <tr key={id}>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                <td style={{ ...tdS, fontWeight: 600 }}>{String(rec.siteName ?? '') || '—'}</td>
                <td style={tdS}>{String(rec.companyName ?? '') || '—'}</td>
                <td style={tdS}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: internal ? '#dbeafe' : '#f3e8ff', color: internal ? '#1d4ed8' : '#7c3aed' }}>{String(rec.auditType ?? '') || '—'}</span></td>
                <td style={tdS}>{String(rec.auditRound ?? '') || '—'}</td>
                <td style={tdS}>{formatDMY(String(rec.auditDate ?? '').slice(0, 10)) || '—'}</td>
                <td style={tdS}>{ncCount}</td>
                <td style={tdS}>
                  {confirmId === id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11 }}>Sure?</span>
                      <button onClick={() => { onDelete(id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                      <button onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => onPrintOne(rec)} title="Open report" style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: 0 }}>🖨</button>
                      <button onClick={() => onEdit(rec)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
                      <button onClick={() => setConfirmId(id)} title="Delete" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}>🗑</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}