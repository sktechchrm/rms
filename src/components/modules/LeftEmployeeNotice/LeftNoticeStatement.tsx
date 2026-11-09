// ─────────────────────────────────────────────────────────────────────────────
// LeftNoticeStatement.tsx — every saved absent-worker record, laid out like the Final Settlement statement:
// KPI cards · pinned search / absence-date range / "+ New" · stage chips with live counts ·
// column funnels (Select all / Deselect all) · ▲▼ sort · letter dates with
// "N দিন বাকি / আজ / N দিন আগে" · row actions (open letter · edit · delete with inline confirm).
// Filters are owned by the Manager so Print, PDF and Excel follow what you see.
// Path: src/components/modules/LeftEmployeeNotice/LeftNoticeStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { NoticeRow, NoticeFilters, NoticeSortField, NoticeStep, Stage } from './leftNoticeModel';
import {
  EMPTY_NOTICE_FILTERS, STAGE_STYLE, SOON_DAYS, NOTICE_RULES, filterRows, summarize, columnValue, countActiveFilters, formatDMY,
} from './leftNoticeModel';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import HeaderFilter from '../livingWage/HeaderFilter';
import { font, CONTROL_H, inputStyle, th, td, mini } from '../livingWage/ui';

interface Col { key: string; label: string; sub?: string; w: number; sort?: NoticeSortField; field?: string }
const COLS: Col[] = [
  { key: 'sl',      label: 'SL', w: 3 },
  { key: 'cardNo',  label: 'Card No', w: 8, sort: 'cardNo', field: 'cardNo' },
  { key: 'info',    label: 'Employee Info', sub: 'Name · Designation · Section', w: 17, sort: 'name', field: 'section' },
  { key: 'absence', label: 'অনুপস্থিত শুরু', sub: 'ও মোট দিন', w: 10, sort: 'absence' },
  { key: 'n1',      label: 'পত্র নং-১', sub: `অনুপস্থিতির ${NOTICE_RULES.first} কর্মদিবস পর`, w: 11 },
  { key: 'n2',      label: 'পত্র নং-২', sub: `পত্র-১ এর ${NOTICE_RULES.second} কর্মদিবস পর`, w: 11 },
  { key: 'n3',      label: 'পত্র নং-৩ (চূড়ান্ত)', sub: `পত্র-২ এর ${NOTICE_RULES.third} কর্মদিবস পর`, w: 12 },
  { key: 'stage',   label: 'অবস্থা', w: 12 },
  { key: 'actions', label: '', w: 8 },
];
const NARROW_PX = 1050;
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const subStyle: React.CSSProperties = { fontSize: 10.5, color: '#64748b', fontWeight: 400, lineHeight: 1.3 };

interface Props {
  rows: NoticeRow[];
  filters: NoticeFilters;
  onFiltersChange: (f: NoticeFilters) => void;
  onEdit: (id: string) => void;
  onLetter: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/** One letter date with how far away it is. */
function StepCell({ s, final }: { s: NoticeStep; final?: boolean }) {
  if (!s.date) return <span style={{ color: '#94a3b8' }}>—</span>;
  const d = s.daysLeft as number;
  const today = d === 0, past = d < 0, soon = d > 0 && d <= SOON_DAYS;
  return (
    <>
      <div style={{ fontWeight: 700, color: today ? '#b91c1c' : soon ? '#c2410c' : past ? (final ? '#b91c1c' : '#1e293b') : '#1e293b' }}>{formatDMY(s.date)}</div>
      {today && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b91c1c' }}>আজ ইস্যুযোগ্য</div>}
      {soon && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#c2410c' }}>{d} দিন বাকি</div>}
      {past && <div style={subStyle}>{-d} দিন আগে</div>}
      {d > SOON_DAYS && <div style={subStyle}>{d} দিন বাকি</div>}
    </>
  );
}

export default function LeftNoticeStatement({ rows, filters, onFiltersChange, onEdit, onLetter, onDelete, onAdd }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toolbarH, setToolbarH]   = useState(0);
  const [narrow, setNarrow]       = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const setFilter = (p: Partial<NoticeFilters>) => onFiltersChange({ ...filters, ...p });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const stageCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, stage: [] });
    const c: Record<Stage, number> = { Waiting: 0, N1: 0, N2: 0, Final: 0 };
    base.forEach(r => { c[r.stage]++; });
    return { total: base.length, c };
  }, [rows, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, s: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: s } });
  const cycleSort = (field: NoticeSortField) => {
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
  // KPI tile: soft tint + small dot in the tone colour, no heavy borders or shadows.
  const TINT: Record<string, { bg: string; bd: string }> = {
    '#1e3a5f': { bg: '#f1f5fb', bd: '#dbe5f3' }, '#475569': { bg: '#f8fafc', bd: '#e2e8f0' }, '#92400e': { bg: '#fffbeb', bd: '#fde9b0' },
    '#b91c1c': { bg: '#fef2f2', bd: '#fbd5d5' }, '#15803d': { bg: '#f0fdf4', bd: '#cdeed8' },
  };
  const kpi = (label: string, value: string, color = '#1e3a5f') => {
    const tone = TINT[color] ?? TINT['#1e3a5f'];
    return (
      <div style={{ background: tone.bg, border: `1px solid ${tone.bd}`, borderRadius: 10, padding: '9px 14px', flex: 1, minWidth: 130 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', fontFamily: font, fontWeight: 600 }}>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: 'none' }} />{label}
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color, fontFamily: font, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25, marginTop: 1 }}>{value}</div>
      </div>
    );
  };
  const toggleStage = (v: string) => setFilter({ stage: filters.stage.includes(v) ? filters.stage.filter(x => x !== v) : [...filters.stage, v] });

  const headCell = (c: Col) => {
    const sorted = c.sort && filters.sort.field === c.sort;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}{c.sub && <div style={subStyle}>{c.sub}</div>}</span>
        {(c.sort || c.field) && (
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            {c.field && <HeaderFilter label={c.label} selected={filters.columns?.[c.field] ?? []} getOptions={() => columnOptions(c.field!)} onChange={s => setColumn(c.field!, s)} />}
            {c.sort && <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(c.sort!)} style={mini(Boolean(sorted))}>{sorted ? (filters.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>}
          </span>
        )}
      </div>
    );
  };

  const actions = (r: NoticeRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <button type="button" onClick={() => onLetter(r.id)} title="বর্তমান পর্যায়ের পত্র খুলুন" aria-label={`Letter of ${r.name}`} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, padding: 0 }}>🖨</button>
      <button type="button" onClick={() => onEdit(r.id)} title="সম্পাদনা" aria-label={`Edit ${r.name}`} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, padding: 0 }}>✎</button>
      <button type="button" onClick={() => setConfirmId(r.id)} title="মুছুন" aria-label={`Delete ${r.name}`} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, padding: 0 }}>🗑</button>
    </span>
  );

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <style>{`.ln-row:hover td{background:#f4f8ff}`}</style>
      <div style={{ padding: '12px 14px 4px', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e3a5f', fontFamily: font }}>অনুপস্থিত কর্মীর নোটিশ তালিকা</h3>
        <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>প্রতিটি রেকর্ড এখন কোন পত্রের পর্যায়ে আছে</span>
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {kpi('Records', String(sum.count))}
        {kpi('অপেক্ষমান', String(sum.waiting), '#475569')}
        {kpi('পত্র-১ / পত্র-২ পর্যায়', `${sum.n1} / ${sum.n2}`, sum.n1 + sum.n2 ? '#92400e' : '#15803d')}
        {kpi('চূড়ান্ত (ইস্তফা গণ্য)', String(sum.final), sum.final ? '#b91c1c' : '#15803d')}
        {kpi('আজ ইস্যুযোগ্য পত্র', String(sum.dueToday), sum.dueToday ? '#b91c1c' : '#15803d')}
      </div>

      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 230 }}>
            <label htmlFor="ln-q" style={lbl}>Search (name / card no / designation / section / father)</label>
            <input id="ln-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
              style={{ ...inputStyle, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
          </div>
          {([['Absent from — from', 'dateFrom'], ['Absent from — to', 'dateTo']] as const).map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <DateFieldDMY value={filters[key]} onChange={v => setFilter({ [key]: v } as Partial<NoticeFilters>)} ariaLabel={label} clearable invalid={conflict}
                min={key === 'dateTo' ? filters.dateFrom || undefined : undefined} max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                boxStyle={{ ...inputStyle, minWidth: 150, height: CONTROL_H, background: filters[key] ? '#eff6ff' : '#fff', borderColor: conflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1' }} />
            </div>
          ))}
          {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_NOTICE_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
          <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New record</button>
        </div>
        {conflict && <div role="alert" style={{ padding: '0 14px 4px', fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: font }}>“From” is after “to” — nothing can match.</div>}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={filters.stage.length === 0} onClick={() => setFilter({ stage: [] })} style={chip(filters.stage.length === 0, '#1e3a5f', '#e0e7ff')}>সব {stageCounts.total}</button>
          {(['Waiting', 'N1', 'N2', 'Final'] as const).map(s => (
            <button key={s} type="button" aria-pressed={filters.stage.includes(s)} onClick={() => toggleStage(s)} style={chip(filters.stage.includes(s), STAGE_STYLE[s].color, STAGE_STYLE[s].bg)}>{STAGE_STYLE[s].label} {stageCounts.c[s]}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {rows.length} records</span>
        </div>
      </div>

      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? 1150 : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>
                {rows.length === 0 ? 'এখনো কোনো রেকর্ড নেই — “+ New record” চাপুন, অথবা এন্ট্রি ফর্মের “Excel থেকে ইমপোর্ট” দিয়ে একসাথে অনেক রেকর্ড যোগ করুন।' : 'বর্তমান ফিল্টারে কোনো রেকর্ড মেলেনি'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const st = STAGE_STYLE[r.stage];
              return (
                <tr key={r.id || i} className="ln-row">
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ ...td, ...wrap }}>{r.cardNo || '—'}</td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>{r.designation || '—'}</div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>{r.section || '—'}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{formatDMY(r.absence) || '—'}</div>
                    {r.daysAbsent !== null && r.daysAbsent >= 0 && <div style={{ ...subStyle, color: r.daysAbsent >= 10 ? '#b91c1c' : '#64748b', fontWeight: r.daysAbsent >= 10 ? 700 : 400 }}>{r.daysAbsent} দিন অনুপস্থিত</div>}
                  </td>
                  <td style={td}><StepCell s={r.n1} /></td>
                  <td style={td}><StepCell s={r.n2} /></td>
                  <td style={td}><StepCell s={r.n3} final /></td>
                  <td style={td}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>● {st.label}</span></td>
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