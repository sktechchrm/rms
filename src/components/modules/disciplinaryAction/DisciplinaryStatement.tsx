// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryStatement.tsx — every saved disciplinary case, laid out like the Left Notice / Final Settlement statements:
// KPI cards · pinned search / কারণ দর্শানোর তারিখের range / "+ New" · stage chips with live counts ·
// column headers: one ▾ per column (sort A→Z / Z→A and Select all inside it) · deadline cells with "N দিন বাকি / আজ / N দিন অতিক্রান্ত" ·
// row actions (open the matching notice · edit · delete with inline confirm).
// Filters are owned by the Manager so Print, PDF and Excel follow what you see.
// Path: src/components/modules/disciplinaryAction/DisciplinaryStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { CaseRow, CaseFilters, CaseSortField, DueStep, Stage } from './disciplinaryStatementModel';
import {
  EMPTY_CASE_FILTERS, STAGE_ORDER, STAGE_STYLE, SOON_DAYS, CASE_RULES, filterRows, summarize, columnValue, countActiveFilters, formatDMY,
} from './disciplinaryStatementModel';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import DisciplinaryHeaderFilter from './DisciplinaryHeaderFilter';
import { ShareRing } from './DisciplinaryStagePie';
import { font, CONTROL_H, inputStyle, th, td } from '../livingWage/ui';

interface Col { key: string; label: string; sub?: string; w: number; sort?: CaseSortField; field?: string }
const COLS: Col[] = [
  { key: 'sl',       label: 'SL', w: 3 },
  { key: 'cardNo',   label: 'Card No', w: 7, sort: 'cardNo', field: 'cardNo' },
  { key: 'info',     label: 'Employee Info', sub: 'Name · Designation · Section', w: 16, sort: 'name', field: 'section' },
  { key: 'showCause', label: 'কারণ দর্শানো', sub: 'সূত্র নং ও তারিখ', w: 11, sort: 'showCause' },
  { key: 'reply',    label: 'জবাব', sub: `সময়: ${CASE_RULES.replyWorkdays} কর্মদিবস`, w: 10 },
  { key: 'notices',  label: 'নোটিশ ২ / ৩', sub: 'মনোনয়ন · কমিটি', w: 10 },
  { key: 'enquiry',  label: 'তদন্ত সময়সীমা', sub: `${CASE_RULES.enquiryWorkdays} কর্মদিবস`, w: 11 },
  { key: 'outcome',  label: 'প্রতিবেদন ও শাস্তি', w: 12 },
  { key: 'stage',    label: 'অবস্থা', w: 12 },
  { key: 'actions',  label: '', w: 8 },
];
const NARROW_PX = 1100;
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const subStyle: React.CSSProperties = { fontSize: 10.5, color: '#64748b', fontWeight: 400, lineHeight: 1.3 };

interface Props {
  rows: CaseRow[];
  filters: CaseFilters;
  onFiltersChange: (f: CaseFilters) => void;
  onEdit: (id: string) => void;
  /** Open the printed notice that matches the case's current stage. */
  onNotice: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/** One deadline date with how far away it is. `final` = turn past dates red (a missed legal limit). */
function DueCell({ s, final }: { s: DueStep; final?: boolean }) {
  if (!s.date) return <span style={{ color: '#94a3b8' }}>—</span>;
  const d = s.daysLeft as number;
  const today = d === 0, past = d < 0, soon = d > 0 && d <= SOON_DAYS;
  return (
    <>
      <div style={{ fontWeight: 700, color: today ? '#b91c1c' : soon ? '#c2410c' : past && final ? '#b91c1c' : '#1e293b' }}>{formatDMY(s.date)}</div>
      {today && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b91c1c' }}>আজ শেষ</div>}
      {soon && <div style={{ fontSize: 10.5, fontWeight: 700, color: '#c2410c' }}>{d} দিন বাকি</div>}
      {past && <div style={{ ...subStyle, color: final ? '#b91c1c' : '#64748b', fontWeight: final ? 700 : 400 }}>{-d} দিন অতিক্রান্ত</div>}
      {d > SOON_DAYS && <div style={subStyle}>{d} দিন বাকি</div>}
    </>
  );
}

export default function DisciplinaryStatement({ rows, filters, onFiltersChange, onEdit, onNotice, onDelete, onAdd }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toolbarH, setToolbarH]   = useState(0);
  const [narrow, setNarrow]       = useState(false);
  const rootRef    = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const setFilter = (p: Partial<CaseFilters>) => onFiltersChange({ ...filters, ...p });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const sum = useMemo(() => summarize(filtered), [filtered]);
  const stageCounts = useMemo(() => {
    const base = filterRows(rows, { ...filters, stage: [] });
    const c = Object.fromEntries(STAGE_ORDER.map(s => [s, 0])) as Record<Stage, number>;
    base.forEach(r => { c[r.stage]++; });
    return { total: base.length, c };
  }, [rows, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterRows(rows, { ...filters, columns: cols }).map(r => columnValue(r, field)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, s: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: s } });

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
  const thS = narrow ? { ...th, whiteSpace: 'nowrap' as const } : { ...th, whiteSpace: 'nowrap' as const, position: 'sticky' as const, top: toolbarH, zIndex: 2 };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 };
  const chip = (on: boolean, fg: string, bg: string): React.CSSProperties => ({
    padding: '4px 11px', borderRadius: 16, fontSize: 12, fontWeight: 600, fontFamily: font, cursor: 'pointer',
    border: `1px solid ${on ? fg : '#e2e8f0'}`, background: on ? bg : '#fff', color: on ? fg : '#475569',
  });
  // KPI tile: soft tint + small dot in the tone colour, no heavy borders or shadows.
  const TINT: Record<string, { bg: string; bd: string }> = {
    '#1e3a5f': { bg: '#f1f5fb', bd: '#dbe5f3' }, '#475569': { bg: '#f8fafc', bd: '#e2e8f0' }, '#92400e': { bg: '#fffbeb', bd: '#fde9b0' },
    '#b91c1c': { bg: '#fef2f2', bd: '#fbd5d5' }, '#15803d': { bg: '#f0fdf4', bd: '#cdeed8' }, '#6d28d9': { bg: '#f5f3ff', bd: '#ddd6fe' },
  };
  const kpi = (label: string, value: string, color = '#1e3a5f') => {
    const tone = TINT[color] ?? TINT['#1e3a5f'];
    const n = Number(value) || 0;
    const share = sum.count ? (n / sum.count) * 100 : 0;
    return (
      <div style={{ background: tone.bg, border: `1px solid ${tone.bd}`, borderRadius: 10, padding: '9px 12px', flex: 1, minWidth: 170, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', fontFamily: font, fontWeight: 600 }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: color, flex: 'none' }} />{label}
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color, fontFamily: font, fontVariantNumeric: 'tabular-nums', lineHeight: 1.25, marginTop: 1 }}>{value}</div>
        </div>
        <ShareRing pct={share} color={color} />
      </div>
    );
  };
  const toggleStage = (v: string) => setFilter({ stage: filters.stage.includes(v) ? filters.stage.filter(x => x !== v) : [...filters.stage, v] });

  const headCell = (c: Col) => {
    const sorted = c.sort && filters.sort.field === c.sort ? filters.sort.dir : null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, whiteSpace: 'nowrap' }}>
        <span title={c.sub} style={{ whiteSpace: 'nowrap' }}>{c.label}</span>
        {(c.sort || c.field) && (
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>
            <DisciplinaryHeaderFilter
              label={c.label}
              selected={c.field ? (filters.columns?.[c.field] ?? []) : []}
              getOptions={() => (c.field ? columnOptions(c.field) : [])}
              onChange={sel => { if (c.field) setColumn(c.field, sel); }}
              sort={c.sort ? {
                active: sorted,
                onSort: dir => setFilter({ sort: dir ? { field: c.sort as CaseSortField, dir } : { field: '', dir: 'asc' } }),
              } : undefined}
            />
          </span>
        )}
      </div>
    );
  };

  const iconBtn = (color: string): React.CSSProperties => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 13, padding: 0 });
  const actions = (r: CaseRow) => confirmId === r.id ? (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11, whiteSpace: 'nowrap' }}>Sure?
      <button type="button" onClick={() => { onDelete(r.id); setConfirmId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
      <button type="button" onClick={() => setConfirmId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
    </span>
  ) : (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <button type="button" onClick={() => onNotice(r.id)} title="বর্তমান পর্যায়ের নোটিশ খুলুন" aria-label={`Notice of ${r.name}`} style={iconBtn('#475569')}>🖨</button>
      <button type="button" onClick={() => onEdit(r.id)} title="সম্পাদনা" aria-label={`Edit ${r.name}`} style={iconBtn('#2563eb')}>✎</button>
      <button type="button" onClick={() => setConfirmId(r.id)} title="মুছুন" aria-label={`Delete ${r.name}`} style={iconBtn('#dc2626')}>🗑</button>
    </span>
  );

  return (
    <div ref={rootRef} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <style>{`.da-row:hover td{background:#f4f8ff}`}</style>
      <div style={{ padding: '12px 14px 4px', display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e3a5f', fontFamily: font }}>শৃঙ্খলামূলক ব্যবস্থা — কেস তালিকা</h3>
        <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font }}>প্রতিটি কেস এখন কোন ধাপে আছে, সময়সীমা ও সিদ্ধান্তসহ</span>
      </div>
      <div style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        {kpi('Records', String(sum.count))}
        {kpi('জবাবের অপেক্ষায়', String(sum.reply), sum.reply ? '#92400e' : '#15803d')}
        {kpi('তদন্ত পর্যায়ে', String(sum.inEnquiry), sum.inEnquiry ? '#6d28d9' : '#15803d')}
        {kpi('সিদ্ধান্ত হয়েছে', String(sum.decided), '#15803d')}
        {kpi('সমাপ্ত', String(sum.closed), '#475569')}
        {kpi('মেয়াদোত্তীর্ণ', String(sum.overdue), sum.overdue ? '#b91c1c' : '#15803d')}
        {kpi(`${SOON_DAYS} দিনের মধ্যে শেষ`, String(sum.soon), sum.soon ? '#92400e' : '#15803d')}
      </div>

      <div ref={toolbarRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 230 }}>
            <label htmlFor="da-q" style={lbl}>Search (name / card no / ref no / designation / section / অভিযোগ)</label>
            <input id="da-q" value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search…" autoComplete="off"
              style={{ ...inputStyle, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
          </div>
          {([['কারণ দর্শানো — from', 'dateFrom'], ['কারণ দর্শানো — to', 'dateTo']] as const).map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <DateFieldDMY value={filters[key]} onChange={v => setFilter({ [key]: v } as Partial<CaseFilters>)} ariaLabel={label} clearable invalid={conflict}
                min={key === 'dateTo' ? filters.dateFrom || undefined : undefined} max={key === 'dateFrom' ? filters.dateTo || undefined : undefined}
                boxStyle={{ ...inputStyle, minWidth: 150, height: CONTROL_H, background: filters[key] ? '#eff6ff' : '#fff', borderColor: conflict ? '#dc2626' : filters[key] ? '#93c5fd' : '#cbd5e1' }} />
            </div>
          ))}
          {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_CASE_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Clear filters ({active})</button>}
          <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ New case</button>
        </div>
        {conflict && <div role="alert" style={{ padding: '0 14px 4px', fontSize: 12, color: '#dc2626', fontWeight: 600, fontFamily: font }}>“From” is after “to” — nothing can match.</div>}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={filters.stage.length === 0} onClick={() => setFilter({ stage: [] })} style={chip(filters.stage.length === 0, '#1e3a5f', '#e0e7ff')}>সব {stageCounts.total}</button>
          {STAGE_ORDER.map(s => (
            <button key={s} type="button" aria-pressed={filters.stage.includes(s)} onClick={() => toggleStage(s)} style={chip(filters.stage.includes(s), STAGE_STYLE[s].color, STAGE_STYLE[s].bg)}>{STAGE_STYLE[s].label} {stageCounts.c[s]}</button>
          ))}
          <button type="button" aria-pressed={filters.overdueOnly} onClick={() => setFilter({ overdueOnly: !filters.overdueOnly })} style={chip(filters.overdueOnly, '#b91c1c', '#fee2e2')}>⚠ মেয়াদোত্তীর্ণ</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {rows.length} records</span>
        </div>
      </div>

      <div style={{ overflowX: narrow ? 'auto' : 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: narrow ? 1250 : 0 }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead><tr>{COLS.map(c => <th key={c.key} style={thS}>{headCell(c)}</th>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>
                {rows.length === 0 ? 'এখনো কোনো কেস সংরক্ষণ করা হয়নি — “+ New case” চাপুন।' : 'বর্তমান ফিল্টারে কোনো কেস মেলেনি'}
              </td></tr>
            )}
            {filtered.map((r, i) => {
              const st = STAGE_STYLE[r.stage];
              const alert = r.overdue ? (r.running.kind === 'reply' ? 'জবাবের সময় শেষ' : 'তদন্তের সময়সীমা অতিক্রান্ত') : r.soon ? (r.running.kind === 'reply' ? 'জবাবের সময় শেষ হচ্ছে' : 'তদন্তের সময়সীমা ঘনিয়ে এসেছে') : '';
              return (
                <tr key={r.id || i} className="da-row">
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ ...td, ...wrap }}>{r.cardNo || '—'}</td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>{r.designation || '—'}</div>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>{r.section || '—'}</div>
                  </td>
                  <td style={{ ...td, ...wrap }}>
                    <div style={{ fontWeight: 600 }}>{formatDMY(r.showCause) || '—'}</div>
                    {r.referenceNo && <div style={subStyle}>{r.referenceNo}</div>}
                    {r.daysOpen !== null && <div style={subStyle}>{r.daysOpen} দিন {r.stage === 'Decided' || r.stage === 'Closed' ? 'লেগেছে' : 'চলমান'}</div>}
                  </td>
                  <td style={td}>
                    {r.replyDate ? <div style={{ fontWeight: 600 }}>{formatDMY(r.replyDate)}</div> : (r.replyStatus || r.stage !== 'Reply') ? <div style={{ color: '#94a3b8' }}>—</div> : <DueCell s={r.replyDue} final />}
                    {r.replyStatus && <div style={{ ...subStyle, color: r.replyStatus === 'সন্তোষজনক' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{r.replyStatus}</div>}
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{r.notice2 ? <><span style={subStyle}>২:</span> {formatDMY(r.notice2)}</> : <span style={{ color: '#94a3b8' }}>—</span>}</div>
                    <div style={{ fontWeight: 600 }}>{r.notice3 ? <><span style={subStyle}>৩:</span> {formatDMY(r.notice3)}</> : <span style={{ color: '#94a3b8' }}>—</span>}</div>
                    {r.memberCount > 0 && <div style={subStyle}>কমিটি {r.memberCount} জন</div>}
                  </td>
                  <td style={td}>{r.stage === 'Closed' || r.stage === 'Decided' ? <span style={{ color: '#94a3b8' }}>—</span> : <DueCell s={r.enquiry} final />}</td>
                  <td style={{ ...td, ...wrap }}>
                    {r.evaluationDate ? <div style={{ fontWeight: 600 }}>{formatDMY(r.evaluationDate)}</div> : <div style={{ color: '#94a3b8' }}>—</div>}
                    {r.punishment && <div style={{ fontSize: 11.5, color: '#1e293b', fontWeight: 600 }}>{r.punishment}</div>}
                  </td>
                  <td style={td}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>● {st.label}</span>
                    {alert && <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 3, color: r.overdue ? '#b91c1c' : '#c2410c' }}>{alert}</div>}
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