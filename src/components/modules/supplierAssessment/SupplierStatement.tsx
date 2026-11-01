// ─────────────────────────────────────────────────────────────────────────────
// SupplierStatement.tsx — the three result pages, one component:
//   dashboard  cards + the supplier table (sort asc/desc, column filters, search)
//   analysis   Assessment Analysis — (1) from the supplier data in this module, (2) external audits from Compliance Audit
//   asl        Approved Supplier List — click a row for the supplier's summary
// Table state (search / sort / filters) is owned by SupplierManager so Print, PDF and Excel follow the screen.
// Path: src/components/modules/supplierAssessment/SupplierStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AUDIT_AREAS } from '../complianceAudit/types';
import {
  STATUS_OPTIONS, STATUS_COLORS, APPROVAL_COLORS, RATING_COLORS, AREAS, MAX_TOTAL, SOON_DAYS, SUPPLIER_COLS, ASL_COLS, CATEGORY_COLS, SITE_COLS, INITIAL_TABLES,
  approvalLabel, applyTable, columnOptions, countActiveFilters, aslRows, supplierSummary, buildCategoryRows, summarizeSites, formatDMY,
} from './types';
import type { SupplierRow, ExtAudit, ColDef, TableId, TableState, TablesState, SiteSummary, CategoryRow, ShownStatus } from './types';
import HeaderFilter from '../livingWage/HeaderFilter';
import { font, CONTROL_H, inputStyle, th, td, mini, card, cardTitle } from '../livingWage/ui';

export type SupplierView = 'dashboard' | 'analysis' | 'asl';

interface Props {
  view: SupplierView;
  rows: SupplierRow[];
  audits: ExtAudit[];
  tables: TablesState;
  onTable: (id: TableId, st: TableState) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (supplierId: string) => void;
  onAdd: () => void;
}

const pill = (t: string, bg: string, color: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>{t}</span>
);
const statePill = (s: ShownStatus) => pill(s, STATUS_COLORS[s].bg, STATUS_COLORS[s].color);
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const kpi = (label: string, value: string | number, color = '#1e3a5f') => (
  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', flex: 1, minWidth: 120, fontFamily: font }}>
    <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 700, color }}>{value}</div>
  </div>
);
const bar = (pct: number, color: string) => (
  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, flex: 1 }}><div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: 8, borderRadius: 4, background: color }} /></div>
);
const dist = (label: string, count: number, total: number, color: string, labelW = 150) => (
  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: font, fontSize: 12, marginBottom: 4 }}>
    <span style={{ width: labelW, color: '#475569' }}>{label}</span>{bar(total ? (count / total) * 100 : 0, color)}<span style={{ width: 28, textAlign: 'right', fontWeight: 700 }}>{count}</span>
  </div>
);
const note = (text: string) => <div style={{ ...card, color: '#64748b', fontFamily: font, fontSize: 13 }}>{text}</div>;
const kv = (label: string, value: ReactNode) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#1e293b', fontFamily: font, ...wrap }}>{value || '—'}</div>
  </div>
);

function expireCell(r: SupplierRow) {
  if (!r.expireOn) return '—';
  const live = r.status === 'Approved' || r.status === 'Conditional';
  const d = r.daysLeft;
  return (<>
    <div>{formatDMY(r.expireOn)}</div>
    {live && d !== null && <div style={{ fontSize: 10.5, fontWeight: 600, color: d < 0 ? '#b91c1c' : d <= SOON_DAYS ? '#92400e' : '#64748b' }}>{d < 0 ? `expired ${-d}d ago` : `${d}d left`}</div>}
  </>);
}
function supplierCell(key: string, r: SupplierRow): ReactNode {
  switch (key) {
    case 'code': return r.code;
    case 'name': return <><div style={{ fontWeight: 600 }}>{r.name}</div>{r.contact && <div style={{ fontSize: 10.5, color: '#64748b' }}>{r.contact}</div>}</>;
    case 'category': return r.category || '—';
    case 'type': return r.businessType || '—';
    case 'score': return r.overall === null ? '—' : <><strong>{r.overall}</strong>/100 {r.result !== 'Pending' && <div>{pill(approvalLabel(r.result), APPROVAL_COLORS[r.result].bg, APPROVAL_COLORS[r.result].color)}</div>}</>;
    case 'status': return statePill(r.state);
    case 'approvedBy': return r.approvedBy || '—';
    case 'approvalDate': return formatDMY(r.approvalDate) || '—';
    case 'expireOn': return expireCell(r);
    default: return '';
  }
}

export default function SupplierStatement({ view, rows, audits, tables, onTable, selectedId, onSelect, onEdit, onAdd }: Props) {
  const asl   = useMemo(() => aslRows(rows), [rows]);
  const cats  = useMemo(() => buildCategoryRows(rows), [rows]);
  const sites = useMemo(() => summarizeSites(audits), [audits]);
  const sum   = useMemo(() => supplierSummary(rows), [rows]);

  const shownDash = useMemo(() => applyTable(rows, SUPPLIER_COLS, tables.dashboard), [rows, tables.dashboard]);
  const shownAsl  = useMemo(() => applyTable(asl, ASL_COLS, tables.asl), [asl, tables.asl]);
  const shownCats = useMemo(() => applyTable(cats, CATEGORY_COLS, tables.category), [cats, tables.category]);
  const shownSites = useMemo(() => applyTable(sites, SITE_COLS, tables.sites), [sites, tables.sites]);

  const an = useMemo(() => {
    const live = rows.filter(r => r.status === 'Approved' || r.status === 'Conditional');
    const bands = { a: 0, b: 0, c: 0, none: 0 };
    rows.forEach(r => { if (r.overall === null) bands.none++; else if (r.overall >= 85) bands.a++; else if (r.overall >= 70) bands.b++; else bands.c++; });
    const out = { expired: 0, d30: 0, d60: 0, d90: 0, later: 0, none: 0 };
    live.forEach(r => {
      const d = r.daysLeft;
      if (d === null) out.none++; else if (d < 0) out.expired++; else if (d <= 30) out.d30++; else if (d <= 60) out.d60++; else if (d <= 90) out.d90++; else out.later++;
    });
    const states: Record<string, number> = {};
    rows.forEach(r => { states[r.state] = (states[r.state] ?? 0) + 1; });
    const latest = sites.map(s => s.latest);
    const sev = { critical: 0, major: 0, minor: 0 };
    const byArea: Record<string, number> = {};
    const refCount = new Map<string, number>();
    latest.forEach(a => { sev.critical += a.critical; sev.major += a.major; sev.minor += a.minor; Object.entries(a.byArea).forEach(([k, v]) => { byArea[k] = (byArea[k] ?? 0) + v; }); });
    audits.forEach(a => a.refs.forEach(p => refCount.set(p, (refCount.get(p) ?? 0) + 1)));
    const ratings: Record<string, number> = { Good: 0, Satisfactory: 0, 'Needs Improvement': 0, 'High Risk': 0 };
    latest.forEach(a => { ratings[a.rating] = (ratings[a.rating] ?? 0) + 1; });
    return {
      bands, out, states, sev, byArea, ratings, pastDue: latest.reduce((s, a) => s + a.pastDue, 0),
      avgAudit: latest.length ? Math.round((latest.reduce((s, a) => s + a.score, 0) / latest.length) * 10) / 10 : null,
      topRefs: Array.from(refCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8), unmatched: sites.filter(s => s.inList === 'No').length,
    };
  }, [rows, sites, audits]);

  const setT = (id: TableId, p: Partial<TableState>) => onTable(id, { ...tables[id], ...p });
  const cycleSort = (id: TableId, key: string) => {
    const cur = tables[id].sort;
    if (cur.key !== key) setT(id, { sort: { key, dir: 'asc' } });
    else if (cur.dir === 'asc') setT(id, { sort: { key, dir: 'desc' } });
    else setT(id, { sort: { key: '', dir: 'asc' } });
  };

  const toolbar = (id: TableId, title: string, total: number, shown: number, right?: ReactNode) => {
    const st = tables[id], active = countActiveFilters(st);
    return (
      <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ ...cardTitle, marginRight: 'auto' }}>{title}</div>
        <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>{shown} of {total}</span>
        <div style={{ minWidth: 220 }}>
          <input aria-label={`Search ${title}`} value={st.search} onChange={e => setT(id, { search: e.target.value })} placeholder="Search…" autoComplete="off"
            style={{ ...inputStyle, height: CONTROL_H, background: st.search.trim() ? '#eff6ff' : '#fff', borderColor: st.search.trim() ? '#93c5fd' : '#cbd5e1' }} />
        </div>
        {active > 0 && <button type="button" onClick={() => onTable(id, INITIAL_TABLES[id])} style={{ height: CONTROL_H, padding: '0 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Clear Filters ({active})</button>}
        {right}
      </div>
    );
  };

  function head<T>(id: TableId, all: T[], cols: ColDef<T>[], c: ColDef<T>) {
    const st = tables[id], sorted = st.sort.key === c.key;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 }}>
        <span>{c.label}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          <button type="button" aria-label={`Sort ${c.label}`} onClick={() => cycleSort(id, c.key)} style={mini(sorted)}>{sorted ? (st.sort.dir === 'asc' ? '▲' : '▼') : '↕'}</button>
          {c.filter && <HeaderFilter label={c.label} selected={st.filters[c.key] ?? []} getOptions={() => columnOptions(all, cols, st, c.key)} onChange={s => setT(id, { filters: { ...st.filters, [c.key]: s } })} />}
        </span>
      </div>
    );
  }

  function dataTable<T>(id: TableId, title: string, all: T[], shown: T[], cols: ColDef<T>[], o: {
    cell: (key: string, r: T) => ReactNode; rowKey: (r: T, i: number) => string; empty: string; minWidth?: number; numbered?: boolean;
    actions?: (r: T) => ReactNode; onRow?: (r: T) => void; groupBy?: (r: T) => string; right?: ReactNode; numberCols?: string[];
  }) {
    const vis = cols.filter(c => !c.hidden);
    const grouped = o.groupBy && tables[id].sort.key === '';
    const span = vis.length + (o.numbered ? 1 : 0) + (o.actions ? 1 : 0);
    return (
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
        {toolbar(id, title, all.length, shown.length, o.right)}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: o.minWidth ?? 900 }}>
            <thead><tr>
              {o.numbered && <th style={{ ...th, width: 40 }}>SL</th>}
              {vis.map(c => <th key={c.key} style={th}>{head(id, all, cols, c)}</th>)}
              {o.actions && <th style={{ ...th, width: 44 }} />}
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={span} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>{all.length === 0 ? o.empty : 'Nothing matches the current search / filters'}</td></tr>}
              {shown.map((r, i) => (
                <Fragment key={o.rowKey(r, i)}>
                  {grouped && (i === 0 || o.groupBy!(shown[i - 1]) !== o.groupBy!(r)) && (
                    <tr><td colSpan={span} style={{ ...td, background: '#f1f5f9', fontWeight: 700, color: '#1e3a5f' }}>{o.groupBy!(r) || '(No category)'}</td></tr>
                  )}
                  <tr onClick={o.onRow ? () => o.onRow!(r) : undefined} style={{ cursor: o.onRow ? 'pointer' : undefined }}>
                    {o.numbered && <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>}
                    {vis.map(c => <td key={c.key} style={{ ...td, ...wrap, textAlign: o.numberCols?.includes(c.key) ? 'center' : undefined }}>{o.cell(c.key, r)}</td>)}
                    {o.actions && <td style={{ ...td, textAlign: 'center' }} onClick={e => e.stopPropagation()}>{o.actions(r)}</td>}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const editBtn = (r: SupplierRow) => <button type="button" onClick={() => onEdit(r.id)} title="Edit supplier" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>;

  // ───────── DASHBOARD ─────────
  if (view === 'dashboard') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {kpi('Total suppliers', sum.total)}
          {kpi('Approved suppliers', sum.approved, '#15803d')}
          {kpi('Conditional approval', sum.conditional, '#92400e')}
          {kpi('Not approved', sum.notApproved, sum.notApproved ? '#b91c1c' : '#15803d')}
          {kpi('Pending', sum.pending, '#475569')}
          {kpi(`Expired / expiring ≤${SOON_DAYS}d`, `${sum.expired} / ${sum.soon}`, sum.expired ? '#b91c1c' : sum.soon ? '#92400e' : '#15803d')}
        </div>
        {dataTable('dashboard', 'Supplier assessments', rows, shownDash, SUPPLIER_COLS, {
          cell: (k, r) => supplierCell(k, r), rowKey: (r, i) => r.id || String(i), empty: 'No suppliers yet — use “নতুন অ্যাসেসমেন্ট” to add the first one.', numbered: true, actions: editBtn,
          right: <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ Add Supplier</button>,
        })}
      </div>
    );
  }

  // ───────── ASSESSMENT ANALYSIS ─────────
  if (view === 'analysis') {
    const totalNc = an.sev.critical + an.sev.major + an.sev.minor;
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {kpi('Suppliers assessed', `${sum.assessed} of ${sum.total}`)}
          {kpi('Average score', sum.avgScore === null ? '—' : `${sum.avgScore}/${MAX_TOTAL}`)}
          {kpi('On the approved list', asl.length, '#15803d')}
          {kpi(`Expiring ≤${SOON_DAYS} days`, sum.soon, sum.soon ? '#92400e' : '#15803d')}
          {kpi('Expired approvals', sum.expired, sum.expired ? '#b91c1c' : '#15803d')}
          {kpi('Not approved', sum.notApproved, sum.notApproved ? '#b91c1c' : '#15803d')}
        </div>
        {rows.length === 0 ? note('No supplier data yet — the analysis builds itself from the assessments you save.') : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 8 }}>Supplier status</div>
              {([...STATUS_OPTIONS, 'Expired'] as ShownStatus[]).map(s => dist(s, an.states[s] ?? 0, rows.length, STATUS_COLORS[s].color, 110))}
            </div>
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 8 }}>Overall compliance score</div>
              {dist('85+ (Approved)', an.bands.a, rows.length, '#16a34a', 130)}{dist('70–84 (Conditional)', an.bands.b, rows.length, '#f59e0b', 130)}
              {dist('Below 70', an.bands.c, rows.length, '#dc2626', 130)}{dist('Not scored', an.bands.none, rows.length, '#94a3b8', 130)}
            </div>
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 8 }}>Approval expiry outlook</div>
              {dist('Expired', an.out.expired, sum.approved + sum.conditional + sum.expired, '#9d174d', 110)}{dist('Within 30 days', an.out.d30, sum.approved + sum.conditional + sum.expired, '#dc2626', 110)}
              {dist('31–60 days', an.out.d60, sum.approved + sum.conditional + sum.expired, '#f59e0b', 110)}{dist('61–90 days', an.out.d90, sum.approved + sum.conditional + sum.expired, '#eab308', 110)}
              {dist('Later', an.out.later, sum.approved + sum.conditional + sum.expired, '#16a34a', 110)}{dist('No expiry set', an.out.none, sum.approved + sum.conditional + sum.expired, '#94a3b8', 110)}
            </div>
          </div>
        )}
        {rows.length > 0 && dataTable('category', 'Assessment summary by category', cats, shownCats, CATEGORY_COLS, {
          cell: (k, r: CategoryRow) => {
            switch (k) {
              case 'category': return <strong>{r.category}</strong>;
              case 'suppliers': return r.suppliers; case 'avgScore': return r.avgScore ?? '—'; case 'approved': return r.approved; case 'conditional': return r.conditional;
              case 'notApproved': return r.notApproved; case 'pending': return r.pending; case 'soon': return r.soon; case 'expired': return r.expired; default: return '';
            }
          }, rowKey: r => r.category, empty: 'No data', minWidth: 760,
        })}

        <div style={{ ...cardTitle, margin: '18px 0 8px' }}>External supplier audits — from the Compliance Audit module</div>
        {audits.length === 0 ? note('No external supplier audit found. Save an audit of type “External for Supplier” in the Compliance Audit module and it appears here.') : (<>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {kpi('External audits', audits.length)}
            {kpi('Sites / suppliers audited', sites.length)}
            {kpi('Average latest score', an.avgAudit === null ? '—' : `${an.avgAudit}/100`)}
            {kpi('Critical NCs (latest)', an.sev.critical, an.sev.critical ? '#b91c1c' : '#15803d')}
            {kpi('Major NCs (latest)', an.sev.major, an.sev.major ? '#c2410c' : '#15803d')}
            {kpi('Minor NCs (latest)', an.sev.minor, '#92400e')}
            {kpi('NCs past timeline (latest)', an.pastDue, an.pastDue ? '#b91c1c' : '#15803d')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10, marginBottom: 10 }}>
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 8 }}>Latest audit rating</div>
              {Object.entries(an.ratings).map(([k, v]) => dist(k, v, sites.length, RATING_COLORS[k]?.color ?? '#64748b'))}
              <div style={{ ...cardTitle, margin: '12px 0 8px' }}>Non-compliances by severity</div>
              {dist('Critical', an.sev.critical, totalNc, '#b91c1c')}{dist('Major', an.sev.major, totalNc, '#c2410c')}{dist('Minor', an.sev.minor, totalNc, '#f59e0b')}
            </div>
            <div style={card}>
              <div style={{ ...cardTitle, marginBottom: 8 }}>Non-compliances by auditing area (latest audits)</div>
              {AUDIT_AREAS.map(a => dist(`${a.code}. ${a.name}`, an.byArea[a.code] ?? 0, totalNc, '#1e3a5f', 210))}
              {an.topRefs.length > 0 && (<>
                <div style={{ ...cardTitle, margin: '12px 0 6px' }}>Most frequent NC points (all audits)</div>
                {an.topRefs.map(([p, n]) => <div key={p} style={{ fontSize: 12, fontFamily: font, color: '#334155' }}><strong>{n}×</strong> {p}</div>)}
              </>)}
            </div>
          </div>
          {an.unmatched > 0 && <div style={{ fontSize: 11.5, color: '#92400e', fontFamily: font, marginBottom: 6 }}>⚠ {an.unmatched} audited site(s) do not match a supplier name here — spell the company / site name the same way in both modules to link them.</div>}
          {dataTable('sites', 'Audited sites — latest audit', sites, shownSites, SITE_COLS, {
            cell: (k, s: SiteSummary) => {
              const a = s.latest, d = s.prevScore === null ? null : a.score - s.prevScore, rc = RATING_COLORS[a.rating] ?? { bg: '#f1f5f9', color: '#475569' };
              switch (k) {
                case 'site': return <><strong>{s.site}</strong><div style={{ fontSize: 10.5, color: '#64748b' }}>{d === null ? 'first audit' : `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} vs previous`}</div></>;
                case 'inList': return s.inList === 'Yes' ? <span style={{ color: '#15803d', fontWeight: 600 }}>{s.supplierCode}</span> : <span style={{ color: '#92400e' }}>No</span>;
                case 'audits': return s.audits; case 'round': return a.round || '—'; case 'date': return formatDMY(a.auditDate) || '—';
                case 'score': return <strong>{a.score}</strong>; case 'rating': return pill(a.rating, rc.bg, rc.color);
                case 'critical': return <span style={{ color: a.critical ? '#b91c1c' : undefined, fontWeight: a.critical ? 700 : 400 }}>{a.critical}</span>;
                case 'major': return a.major; case 'minor': return a.minor;
                case 'pastDue': return <span style={{ color: a.pastDue ? '#b91c1c' : undefined, fontWeight: a.pastDue ? 700 : 400 }}>{a.pastDue}</span>;
                default: return '';
              }
            }, rowKey: s => s.key, empty: 'No audits', minWidth: 950,
          })}
        </>)}
      </div>
    );
  }

  // ───────── APPROVED SUPPLIER LIST ─────────
  const sel = selectedId ? rows.find(r => r.id === selectedId) ?? null : null;
  if (sel) {
    const site = sites.find(s => s.supplierCode === sel.code);
    const rc = sel.result === 'Pending' ? null : APPROVAL_COLORS[sel.result];
    return (
      <div>
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onSelect(null)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer', color: '#475569' }}>← Back to list</button>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1e3a5f', fontFamily: font }}>{sel.name}</div>
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: font }}>{sel.code}</span>
          {statePill(sel.state)}
          <button type="button" onClick={() => onEdit(sel.id)} style={{ marginLeft: 'auto', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>✎ Edit</button>
        </div>
        <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, margin: '-4px 2px 8px' }}>Print / PDF in the header prints this summary.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 8 }}>A. Supplier information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {kv('Category', sel.category)}{kv('Supplier type', sel.businessType)}{kv('Product / service', sel.product)}{kv('Contact person', sel.contact)}
              {kv('Mobile', sel.phone)}{kv('Email', sel.email)}<div style={{ gridColumn: '1 / -1' }}>{kv('Factory address', sel.address)}</div>
            </div>
          </div>
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 8 }}>C. Approval details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {kv('Status', statePill(sel.state))}{kv('Approved by', sel.approvedBy)}{kv('Date of approval', formatDMY(sel.approvalDate))}
              {kv('Validity', sel.validityYears === null ? '' : `${sel.validityYears} year${sel.validityYears === 1 ? '' : 's'}`)}
              {kv('Expire on', sel.expireOn ? <>{formatDMY(sel.expireOn)}{sel.daysLeft !== null && <span style={{ color: sel.daysLeft < 0 ? '#b91c1c' : sel.daysLeft <= SOON_DAYS ? '#92400e' : '#64748b', fontSize: 11.5 }}> · {sel.daysLeft < 0 ? `expired ${-sel.daysLeft}d ago` : `${sel.daysLeft}d left`}</span>}</> : '')}
            </div>
          </div>
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 8 }}>Audit certification list</div>
            <div style={{ fontSize: 13, fontFamily: font, whiteSpace: 'pre-wrap', color: '#1e293b' }}>{sel.certificationList || '—'}</div>
          </div>
          <div style={card}>
            <div style={{ ...cardTitle, marginBottom: 8 }}>Brand / buyer list</div>
            <div style={{ fontSize: 13, fontFamily: font, whiteSpace: 'pre-wrap', color: '#1e293b' }}>{sel.buyerList || '—'}</div>
          </div>
        </div>

        <div style={{ ...card, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={cardTitle}>B. Assessment details</div>
            {rc && pill(`${approvalLabel(sel.result)} · grade ${sel.grade}`, rc.bg, rc.color)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
            {kv('Assessment date', formatDMY(sel.assessmentDate))}{kv('Method', sel.method)}{kv('Assessed by', sel.assessedBy)}
            {kv('Overall compliance score', sel.overall === null ? '' : <strong style={{ fontSize: 16 }}>{sel.overall}/{MAX_TOTAL}</strong>)}
          </div>
          {AREAS.map(a => {
            const v = sel.areas[a.key], pct = v === null ? 0 : (v / a.max) * 100;
            return (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: font, fontSize: 12, marginBottom: 4 }}>
                <span style={{ width: 250, color: '#475569' }}>{a.label}</span>{bar(pct, pct >= 85 ? '#16a34a' : pct >= 70 ? '#f59e0b' : '#dc2626')}
                <span style={{ width: 60, textAlign: 'right', fontWeight: 700 }}>{v === null ? '—' : `${v}/${a.max}`}</span>
                {sel.remarks[a.key] && <span style={{ color: '#64748b', maxWidth: 220 }}>{sel.remarks[a.key]}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ ...card, marginTop: 10 }}>
          <div style={{ ...cardTitle, marginBottom: 8 }}>External audit (Compliance Audit module)</div>
          {!site ? <div style={{ fontSize: 12.5, color: '#64748b', fontFamily: font }}>No external audit matches this supplier name.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {kv('Audits on record', site.audits)}{kv('Latest round', site.latest.round)}{kv('Audit date', formatDMY(site.latest.auditDate))}
              {kv('Score', <strong>{site.latest.score}</strong>)}{kv('Rating', pill(site.latest.rating, (RATING_COLORS[site.latest.rating] ?? { bg: '#f1f5f9' }).bg, (RATING_COLORS[site.latest.rating] ?? { color: '#475569' }).color))}
              {kv('Critical / Major / Minor', `${site.latest.critical} / ${site.latest.major} / ${site.latest.minor}`)}{kv('NCs past timeline', site.latest.pastDue)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {kpi('On the approved list', asl.length, '#15803d')}
        {kpi('Approved', asl.filter(r => r.state === 'Approved').length, '#15803d')}
        {kpi('Conditional', asl.filter(r => r.state === 'Conditional').length, '#92400e')}
        {kpi(`Expiring ≤${SOON_DAYS} days`, asl.filter(r => r.expiry === 'soon').length, '#92400e')}
      </div>
      <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, marginBottom: 6 }}>Approved and Conditional suppliers whose approval has not expired. Click a row for the supplier summary.</div>
      {dataTable('asl', 'Approved Supplier List (ASL)', asl, shownAsl, ASL_COLS, {
        cell: (k, r) => supplierCell(k, r), rowKey: (r, i) => r.id || String(i), empty: 'No approved suppliers yet', numbered: true, actions: editBtn,
        onRow: r => onSelect(r.id), groupBy: r => r.category,
      })}
    </div>
  );
}