// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditDashboard.tsx — status dashboard of ONE audit (picked from a list):
// score gauge, KPI cards, severity pie, NC-by-area bars, due-date status bars, top NCs,
// plus a score comparison across the saved audits. Black / white / gray only.
// Path: src/components/modules/complianceAudit/ComplianceAuditDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import type { Ref } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import type { AuditScore, ComplianceAuditData, CorrectiveActionItem, Severity } from './types';
import { AUDIT_AREAS, computeAuditScore, daysBetween, findPointByRef, formatDMY, parseAreas, parseNcItems, timelineIso, todayIso } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const INK = '#111827', MUTED = '#6b7280', BORDER = '#e5e7eb';
const SEV_SHADE: Record<Severity, string> = { Critical: '#111827', Major: '#6b7280', Minor: '#d1d5db' };
const SEV_RANK: Record<Severity, number> = { Critical: 0, Major: 1, Minor: 2 };

const PRINT_RULES = `
    .dsh-page { padding: 0; }
    .dsh-noprint { display: none !important; }
    .dsh-page .dsh-head { display: block; margin-bottom: 8px; padding-bottom: 4px; }
    .dsh-head h1 { font-size: 15px; }
    .dsh-head h2 { margin: 3px 0 1px; font-size: 12px; }
    .dsh-head p { font-size: 10px; margin: 1px 0 0; }
    .dsh-kpis { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; margin-bottom: 6px; }
    .dsh-kpi { padding: 4px 8px; border-color: #9ca3af; }
    .dsh-kpi b { font-size: 16px; }
    .dsh-kpi span { font-size: 9.5px; }
    .dsh-kpi .rt { font-size: 12px !important; line-height: 18px !important; }
    .dsh-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .dsh-card { padding: 8px; border-color: #9ca3af; box-shadow: none; break-inside: avoid; page-break-inside: avoid; }
    .dsh-card h3 { font-size: 11px; margin-bottom: 4px; }
    .dsh-row { font-size: 10px; margin: 4px 0; }
    .dsh-row .l { width: min(var(--lw, 118px), 240px); }
    .dsh-tbl { font-size: 10px; }
    .dsh-tbl th, .dsh-tbl td { padding: 3px 6px; }
    .dsh-wide { break-inside: avoid; page-break-inside: avoid; }
    .dsh-g { max-width: 130px !important; }
    .dsh-d { width: 86px; height: 86px; }
    .dsh-note { font-size: 9px !important; }
`;
/** Same compact layout, scoped to .dsh-pdf so the direct PDF export (html2canvas) matches Print. */
const PDF_RULES = PRINT_RULES.replace(/^\s*([^{\n]+)\{/gm, (_m, sel: string) => sel.split(',').map(x => '.dsh-pdf ' + x.trim().replace(/^\.dsh-page\s*/, '')).join(', ') + ' {');

const CSS = `
  .dsh-page { padding: 6px 8px 10px; }
  .dsh { font-family: ${font}; color: ${INK}; line-height: 1.35; }
  .dsh * { box-sizing: border-box; }
  .dsh, .dsh * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* header toolbar (screen only) */
  .dsh-tool { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; padding: 6px 12px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
  .dsh-tool label { font-size: 11px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .04em; }
  .dsh-sel { height: 34px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; font-size: 12.5px; font-weight: 600; background: #fff; color: ${INK}; min-width: 260px; max-width: 100%; flex: 1 1 260px; outline: none; }
  .dsh-sel:focus { border-color: ${INK}; box-shadow: 0 0 0 3px rgba(17,24,39,.15); }
  .dsh-chip { font-size: 11.5px; font-weight: 600; padding: 3px 10px; border: 1px solid ${BORDER}; border-radius: 999px; background: #f9fafb; color: #374151; white-space: nowrap; }
  .dsh-pill { display: inline-block; font-size: 11.5px; font-weight: 800; padding: 3px 12px; border-radius: 999px; background: ${INK}; color: #fff; letter-spacing: .02em; white-space: nowrap; }

  /* report header: shown when printing / exporting to PDF only */
  .dsh-sheet { background: #fff; }
  .dsh-page .dsh-head { display: none; }
  .dsh-head { text-align: center; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #000; }
  .dsh-head h1 { margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; }
  .dsh-head p { margin: 2px 0 0; font-size: 11.5px; }
  .dsh-head h2 { margin: 8px 0 2px; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; }
  .dsh-page .dsh-exporting .dsh-head { display: block; }

  .dsh-grid { display: grid; gap: 8px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 1099px) { .dsh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .dsh-grid { grid-template-columns: minmax(0, 1fr); } }
  .dsh-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; margin-top: 6px; font-size: 11.5px; color: ${MUTED}; }
  .dsh-kpis { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); margin-bottom: 8px; }
  .dsh-card { background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; padding: 10px 12px; box-shadow: 0 1px 2px rgba(15,23,42,.04); min-width: 0; }
  .dsh-card h3 { margin: 0 0 6px; font-size: 13px; line-height: 18px; font-weight: 700; position: relative; padding-left: 12px; }
  .dsh-card h3 i { display: none; }
  .dsh-card h3::before { content: ''; position: absolute; left: 0; top: 2px; width: 4px; height: 14px; border-radius: 2px; background: ${INK}; }
  .dsh-kpi { background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; padding: 7px 10px; }
  .dsh-kpi b { display: block; font-size: 22px; line-height: 1.15; }
  .dsh-kpi span { font-size: 11.5px; color: ${MUTED}; font-weight: 600; }
  .dsh-row { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 20px; min-height: 20px; margin: 6px 0; }
  .dsh-row .l { width: var(--lw, 118px); flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 20px; height: 20px; }
  .dsh-row .t { flex: 1; height: 16px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .dsh-row .t > div { height: 100%; border-radius: 4px; }
  .dsh-row .v { line-height: 20px; width: 34px; text-align: right; font-weight: 700; flex: none; }
  .dsh-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .dsh-tbl th { text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #4b5563; background: #f9fafb; border-bottom: 1px solid ${BORDER}; }
  .dsh-tbl td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .dsh-wide { grid-column: 1 / -1; }

  @page { size: A4 landscape; margin: 12mm; }
  @media print {
${PRINT_RULES}
  }
  ${PDF_RULES}
`;;

interface View { key: string; title: string; site: string; auditDate: string; areas: string[]; ncs: CorrectiveActionItem[]; }

const ALL = '__all__';
const filled = (c: CorrectiveActionItem) => Boolean(c.ncRef.trim() || c.detailsOfNonCompliance.trim());
const sevOf = (c: CorrectiveActionItem): Severity => c.severity || 'Minor';

function fromRecord(rec: DbRecord): View {
  const auditDate = String(rec.auditDate ?? '').slice(0, 10);
  const site = String(rec.siteName ?? '') || '—';
  return {
    key: String(rec.id ?? ''),
    title: `${site} — ${String(rec.auditRound ?? '')}${auditDate ? ` — ${formatDMY(auditDate)}` : ''}`,
    site, auditDate, areas: parseAreas(rec.auditingAreasJson), ncs: parseNcItems(rec.correctiveActionsJson).filter(filled),
  };
}
function fromForm(d: ComplianceAuditData): View {
  return {
    key: '__current__', title: `Current form${d.siteName ? ` — ${d.siteName}` : ''} (not saved)`, site: d.siteName || '—',
    auditDate: d.auditDate, areas: d.auditingAreas, ncs: d.correctiveActions.filter(filled),
  };
}

// ─── Charts ──────────────────────────────────────────────────────────────────

function Gauge({ score }: { score: number }) {
  return (
    <svg className="dsh-g" viewBox="0 0 200 118" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }} role="img" aria-label={`Audit score ${score} of 100`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" pathLength={100} />
      {score > 0 && <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="round" pathLength={100} strokeDasharray={`${score} 100`} />}
      {[60, 75, 90].map(b => {
        const t = Math.PI * (1 - b / 100), c = Math.cos(t), s = Math.sin(t);
        return <line key={b} x1={100 + 68 * c} y1={100 - 68 * s} x2={100 + 92 * c} y2={100 - 92 * s} stroke="#fff" strokeWidth="3" />;
      })}
      <text x="100" y="88" textAnchor="middle" fontSize="38" fontWeight="800" fill={INK}>{score}</text>
      <text x="100" y="108" textAnchor="middle" fontSize="11" fill={MUTED}>out of 100</text>
    </svg>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg className="dsh-d" viewBox="0 0 140 140" width="150" height="150" role="img" aria-label="Non-compliances by severity">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f3f4f6" strokeWidth="26" />
        {total > 0 && parts.filter(p => p.value > 0).map(p => {
          const len = (p.value / total) * C;
          const el = <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="26" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />;
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="24" fontWeight="800" fill={INK}>{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill={MUTED}>total NC</text>
      </svg>
      <div style={{ fontSize: 12.5 }}>
        {parts.map(p => (
          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '5px 0' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: p.color, border: '1px solid #9ca3af', display: 'inline-block' }} />
            <span style={{ width: 62 }}>{p.label}</span><b>{p.value}</b>
            <span style={{ color: MUTED }}>{total ? Math.round((p.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const W = 320, H = 170, pad = 22, bw = Math.min(40, (W - pad * 2) / data.length - 10);
  const step = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Non-compliances by area">
      <line x1={pad} x2={W - pad} y1={H - 26} y2={H - 26} stroke="#d1d5db" />
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 70);
        const x = pad + step * i + (step - bw) / 2;
        return (
          <g key={d.label}>
            <rect x={x} y={H - 26 - h} width={bw} height={Math.max(h, d.value ? 2 : 0)} rx="4" fill={d.value ? '#374151' : '#e5e7eb'} />
            <text x={x + bw / 2} y={H - 30 - h} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>{d.value}</text>
            <text x={x + bw / 2} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBars({ rows, highlight, labelWidth }: { rows: { label: string; value: number; max?: number; key?: string }[]; highlight?: string; labelWidth?: number }) {
  const max = Math.max(1, ...rows.map(r => r.max ?? r.value));
  return (
    <div>
      {rows.map(r => (
        <div className="dsh-row" key={r.key ?? r.label}>
          <div className="l" title={r.label} style={labelWidth ? ({ '--lw': `${labelWidth}px` } as React.CSSProperties) : undefined}>{r.label}</div>
          <div className="t"><div style={{ width: `${(r.value / max) * 100}%`, background: highlight && r.key === highlight ? INK : '#9ca3af' }} /></div>
          <div className="v">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

interface Props { records: DbRecord[]; current: ComplianceAuditData; /** ref + id of the printable sheet, so the Manager's Print / PDF buttons pick it up */ printRef?: Ref<HTMLDivElement>; }

export default function ComplianceAuditDashboard({ records, current, printRef }: Props) {
  const [sel, setSel] = useState('');

  const saved = useMemo(() => records.map(fromRecord), [records]);
  const formView = useMemo(() => fromForm(current), [current]);
  const hasForm = formView.ncs.length > 0 || formView.site !== '—';
  // "All audits" = every saved audit together (due dates are resolved per audit first).
  const allView = useMemo<View | null>(() => saved.length === 0 ? null : {
    key: ALL, title: `All audits — summary (${saved.length})`, site: 'All audits', auditDate: '',
    areas: Array.from(new Set(saved.flatMap(v => v.areas))),
    ncs: saved.flatMap(v => v.ncs.map(c => ({ ...c, timeline: timelineIso(c.timeline, v.auditDate) }))),
  }, [saved]);
  const options = [...(allView ? [allView] : []), ...(hasForm ? [formView] : []), ...saved];
  const view = options.find(o => o.key === sel) ?? options.find(o => o.key !== ALL) ?? options[0];
  const isAll = view?.key === ALL;

  const rows = useMemo(() => saved.map(v => ({ v, a: computeAuditScore(v.ncs) }))
    .sort((a, b) => b.v.auditDate.localeCompare(a.v.auditDate)), [saved]);
  const ranked = rows.slice(0, isAll ? 12 : 8);

  if (!view) {
    return <div className="dsh"><style>{CSS}</style><div className="dsh-card" style={{ textAlign: 'center', color: MUTED, padding: 36 }}>No audit to show yet — fill the form or save an audit first.</div></div>;
  }

  const audit: AuditScore = isAll
    ? (() => {
        const sum = (k: 'minor' | 'major' | 'critical' | 'total') => rows.reduce((s, r) => s + r.a[k], 0);
        const score = rows.length ? Math.round(rows.reduce((s, r) => s + r.a.score, 0) / rows.length) : 100;
        return { score, minor: sum('minor'), major: sum('major'), critical: sum('critical'), total: sum('total'),
          rating: sum('critical') > 0 && score >= 75 ? 'Needs Improvement' : score >= 90 ? 'Good' : score >= 75 ? 'Satisfactory' : score >= 60 ? 'Needs Improvement' : 'High Risk' };
      })()
    : computeAuditScore(view.ncs);
  const scoreLabel = isAll ? 'Average score' : 'Audit score';
  const today = todayIso();

  const byArea = [...AUDIT_AREAS.map(a => a.code), 'Other'].map(code => ({
    label: code, value: view.ncs.filter(c => (findPointByRef(c.ncRef)?.area ?? 'Other') === code).length,
  }));

  const due = (c: CorrectiveActionItem) => timelineIso(c.timeline, view.auditDate);
  const dueDays = (c: CorrectiveActionItem) => { const iso = due(c); return iso ? daysBetween(today, iso) : null; };
  const status = [
    { label: 'Overdue', value: view.ncs.filter(c => (dueDays(c) ?? 0) < 0).length },
    { label: 'Due in 30 days', value: view.ncs.filter(c => { const d = dueDays(c); return d !== null && d >= 0 && d <= 30; }).length },
    { label: 'Due later', value: view.ncs.filter(c => (dueDays(c) ?? -1) > 30).length },
    { label: 'No date set', value: view.ncs.filter(c => dueDays(c) === null).length },
  ];
  const overdue = status[0].value;

  const top = [...view.ncs].sort((a, b) => SEV_RANK[sevOf(a)] - SEV_RANK[sevOf(b)] || (due(a) || '9').localeCompare(due(b) || '9')).slice(0, 8);
  const coveredCount = AUDIT_AREAS.filter(a => view.areas.includes(a.label)).length;

  return (
    <div className="dsh-page dsh">
      <style>{CSS}</style>

      <div className="dsh-tool dsh-noprint">
        <label htmlFor="dsh-sel">Audit</label>
        <select id="dsh-sel" className="dsh-sel" value={view.key} onChange={e => setSel(e.target.value)}>
          {options.map(o => <option key={o.key} value={o.key}>{o.title}</option>)}
        </select>
        <span className="dsh-chip">{view.site}</span>
        {isAll ? <span className="dsh-chip">{saved.length} audits · {audit.total} NC</span> : view.auditDate ? <span className="dsh-chip">Audit date {formatDMY(view.auditDate)}</span> : null}
        <span className="dsh-pill" style={{ marginLeft: 'auto' }}>{audit.rating} · {audit.score}/100</span>
      </div>

      <div ref={printRef} id="printable-area" className="dsh-sheet dsh">
      <div className="dsh-head">
        <h1>{current.factoryName || 'FACTORY NAME'}</h1>
        {current.factoryAddress && <p>{current.factoryAddress}</p>}
        <h2>Compliance Audit Dashboard</h2>
        <p><b>{view.site}</b>{isAll ? ` · ${saved.length} audits` : view.auditDate ? ` · Audit date ${formatDMY(view.auditDate)}` : ''} · Printed {formatDMY(today)}</p>
      </div>

      <div className="dsh-kpis">
        <div className="dsh-kpi"><b>{audit.score}/100</b><span>{scoreLabel}</span></div>
        <div className="dsh-kpi"><b className="rt" style={{ fontSize: 16, lineHeight: '26px' }}>{audit.rating}</b><span>Rating</span></div>
        <div className="dsh-kpi"><b>{isAll ? saved.length : audit.total}</b><span>{isAll ? 'Audits' : 'Total NC'}</span></div>
        <div className="dsh-kpi"><b>{audit.critical}</b><span>Critical</span></div>
        <div className="dsh-kpi"><b>{audit.major}</b><span>Major</span></div>
        <div className="dsh-kpi"><b>{audit.minor}</b><span>Minor</span></div>
        <div className="dsh-kpi"><b>{overdue}</b><span>Overdue NC</span></div>
        <div className="dsh-kpi"><b>{coveredCount}/{AUDIT_AREAS.length}</b><span>Areas audited</span></div>
      </div>

      <div className="dsh-grid">
        <div className="dsh-card"><h3><i />{scoreLabel}</h3><Gauge score={audit.score} />
          <div className="dsh-note" style={{ textAlign: 'center', fontSize: 11.5, color: MUTED, marginTop: 4 }}>{isAll ? 'Average of all saved audit scores' : '100 − (Critical×10 + Major×5 + Minor×2)'}</div>
          <div className="dsh-legend dsh-note"><span>Good ≥ 90</span><span>Satisfactory 75–89</span><span>Needs Improvement 60–74</span><span>High Risk &lt; 60</span></div></div>

        <div className="dsh-card"><h3><i />NC by severity</h3>
          <Donut parts={[{ label: 'Critical', value: audit.critical, color: SEV_SHADE.Critical }, { label: 'Major', value: audit.major, color: SEV_SHADE.Major }, { label: 'Minor', value: audit.minor, color: SEV_SHADE.Minor }]} /></div>

        <div className="dsh-card"><h3><i />NC by checklist area</h3><ColumnChart data={byArea} />
          <div className="dsh-note" style={{ fontSize: 11, color: MUTED }}>{AUDIT_AREAS.map(a => `${a.code} = ${a.name}`).join(' · ')}</div></div>

        <div className="dsh-card"><h3><i />Due-date status</h3><HBars rows={status} /></div>

        {isAll && (
          <div className="dsh-card dsh-wide"><h3><i />All audits — summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="dsh-tbl">
                <thead><tr><th>Site</th><th>Round</th><th>Date</th><th>Score</th><th>Rating</th><th>Critical</th><th>Major</th><th>Minor</th><th>Total NC</th></tr></thead>
                <tbody>
                  {rows.map(({ v, a }) => (
                    <tr key={v.key}>
                      <td style={{ fontWeight: 700 }}>{v.site}</td>
                      <td>{v.title.split(' — ')[1] || '—'}</td>
                      <td>{v.auditDate ? formatDMY(v.auditDate) : '—'}</td>
                      <td style={{ fontWeight: 700 }}>{a.score}</td><td>{a.rating}</td>
                      <td>{a.critical}</td><td>{a.major}</td><td>{a.minor}</td><td>{a.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isAll && <div className="dsh-card dsh-wide"><h3><i />Highest-priority non-compliances</h3>
          {top.length === 0 ? <div style={{ color: MUTED, fontSize: 12.5 }}>No non-compliances recorded.</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dsh-tbl">
                <thead><tr><th>NC ID</th><th>Severity</th><th>NC Ref</th><th>Due</th></tr></thead>
                <tbody>
                  {top.map((c, i) => {
                    const s = sevOf(c), d = dueDays(c), iso = due(c);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 700 }}>{c.ncId || '—'}</td>
                        <td><span style={{ background: s === 'Critical' ? INK : s === 'Major' ? '#fff' : '#f3f4f6', color: s === 'Critical' ? '#fff' : INK, border: `1px solid ${s === 'Minor' ? '#d1d5db' : INK}`, borderRadius: 999, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{s}</span></td>
                        <td>{findPointByRef(c.ncRef)?.point ?? (c.ncRef || '—')}</td>
                        <td>{iso ? `${formatDMY(iso)} (${d !== null && d < 0 ? `${-d} days overdue` : `${d} days left`})` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>}

        {ranked.length > 1 && (
          <div className="dsh-card dsh-wide"><h3><i />Audit score — {isAll ? 'all saved audits (latest 12)' : 'recent saved audits'}</h3>
            <HBars highlight={view.key} labelWidth={280} rows={ranked.map(r => ({ key: r.v.key, label: r.v.title, value: r.a.score, max: 100 }))} />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}