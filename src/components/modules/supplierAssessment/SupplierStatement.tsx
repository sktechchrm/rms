// ─────────────────────────────────────────────────────────────────────────────
// SupplierStatement.tsx — the three result pages, one component:
//   dashboard  cards + searchable list of all supplier assessments
//   analysis   Assessment Analysis — built from the Compliance Audit module ("External for Supplier" audits)
//   asl        Approved Supplier List
// Path: src/components/modules/supplierAssessment/SupplierStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo } from 'react';
import { EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { AUDIT_AREAS } from '../complianceAudit/types';
import {
  STATUS_COLORS, APPROVAL_COLORS, RATING_COLORS, approvalLabel, filterSuppliers, supplierSummary, summarizeSites, areaName, formatDMY,
} from './types';
import type { SupplierRow, ExtAudit } from './types';
import { font, CONTROL_H, inputStyle, th, td, card, cardTitle } from '../livingWage/ui';

export type SupplierView = 'dashboard' | 'analysis' | 'asl';

interface Props {
  view: SupplierView;
  rows: SupplierRow[];          // all suppliers (newest first)
  asl: SupplierRow[];
  audits: ExtAudit[];           // external audits from complianceaudit
  search: string;
  onSearch: (s: string) => void;
  onEdit: (supplierId: string) => void;
  onAdd: () => void;
}

const pill = (t: string, bg: string, color: string) => (
  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>{t}</span>
);
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
const empty = (text: string) => <div style={{ ...card, color: '#64748b', fontFamily: font, fontSize: 13 }}>{text}</div>;
const certText = (r: SupplierRow) => (r.certs.length ? r.certs.map(x => `${x.c.name}${x.state === 'expired' ? ' (expired)' : ''}`).join(', ') : '—');

export default function SupplierStatement({ view, rows, asl, audits, search, onSearch, onEdit, onAdd }: Props) {
  const filtered = useMemo(() => filterSuppliers(rows, search), [rows, search]);
  const sum = useMemo(() => supplierSummary(rows), [rows]);
  const sites = useMemo(() => summarizeSites(audits), [audits]);

  const an = useMemo(() => {
    const latest = sites.map(s => s.latest);
    const sev = { critical: 0, major: 0, minor: 0 };
    const byArea: Record<string, number> = {};
    const refCount = new Map<string, number>();
    latest.forEach(a => {
      sev.critical += a.critical; sev.major += a.major; sev.minor += a.minor;
      Object.entries(a.byArea).forEach(([k, v]) => { byArea[k] = (byArea[k] ?? 0) + v; });
    });
    audits.forEach(a => a.refs.forEach(p => refCount.set(p, (refCount.get(p) ?? 0) + 1)));
    const ratings: Record<string, number> = { Good: 0, Satisfactory: 0, 'Needs Improvement': 0, 'High Risk': 0 };
    latest.forEach(a => { ratings[a.rating] = (ratings[a.rating] ?? 0) + 1; });
    const avgScore = latest.length ? Math.round((latest.reduce((s, a) => s + a.score, 0) / latest.length) * 10) / 10 : null;
    return {
      sev, byArea, ratings, avgScore, pastDue: latest.reduce((s, a) => s + a.pastDue, 0),
      topRefs: Array.from(refCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8), unmatched: sites.filter(s => !s.supplierCode).length,
    };
  }, [sites, audits]);

  // ───────── DASHBOARD ─────────
  if (view === 'dashboard') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {kpi('Total suppliers', sum.total)}
          {kpi('Approved suppliers', sum.approved, '#15803d')}
          {kpi('Conditional approval', sum.conditional, '#92400e')}
          {kpi('Not approved', sum.notApproved, sum.notApproved ? '#b91c1c' : '#15803d')}
          {kpi('Under assessment', sum.pending, '#3730a3')}
          {kpi('Certificates expired / due soon', `${sum.certExpired} / ${sum.certDueSoon}`, sum.certExpired ? '#b91c1c' : sum.certDueSoon ? '#92400e' : '#15803d')}
        </div>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
          <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ ...cardTitle, marginRight: 'auto' }}>Supplier assessments</div>
            <div style={{ minWidth: 240 }}>
              <input aria-label="Search supplier" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search supplier..." autoComplete="off"
                style={{ ...inputStyle, height: CONTROL_H, background: search.trim() ? '#eff6ff' : '#fff', borderColor: search.trim() ? '#93c5fd' : '#cbd5e1' }} />
            </div>
            <button type="button" onClick={onAdd} style={{ height: CONTROL_H, padding: '0 14px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontFamily: font, cursor: 'pointer', fontWeight: 700 }}>+ Add Supplier</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
              <thead><tr>{['SL', 'Supplier', 'Category', 'Score', 'Result', 'Status', 'Assessed by / date', 'Certificates', 'Buyers', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={10} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>{rows.length === 0 ? 'No suppliers yet — use “নতুন অ্যাসেসমেন্ট” to add the first one.' : 'No suppliers match the search'}</td></tr>}
                {filtered.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ ...td, ...wrap }}><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 10.5, color: '#64748b' }}>{r.code}{r.contact ? ` · ${r.contact}` : ''}</div></td>
                    <td style={{ ...td, ...wrap }}>{r.category || '—'}</td>
                    <td style={td}>{r.pq.scored ? <><strong>{r.pq.total}</strong>/100</> : '—'}</td>
                    <td style={td}>{r.pq.result === 'Pending' ? '—' : pill(approvalLabel(r.pq.result), APPROVAL_COLORS[r.pq.result].bg, APPROVAL_COLORS[r.pq.result].color)}</td>
                    <td style={td}>{pill(r.status, STATUS_COLORS[r.status].bg, STATUS_COLORS[r.status].color)}</td>
                    <td style={td}>{r.assessedBy || '—'}<div style={{ fontSize: 10.5, color: '#64748b' }}>{formatDMY(r.assessmentDate) || '—'}</div></td>
                    <td style={{ ...td, ...wrap, fontSize: 11.5, color: r.certIssue === 'expired' ? '#b91c1c' : undefined }}>{certText(r)}</td>
                    <td style={{ ...td, ...wrap, fontSize: 11.5 }}>{r.buyers.length ? r.buyers.map(b => b.name).join(', ') : '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}><button type="button" onClick={() => onEdit(r.id)} title="Edit supplier" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ───────── ASSESSMENT ANALYSIS (external audits) ─────────
  if (view === 'analysis') {
    if (audits.length === 0) return empty('No external supplier audit found. This page is built from the Compliance Audit module — save an audit of type “External for Supplier” there and it appears here.');
    const totalNc = an.sev.critical + an.sev.major + an.sev.minor;
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {kpi('External audits', audits.length)}
          {kpi('Sites / suppliers audited', sites.length)}
          {kpi('Average latest score', an.avgScore === null ? '—' : `${an.avgScore}/100`)}
          {kpi('Critical NCs (latest)', an.sev.critical, an.sev.critical ? '#b91c1c' : '#15803d')}
          {kpi('Major NCs (latest)', an.sev.major, an.sev.major ? '#c2410c' : '#15803d')}
          {kpi('Minor NCs (latest)', an.sev.minor, '#92400e')}
          {kpi('NCs past timeline (latest)', an.pastDue, an.pastDue ? '#b91c1c' : '#15803d')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
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

        <div style={{ ...card, marginTop: 10, padding: 0, overflow: 'hidden' }}>
          <div style={{ ...cardTitle, padding: '12px 14px 4px' }}>Audited sites — latest audit (weakest first)</div>
          {an.unmatched > 0 && <div style={{ fontSize: 11.5, color: '#92400e', fontFamily: font, padding: '0 14px 6px' }}>⚠ {an.unmatched} site(s) do not match a supplier name in this module — spell the company / site name the same way in both modules to link them.</div>}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 950 }}>
              <thead><tr>{['Site / supplier', 'Audits', 'Latest round', 'Audit date', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Past timeline', 'Trend'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {sites.map(s => {
                  const a = s.latest, rc = RATING_COLORS[a.rating] ?? { bg: '#f1f5f9', color: '#475569' };
                  const d = s.prevScore === null ? null : a.score - s.prevScore;
                  return (
                    <tr key={s.key}>
                      <td style={{ ...td, ...wrap, fontWeight: 600 }}>{s.site}<div style={{ fontSize: 10.5, color: s.supplierCode ? '#15803d' : '#92400e' }}>{s.supplierCode ? `${s.supplierCode} · in supplier list` : 'not in supplier list'}</div></td>
                      <td style={td}>{s.audits}</td><td style={td}>{a.round || '—'}</td><td style={td}>{formatDMY(a.auditDate) || '—'}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{a.score}</td><td style={td}>{pill(a.rating, rc.bg, rc.color)}</td>
                      <td style={{ ...td, color: a.critical ? '#b91c1c' : undefined, fontWeight: a.critical ? 700 : 400 }}>{a.critical}</td><td style={td}>{a.major}</td><td style={td}>{a.minor}</td>
                      <td style={{ ...td, color: a.pastDue ? '#b91c1c' : undefined, fontWeight: a.pastDue ? 700 : 400 }}>{a.pastDue}</td>
                      <td style={{ ...td, color: d === null ? '#94a3b8' : d >= 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{d === null ? '—' : `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...card, marginTop: 10, padding: 0, overflow: 'hidden' }}>
          <div style={{ ...cardTitle, padding: '12px 14px 4px' }}>Audit history ({audits.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
              <thead><tr>{['Site / supplier', 'Round', 'Audit date', 'Auditing areas', 'Auditors', 'Score', 'Rating', 'NCs (C / M / m)'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {audits.map(a => {
                  const rc = RATING_COLORS[a.rating] ?? { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <tr key={a.id}>
                      <td style={{ ...td, ...wrap, fontWeight: 600 }}>{a.site}</td><td style={td}>{a.round || '—'}</td><td style={td}>{formatDMY(a.auditDate) || '—'}</td>
                      <td style={td} title={a.areas.map(areaName).join('; ')}>{a.areas.length ? a.areas.join(', ') : '—'}</td><td style={{ ...td, ...wrap }}>{a.auditors || '—'}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{a.score}</td><td style={td}>{pill(a.rating, rc.bg, rc.color)}</td>
                      <td style={td}>{a.critical} / {a.major} / {a.minor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ───────── APPROVED SUPPLIER LIST ─────────
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'clip' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0', fontSize: 12.5, color: '#475569', fontFamily: font }}>
        Approved and conditionally approved suppliers — {asl.length} on the list. The result comes from the assessment score; Conditional suppliers have a key-area or score gap to close.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
          <thead><tr>{['SL', 'Supplier ID', 'Supplier', 'Supplier type', 'Score', 'Approval', 'Assessed by / date', 'Certificates', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {asl.length === 0 && <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: '#64748b', padding: 30, fontWeight: 600 }}>No approved suppliers yet</td></tr>}
            {asl.map((r, i) => (
              <Fragment key={r.id || i}>
                {(i === 0 || asl[i - 1].category !== r.category) && <tr><td colSpan={9} style={{ ...td, background: '#f1f5f9', fontWeight: 700, color: '#1e3a5f' }}>{r.category || '(No category)'}</td></tr>}
                <tr>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{i + 1}</td><td style={td}>{r.code}</td>
                  <td style={{ ...td, ...wrap, fontWeight: 600 }}>{r.name}</td><td style={{ ...td, ...wrap }}>{r.businessType || '—'}</td>
                  <td style={td}>{r.pq.total}/100</td>
                  <td style={td}>{pill(r.status, STATUS_COLORS[r.status].bg, STATUS_COLORS[r.status].color)}</td>
                  <td style={td}>{r.assessedBy || '—'}<div style={{ fontSize: 10.5, color: '#64748b' }}>{formatDMY(r.assessmentDate) || '—'}</div></td>
                  <td style={{ ...td, ...wrap, fontSize: 11.5 }}>
                    {r.certs.length === 0 ? '—' : r.certs.map((x, k) => (
                      <div key={k} style={{ color: EXPIRY_STATUS_STYLE[x.state].color }}>{x.c.name}{x.c.validUntil ? ` · ${formatDMY(x.c.validUntil)}` : ''}</div>
                    ))}
                  </td>
                  <td style={{ ...td, textAlign: 'center' }}><button type="button" onClick={() => onEdit(r.id)} title="Edit supplier" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button></td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}