// ─────────────────────────────────────────────────────────────────────────────
// WageGapReport.tsx — Step 3: actual gross salary (or the estimated take-home salary) vs living wage.
// The ⇄ switch on the salary column changes what is compared; the (i) ball explains the formula.
// Pinned filters, status chips, column funnels, sort, department summary.
// Smart table: natural height, coverage bar, below-wage row tint, click-to-filter cells,
// summary footer, and "show more" paging.
// Filters are owned by LivingWageManager (shared with print and Excel).
// Path: src/components/modules/livingWage/WageGapReport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import HeaderFilter from './HeaderFilter';
import InfoBall from './InfoBall';
import type { DbRecord } from '../../../database/DatabaseFactory';
import {
  EMPTY_GAP_FILTERS, buildGapEntries, filterGapEntries, gapStats, departmentSummary, gapColumnValue,
  countActiveGapFilters, hasActiveGapFilters, empName, money, estimateMonthlyCost, FIXED_ALLOWANCES, FIXED_ALLOWANCES_TOTAL,
} from './types';
import type { GapFilters, GapSortField, WageBasis } from './types';
import { font, CONTROL_H, inputStyle, th, td, mini } from './ui';

/** Content of the (i) ball: the formula and a worked example (Gross Tk 12,500), computed with the same function the table uses. */
function CostExplain() {
  const ex = estimateMonthlyCost(12500);
  const n0 = (v: number) => v.toLocaleString('en-US');
  const cellL: React.CSSProperties = { padding: '2px 8px 2px 0' };
  const cellR: React.CSSProperties = { padding: '2px 0', textAlign: 'right', whiteSpace: 'nowrap' };
  const row = (label: string, v: number, bold = false) => (
    <tr key={label} style={{ fontWeight: bold ? 700 : 400, borderTop: bold ? '1px solid #e2e8f0' : undefined }}>
      <td style={cellL}>{label}</td><td style={cellR}>{money(v)}</td>
    </tr>
  );
  return (
    <div style={{ fontSize: 12 }}>
      <div>Estimated take-home salary = Gross salary + estimated overtime + festival bonus provision.</div>
      <div style={{ marginTop: 6 }}>
        <b>1. Basic salary</b> = (Gross salary − Tk {n0(FIXED_ALLOWANCES_TOTAL)}) ÷ 1.5<br />
        Fixed allowances: Medical {n0(FIXED_ALLOWANCES.medical)} + Transport {n0(FIXED_ALLOWANCES.transport)} + Food {n0(FIXED_ALLOWANCES.food)} = Tk {n0(FIXED_ALLOWANCES_TOTAL)}.
        House rent = 50% of basic, so Gross = Basic + House rent + the 3 allowances.
      </div>
      <div style={{ marginTop: 4 }}><b>2. Estimated overtime</b> = Basic ÷ 208 × 2 × 2 × 26 (2 hours a day for 26 days, at the double rate).</div>
      <div style={{ marginTop: 4 }}><b>3. Festival bonus provision</b> = Basic × 50% ÷ 12 (monthly).</div>
      <pre style={{ margin: '8px 0', padding: '6px 8px', background: '#f1f5f9', borderRadius: 6, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
{`GrossSalary
+ (((GrossSalary - 2450) / 1.5 / 208) * 2 * 2 * 26)
+ (((GrossSalary - 2450) / 1.5 / 2) / 12)`}
      </pre>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Example: Gross salary Tk 12,500</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {row('Gross salary', ex.gross)}
            {row('Basic salary', ex.basic)}
            {row('House rent (50% of basic)', ex.houseRent)}
            {row('Medical allowance', ex.medical)}
            {row('Transport allowance', ex.transport)}
            {row('Food allowance', ex.food)}
            {row('Estimated OT (2 hrs × 26 days)', ex.overtime)}
            {row('Festival bonus provision (50% ÷ 12)', ex.festivalBonus)}
            {row('Total estimated take-home salary', ex.total, true)}
          </tbody>
        </table>
      <div style={{ marginTop: 8, color: '#92400e' }}>
        {/* Note: this is an employer-cost view. The Anker living-wage comparison counts regular pay and leaves overtime out, so keep “Gross salary” for a strict Anker comparison.
        A gross below Tk {n0(FIXED_ALLOWANCES_TOTAL)} has no basic salary, so no overtime or bonus is added. */}
      </div>
    </div>
  );
}

interface Props {
  employees: DbRecord[];
  livingWage: number;
  isLoading: boolean;
  filters: GapFilters;
  datasetLabel: string;
  onFiltersChange: (f: GapFilters) => void;
  /** What is compared with the living wage: 'gross' salary or the 'estimated' take-home salary. */
  wageBasis: WageBasis;
  onWageBasisChange: (b: WageBasis) => void;
}

const COLS: { key: string; label: string; w: number; field?: string; sort?: GapSortField }[] = [
  { key: 'sl', label: 'SL', w: 4 },
  { key: 'card', label: 'ID/Card No', w: 8, field: 'cardNo', sort: 'cardNo' },
  { key: 'name', label: 'Name', w: 16, sort: 'name' },
  { key: 'desig', label: 'Designation', w: 13, field: 'designation' },
  { key: 'dept', label: 'Department', w: 12, field: 'department' },
  { key: 'gross', label: 'Gross salary', w: 15, sort: 'salary' },
  { key: 'lw', label: 'Living wage', w: 9 },
  { key: 'gap', label: 'Gap', w: 14, sort: 'gap' },
  { key: 'status', label: 'Status', w: 9 },
];

/* ── Department summary: three blocks in a three-column grid ───────────────── */
const DEPT_CSS = `
.wg-dept-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: start; }
.wg-dept-grid tbody tr:hover td { background: #eef2ff; }
@media (max-width: 1000px) { .wg-dept-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px)  { .wg-dept-grid { grid-template-columns: minmax(0, 1fr); } }
`;
/* ── Smart table: row hover + visible keyboard focus on click-to-filter cells ── */
const TABLE_CSS = `
.wg-table tbody tr:hover td { background: #eef2ff !important; }
.wg-link:hover { color: #1d4ed8; border-bottom-style: solid !important; }
.wg-link:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; border-radius: 3px; }
`;
const DEPT_W = ['34%', '13%', '23%', '12%', '18%'];
const GOOD = '#15803d';
const BAD = '#b91c1c';
/** Table viewport: sticky header (~44) + 5 rows (~46 each) + sticky footer (~38). Rows scroll inside it, never above the toolbar. */
const TABLE_VIEW_H = 44 + 5 * 46 + 38;

/** Split the departments into 3 balanced consecutive blocks (e.g. 10 → 4 / 3 / 3), keeping the sort order. */
function splitInThree<T>(items: T[]): T[][] {
  const base = Math.floor(items.length / 3), extra = items.length % 3;
  const out: T[][] = [];
  let i = 0;
  for (let c = 0; c < 3; c++) {
    const size = base + (c < extra ? 1 : 0);
    if (size) out.push(items.slice(i, i + size));
    i += size;
  }
  return out;
}

export default function WageGapReport({ employees, livingWage, isLoading, filters, datasetLabel, onFiltersChange, wageBasis, onWageBasisChange }: Props) {
  const estimated = wageBasis === 'estimated';
  const what = estimated ? 'est. take-home salary' : 'gross salary';
  const setFilter = (p: Partial<GapFilters>) => onFiltersChange({ ...filters, ...p });

  const entries  = useMemo(() => buildGapEntries(employees, livingWage, wageBasis), [employees, livingWage, wageBasis]);
  const filtered = useMemo(() => filterGapEntries(entries, filters), [entries, filters]);
  const stats    = useMemo(() => gapStats(filtered), [filtered]);
  const depts    = useMemo(() => departmentSummary(filtered), [filtered]);
  const deptBlocks = useMemo(() => splitInThree(depts), [depts]);
  const statusCounts = useMemo(() => {
    const base = filterGapEntries(entries, { ...filters, status: [] });
    return { total: base.length, below: base.filter(e => !e.gap.meetsLivingWage).length, meets: base.filter(e => e.gap.meetsLivingWage).length };
  }, [entries, filters]);

  const columnOptions = (field: string) => {
    const cols = { ...(filters.columns ?? {}) }; delete cols[field];
    return Array.from(new Set(filterGapEntries(entries, { ...filters, columns: cols }).map(e => gapColumnValue(e, field)))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const setColumn = (field: string, sel: string[]) => setFilter({ columns: { ...(filters.columns ?? {}), [field]: sel } });
  const cycleSort = (field: GapSortField) => {
    const cur = filters.sort ?? { field: '', dir: 'asc' };
    if (cur.field !== field) setFilter({ sort: { field, dir: 'asc' } });
    else if (cur.dir === 'asc') setFilter({ sort: { field, dir: 'desc' } });
    else setFilter({ sort: { field: '', dir: 'asc' } });
  };

  if (isLoading) return <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8', fontFamily: font }}>Loading wage data...</div>;

  const active = countActiveGapFilters(filters);
  const cur = filters.sort ?? { field: '', dir: 'asc' };
  const thS = { ...th, position: 'sticky' as const, top: 0, zIndex: 3 };
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
    if (c.key === 'gross') {
      const sortedSalary = cur.field === 'salary';
      return (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ whiteSpace: 'normal' }}>{estimated ? 'Est. take-home salary' : 'Gross salary'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <button type="button" aria-label="Sort salary" onClick={() => cycleSort('salary')} style={mini(sortedSalary)}>{sortedSalary ? (cur.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
            <button
              type="button" role="switch" aria-checked={estimated}
              aria-label="Switch between gross salary and estimated take-home salary"
              title={estimated ? 'Showing the estimated take-home salary — click to show the gross salary' : 'Showing the gross salary — click to show the estimated take-home salary (gross + overtime + festival bonus)'}
              onClick={() => onWageBasisChange(estimated ? 'gross' : 'estimated')}
              style={{ ...mini(estimated), fontSize: 13 }}
            >⇄</button>
            <InfoBall title="Estimated take-home salary" width={400} placement="top"><CostExplain /></InfoBall>
          </span>
        </div>
      );
    }
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

  // department block cell styles
  const dTh: React.CSSProperties = { ...th, boxShadow: 'none', borderBottom: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 11.5, whiteSpace: 'normal', position: 'static' };
  const dTd: React.CSSProperties = { ...td, padding: '7px 10px', fontSize: 12, borderBottom: '1px solid #eef2f6', fontVariantNumeric: 'tabular-nums' };
  const deptHeads = ['Department', 'People', estimated ? 'Avg. est. cost' : 'Avg. gross', 'Below', 'Avg. gap'];

  // footer cell style
  const fTd: React.CSSProperties = { ...td, background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1', position: 'sticky', bottom: 0, zIndex: 3 };

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div style={{ padding: 12, display: 'flex', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
        {metric('Living wage (Tk)', money(livingWage))}
        {metric(`Average ${what}`, money(stats.avgActual))}
        {metric(`Median ${what}`, money(stats.median))}
        {metric('Below living wage', `${stats.below} / ${stats.n}`, stats.below ? '#b91c1c' : '#15803d')}
        {metric('Average gap', `${stats.avgGapPct.toFixed(1)}%`, stats.avgGapPct > 0 ? '#b91c1c' : '#15803d')}
        {metric('Cost to close gap / month', money(stats.shortfallTotal), stats.shortfallTotal ? '#b91c1c' : '#15803d')}
      </div>

      {estimated && (
        <div role="status" style={{ padding: '8px 12px', background: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e', fontSize: 12, fontFamily: font, fontWeight: 600 }}>
          Showing the estimated take-home salary (gross + estimated overtime + festival bonus provision), and the gap and status use it. Click ⇄ on the salary column to go back to the gross salary.
        </div>
      )}

      {depts.length > 1 && (
        <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
          <style>{DEPT_CSS}</style>
          <div className="wg-dept-grid">
            {deptBlocks.map((block, bi) => (
              <div key={bi} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font, tableLayout: 'fixed' }}>
                  <colgroup>{DEPT_W.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
                  <thead><tr>{deptHeads.map(h => <th key={h} style={{ ...dTh, background: '#f1f5f9' }}>{h}</th>)}</tr></thead>
                  <tbody>{block.map(d => (
                    <tr key={d.department}>
                      <td style={{ ...dTd, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>{d.department}</td>
                      <td style={dTd}>{d.count}</td>
                      <td style={dTd}>{money(d.avgGross)}</td>
                      <td style={{ ...dTd, color: d.below ? BAD : GOOD, fontWeight: 700 }}>{d.below}</td>
                      <td style={{ ...dTd, color: d.avgGapPct > 0 ? BAD : GOOD, fontWeight: 600 }}>{d.avgGapPct.toFixed(1)}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 6px -4px rgba(15,23,42,0.25)', padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={filters.search} onChange={e => setFilter({ search: e.target.value })} placeholder="Search name / designation / department / card" autoComplete="off"
          style={{ ...inputStyle, flex: 1, minWidth: 220, height: CONTROL_H, background: filters.search.trim() ? '#eff6ff' : '#fff', borderColor: filters.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
        <button type="button" aria-pressed={!filters.status.length} onClick={() => setFilter({ status: [] })} style={chip(!filters.status.length, '#1e3a5f', '#e0e7ff')}>All {statusCounts.total}</button>
        <button type="button" aria-pressed={filters.status.includes('below')} onClick={() => setFilter({ status: filters.status.includes('below') ? filters.status.filter(x => x !== 'below') : [...filters.status, 'below'] })} style={chip(filters.status.includes('below'), '#b91c1c', '#fee2e2')}>Below {statusCounts.below}</button>
        <button type="button" aria-pressed={filters.status.includes('meets')} onClick={() => setFilter({ status: filters.status.includes('meets') ? filters.status.filter(x => x !== 'meets') : [...filters.status, 'meets'] })} style={chip(filters.status.includes('meets'), '#166534', '#dcfce7')}>Meets {statusCounts.meets}</button>
        {active > 0 && <button type="button" onClick={() => onFiltersChange(EMPTY_GAP_FILTERS)} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b', fontFamily: font }}>{filtered.length} of {entries.length} with wage data · {datasetLabel}</span>
      </div>

      <div>
        <style>{TABLE_CSS}</style>
        <div style={{ overflow: 'auto', maxHeight: TABLE_VIEW_H, overscrollBehavior: 'contain' }}>
        <table className="wg-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', fontVariantNumeric: 'tabular-nums' }}>
          <colgroup>{COLS.map(c => <col key={c.key} style={{ width: `${c.w}%` }} />)}</colgroup>
          <thead>
            <tr>{COLS.map(c => (
              <th key={c.key} style={{ ...thS, verticalAlign: 'top', textAlign: 'left', ...(c.key === 'gross' ? { whiteSpace: 'normal' } : {}), ...(c.key === 'sl' ? { textAlign: 'center', verticalAlign: 'middle' } : {}) }}>{headCell(c)}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={COLS.length} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 28 }}>
                <div style={{ fontWeight: 600, marginBottom: hasActiveGapFilters(filters) ? 8 : 0 }}>No wage data to compare</div>
                {hasActiveGapFilters(filters) && <button type="button" onClick={() => onFiltersChange(EMPTY_GAP_FILTERS)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear Filters</button>}
              </td></tr>
            )}

            {filtered.map(({ emp, gap, gross, est }, index) => {
              const r = emp as unknown as Record<string, unknown>;
              const below = !gap.meetsLivingWage;
              const ratio = gap.livingWage > 0 ? Math.min(gap.actualWage / gap.livingWage, 1) : 1;
              const wrap: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
              const rowBg = below ? '#fff7f7' : index % 2 ? '#fafbfc' : '#fff';
              const cell: React.CSSProperties = { ...td, background: rowBg, verticalAlign: 'middle' };
              // department / designation: click to filter the whole table by that value
              const link = (field: 'department' | 'designation') => {
                const v = String(r[field] ?? '');
                if (!v) return '—';
                return (
                  <span className="wg-link" role="button" tabIndex={0} title={`Filter by ${v}`}
                    onClick={() => setColumn(field, [v])}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColumn(field, [v]); } }}
                    style={{ cursor: 'pointer', borderBottom: '1px dotted #94a3b8', whiteSpace: 'nowrap' }}>{v}</span>
                );
              };
              return (
                <tr key={String(r.id ?? index)}>
                  <td style={{ ...cell, textAlign: 'center', verticalAlign: 'middle', fontWeight: 600, boxShadow: below ? 'inset 3px 0 0 #ef4444' : undefined }}>{index + 1}</td>
                  <td style={{ ...cell, ...wrap }} title={String(r.cardNo ?? '')}>{String(r.cardNo ?? '') || '—'}</td>
                  <td style={{ ...cell, ...wrap, fontWeight: 600 }} title={empName(emp)}>{empName(emp)}</td>
                  <td style={{ ...cell, ...wrap }}>{link('designation')}</td>
                  <td style={{ ...cell, ...wrap }}>{link('department')}</td>
                  <td style={cell}>
                    {money(gap.actualWage)}
                    {est && <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 400 }}>Gross {money(gross)}</div>}
                  </td>
                  <td style={cell}>{money(gap.livingWage)}</td>
                  <td style={{ ...cell, color: below ? BAD : GOOD, fontWeight: 600 }}>
                    {below ? '−' : '+'}{money(Math.abs(gap.gapAmount))} ({gap.gapPercent.toFixed(1)}%)
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 4, overflow: 'hidden' }} title={`Covers ${(ratio * 100).toFixed(0)}% of the living wage`}>
                      <div style={{ width: `${ratio * 100}%`, height: '100%', background: below ? '#ef4444' : '#22c55e' }} />
                    </div>
                  </td>
                  <td style={cell}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: below ? '#fee2e2' : '#dcfce7', color: below ? '#b91c1c' : '#166534' }}>{below ? '⚠ Below' : '✓ Meets'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td style={fTd} colSpan={5}>{filtered.length} employees · {stats.below} below living wage</td>
                <td style={fTd}>Avg {money(stats.avgActual)}</td>
                <td style={fTd}>{money(livingWage)}</td>
                <td style={{ ...fTd, color: stats.shortfallTotal ? BAD : GOOD }} colSpan={2}>Close gap: {money(stats.shortfallTotal)}/mo</td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>
    </div>
  );
}