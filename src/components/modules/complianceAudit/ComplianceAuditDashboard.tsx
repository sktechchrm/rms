// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditDashboard.tsx — status dashboard of ONE audit (picked from a list):
// key findings, score gauge, KPI cards, severity pie, NC-by-area stacked bars, due-date
// status bars, top NCs, score trend, plus a score comparison across the saved audits.
// Black / white / gray only (prints cleanly on a black-and-white printer).
// Path: src/components/modules/complianceAudit/ComplianceAuditDashboard.tsx
//
// PRINT: A4 LANDSCAPE (PAGE_A4_LANDSCAPE). The printable sheet is #printable-area; on screen
// it is a white "paper" card with solid padding, in print the padding is dropped and the page
// margin comes from @page. The Manager must print / export this view in landscape too.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import type { Ref } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import type { AuditScore, ComplianceAuditData, CorrectiveActionItem, Severity } from './types';
import { AUDIT_AREAS, computeAuditScore, daysBetween, findPointByRef, formatDMY, parseAreas, parseNcItems, timelineIso, todayIso } from './types';
import { PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

const font = "'Noto Sans Bengali', Arial, sans-serif";
const INK = '#111827', MUTED = '#6b7280', BORDER = '#e5e7eb';
const SEV_SHADE: Record<Severity, string> = { Critical: '#111827', Major: '#6b7280', Minor: '#d1d5db' };
const SEV_RANK: Record<Severity, number> = { Critical: 0, Major: 1, Minor: 2 };
const SEVERITIES: Severity[] = ['Critical', 'Major', 'Minor'];

const CSS = `
  ${PAGE_A4_LANDSCAPE}
  .dsh { font-family: ${font}; color: ${INK}; padding: 20px 24px 32px; }
  .dsh * { box-sizing: border-box; }

  /* Screen: picker bar and the sheet are white cards with solid padding */
  .dsh-bar { display: flex; gap: 10px 16px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; padding: 12px 16px; background: #fff; border: 1px solid ${BORDER}; border-radius: 12px; }
  .dsh-sel { height: 36px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; font-size: 12.5px; background: #fff; color: ${INK}; min-width: 280px; max-width: 100%; }
  .dsh-sel:focus-visible { outline: 2px solid ${INK}; outline-offset: 1px; }
  .dsh-sheet { background: #fff; border: 1px solid ${BORDER}; border-radius: 12px; padding: 26px 30px 22px; box-shadow: 0 1px 3px rgba(15,23,42,.06); }

  .dsh-head { text-align: center; padding-bottom: 10px; margin-bottom: 14px; border-bottom: 2px solid #000; }
  .dsh-head h1 { margin: 0; font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; }
  .dsh-head p { margin: 3px 0 0; font-size: 11.5px; }
  .dsh-head h2 { margin: 9px 0 3px; font-size: 14.5px; text-decoration: underline; text-underline-offset: 3px; }

  .dsh-sum { border: 1px solid ${BORDER}; border-left: 4px solid ${INK}; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; background: #f9fafb; }
  .dsh-sum h3 { margin: 0 0 4px; font-size: 12.5px; font-weight: 800; }
  .dsh-sum ul { margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.55; }

  .dsh-kpis { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); margin-bottom: 14px; }
  .dsh-kpi { background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; padding: 10px 12px; }
  .dsh-kpi b { display: block; font-size: 22px; line-height: 1.15; }
  .dsh-kpi span { font-size: 11.5px; color: ${MUTED}; font-weight: 600; }
  .dsh-kpi .d { display: block; font-size: 10.5px; font-weight: 700; color: ${INK}; margin-top: 2px; }

  .dsh-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .dsh-two  { display: grid; gap: 14px; grid-template-columns: 3fr 2fr; margin-top: 14px; }
  .dsh-card { background: #fff; border: 1px solid ${BORDER}; border-radius: 10px; padding: 14px 16px; min-width: 0; }
  .dsh-card h3 { margin: 0 0 10px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .dsh-card h3 i { width: 4px; height: 14px; border-radius: 2px; background: ${INK}; display: inline-block; }
  .dsh-wide { grid-column: 1 / -1; margin-top: 14px; }
  .dsh-grid > .dsh-wide { margin-top: 0; }

  .dsh-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 6px 0; }
  .dsh-row .l { width: 118px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dsh-row .t { flex: 1; height: 16px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .dsh-row .t > div { height: 100%; border-radius: 4px; }
  .dsh-row .v { width: 34px; text-align: right; font-weight: 700; flex: none; }

  .dsh-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
  .dsh-tbl th { text-align: left; padding: 7px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #4b5563; background: #f9fafb; border-bottom: 1px solid ${BORDER}; }
  .dsh-tbl td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }

  .dsh-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; color: ${MUTED}; margin-top: 6px; }
  .dsh-legend span { display: inline-flex; align-items: center; gap: 5px; }
  .dsh-legend i { width: 10px; height: 10px; border-radius: 2px; border: 1px solid #9ca3af; display: inline-block; }
  .dsh-chips { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
  .dsh-chips span { min-width: 30px; text-align: center; padding: 2px 7px; border-radius: 999px; font-size: 10.5px; font-weight: 700; border: 1px solid #d1d5db; color: ${MUTED}; background: #fff; }
  .dsh-chips span.on { background: ${INK}; color: #fff; border-color: ${INK}; }
  .dsh-foot { margin-top: 14px; padding-top: 8px; border-top: 1px solid ${BORDER}; font-size: 10.5px; color: ${MUTED}; line-height: 1.5; }

  .dsh, .dsh * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @media (max-width: 900px) { .dsh { padding: 14px 12px 24px; } .dsh-sheet { padding: 16px 14px; } .dsh-two { grid-template-columns: 1fr; } }

  @media print {
    body * { visibility: hidden !important; }
    #printable-area, #printable-area * { visibility: visible !important; }
    #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #fff !important; }

    .dsh { padding: 0; }
    .dsh-noprint { display: none !important; }
    .dsh-sheet { padding: 0; border: none; border-radius: 0; box-shadow: none; }

    .dsh-head { padding-bottom: 4px; margin-bottom: 8px; }
    .dsh-head h1 { font-size: 15px; }
    .dsh-head h2 { margin: 3px 0 1px; font-size: 12px; }
    .dsh-head p { font-size: 10px; margin: 1px 0 0; }

    .dsh-sum { padding: 5px 10px; margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid; }
    .dsh-sum h3 { font-size: 10.5px; margin-bottom: 2px; }
    .dsh-sum ul { font-size: 10px; line-height: 1.4; }

    .dsh-kpis { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; margin-bottom: 8px; }
    .dsh-kpi { padding: 4px 8px; border-color: #9ca3af; }
    .dsh-kpi b { font-size: 16px; }
    .dsh-kpi span { font-size: 9.5px; }
    .dsh-kpi .d { font-size: 8.5px; }
    .dsh-kpi .rt { font-size: 12px !important; line-height: 18px !important; }

    .dsh-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .dsh-two { grid-template-columns: 3fr 2fr; gap: 8px; margin-top: 8px; }
    .dsh-card { padding: 8px; border-color: #9ca3af; box-shadow: none; break-inside: avoid; page-break-inside: avoid; }
    .dsh-card h3 { font-size: 11px; margin-bottom: 4px; }
    .dsh-wide, .dsh-grid > .dsh-wide { margin-top: 8px; break-inside: avoid; page-break-inside: avoid; }
    .dsh-row { font-size: 10px; margin: 4px 0; }
    .dsh-row .l { width: 70px; }
    .dsh-tbl { font-size: 10px; }
    .dsh-tbl th, .dsh-tbl td { padding: 3px 6px; }
    .dsh-g { max-width: 130px !important; }
    .dsh-d { width: 86px; height: 86px; }
    .dsh-note, .dsh-legend { font-size: 9px !important; }
    .dsh-chips span { font-size: 9px; padding: 1px 6px; }
    .dsh-foot { margin-top: 8px; padding-top: 4px; font-size: 8.5px; }
  }
`;

interface View { key: string; title: string; site: string; auditDate: string; areas: string[]; ncs: CorrectiveActionItem[]; }
interface AreaStat { label: string; name: string; critical: number; major: number; minor: number; total: number; }

const ALL = '__all__';
const filled = (c: CorrectiveActionItem) => Boolean(c.ncRef.trim() || c.detailsOfNonCompliance.trim());
const sevOf = (c: CorrectiveActionItem): Severity => c.severity || 'Minor';
/** 'DD-MM-YYYY' → 'DD-MM-YY' for tight chart labels. */
const shortDmy = (iso: string) => { const d = formatDMY(iso); return d.length === 10 ? `${d.slice(0, 6)}${d.slice(8)}` : d; };

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
  // Tick marks at the rating boundaries (60 / 75 / 90).
  const tick = (s: number) => {
    const a = Math.PI * (1 - s / 100);
    const p = (r: number) => `${(100 + r * Math.cos(a)).toFixed(1)} ${(100 - r * Math.sin(a)).toFixed(1)}`;
    return <line key={s} x1={p(70).split(' ')[0]} y1={p(70).split(' ')[1]} x2={p(91).split(' ')[0]} y2={p(91).split(' ')[1]} stroke="#fff" strokeWidth="2" />;
  };
  return (
    <svg className="dsh-g" viewBox="0 0 200 118" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }} role="img" aria-label={`Audit score ${score} of 100`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" pathLength={100} />
      {score > 0 && <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="round" pathLength={100} strokeDasharray={`${score} 100`} />}
      {[60, 75, 90].map(tick)}
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

/** One column per checklist area, stacked by severity (Critical at the bottom). */
function StackedColumns({ data }: { data: AreaStat[] }) {
  const max = Math.max(1, ...data.map(d => d.total));
  const W = 320, H = 170, pad = 22;
  const step = (W - pad * 2) / data.length;
  const bw = Math.min(40, step - 10);
  const base = H - 26, scale = (H - 70) / max;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Non-compliances by area and severity">
      <line x1={pad} x2={W - pad} y1={base} y2={base} stroke="#d1d5db" />
      {data.map((d, i) => {
        const x = pad + step * i + (step - bw) / 2;
        let acc = 0;
        return (
          <g key={d.label}>
            {d.total === 0 && <rect x={x} y={base - 2} width={bw} height="2" fill="#e5e7eb" />}
            {SEVERITIES.map(sv => {
              const v = sv === 'Critical' ? d.critical : sv === 'Major' ? d.major : d.minor;
              if (!v) return null;
              const h = v * scale;
              const el = <rect key={sv} x={x} y={base - acc - h} width={bw} height={h} fill={SEV_SHADE[sv]} stroke="#fff" strokeWidth="0.8"><title>{`${d.name}: ${v} ${sv}`}</title></rect>;
              acc += h;
              return el;
            })}
            <text x={x + bw / 2} y={base - acc - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>{d.total}</text>
            <text x={x + bw / 2} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Audit score over time (oldest → newest). The selected audit is drawn as a ringed point. */
function TrendChart({ points, current }: { points: { key: string; label: string; score: number }[]; current: string }) {
  const W = 360, H = 176, padX = 30, padT = 18, padB = 32;
  const n = points.length;
  const x = (i: number) => padX + (n === 1 ? 0 : (i / (n - 1)) * (W - padX * 2));
  const y = (s: number) => padT + (1 - s / 100) * (H - padT - padB);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Audit score trend">
      {[60, 75, 90].map(g => (
        <g key={g}>
          <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="#e5e7eb" strokeDasharray="3 3" />
          <text x={padX - 6} y={y(g) + 3} textAnchor="end" fontSize="9.5" fill={MUTED}>{g}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#374151" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => {
        const on = p.key === current;
        return (
          <g key={p.key}>
            <circle cx={x(i)} cy={y(p.score)} r={on ? 5.5 : 3.5} fill={on ? INK : '#fff'} stroke={INK} strokeWidth="2" />
            <text x={x(i)} y={y(p.score) - 9} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={INK}>{p.score}</text>
            {(n <= 6 || i % 2 === 0 || on) && <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="9.5" fill={MUTED}>{p.label}</text>}
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
          <div className="l" title={r.label} style={labelWidth ? { width: labelWidth } : undefined}>{r.label}</div>
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

  // Newest first.
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

  // ── Areas, due dates, priority list ──
  const byArea: AreaStat[] = [...AUDIT_AREAS.map(a => ({ code: a.code, name: a.name })), { code: 'Other', name: 'Other / not mapped' }].map(a => {
    const list = view.ncs.filter(c => (findPointByRef(c.ncRef)?.area ?? 'Other') === a.code);
    return {
      label: a.code, name: a.name, total: list.length,
      critical: list.filter(c => sevOf(c) === 'Critical').length,
      major: list.filter(c => sevOf(c) === 'Major').length,
      minor: list.filter(c => sevOf(c) === 'Minor').length,
    };
  });

  const due = (c: CorrectiveActionItem) => timelineIso(c.timeline, view.auditDate);
  const dueDays = (c: CorrectiveActionItem) => { const iso = due(c); return iso ? daysBetween(today, iso) : null; };
  const status = [
    { label: 'Overdue', value: view.ncs.filter(c => (dueDays(c) ?? 0) < 0).length },
    { label: 'Due in 30 days', value: view.ncs.filter(c => { const d = dueDays(c); return d !== null && d >= 0 && d <= 30; }).length },
    { label: 'Due later', value: view.ncs.filter(c => (dueDays(c) ?? -1) > 30).length },
    { label: 'No date set', value: view.ncs.filter(c => dueDays(c) === null).length },
  ];
  const overdue = status[0].value;
  const noDate = status[3].value;

  const top = [...view.ncs].sort((a, b) => SEV_RANK[sevOf(a)] - SEV_RANK[sevOf(b)] || (due(a) || '9').localeCompare(due(b) || '9')).slice(0, 8);
  const coveredCount = AUDIT_AREAS.filter(a => view.areas.includes(a.label)).length;
  const notCovered = AUDIT_AREAS.filter(a => !view.areas.includes(a.label));

  // ── Change since the previous audit of the same site, and the score trend ──
  const prev = !isAll && view.auditDate
    ? rows.find(r => r.v.key !== view.key && r.v.site === view.site && r.v.auditDate && r.v.auditDate < view.auditDate)
    : undefined;
  const delta = prev ? audit.score - prev.a.score : null;
  const deltaText = delta === null ? '' : delta === 0 ? 'No change vs previous audit' : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} vs previous audit`;

  const trendRows = [...(isAll ? rows : rows.filter(r => r.v.site === view.site))].filter(r => r.v.auditDate).reverse().slice(-10);
  const trend = trendRows.map(r => ({ key: r.v.key, label: shortDmy(r.v.auditDate), score: r.a.score }));
  const showTrend = trend.length >= 2;

  // ── Key findings (plain-language summary) ──
  const worst = [...byArea].sort((a, b) => b.total - a.total)[0];
  const upcoming = view.ncs.map(c => ({ c, d: dueDays(c) })).filter(x => x.d !== null && (x.d as number) >= 0)
    .sort((a, b) => (a.d as number) - (b.d as number))[0];
  const findings: string[] = [
    `${audit.rating}: ${scoreLabel.toLowerCase()} ${audit.score} out of 100${deltaText ? ` (${deltaText.replace('▲ ', 'up ').replace('▼ ', 'down ')})` : ''}.`,
    audit.total === 0
      ? 'No non-compliances are recorded.'
      : `${audit.total} non-compliance${audit.total === 1 ? '' : 's'}: ${audit.critical} critical, ${audit.major} major, ${audit.minor} minor${worst && worst.total > 0 ? `. Most are in ${worst.label} (${worst.name}): ${worst.total}` : ''}.`,
    overdue > 0
      ? `${overdue} non-compliance${overdue === 1 ? ' is' : 's are'} overdue${upcoming ? `; the next deadline is ${formatDMY(due(upcoming.c))} (${upcoming.d} day${upcoming.d === 1 ? '' : 's'} left)` : ''}.`
      : upcoming ? `Nothing is overdue; the next deadline is ${formatDMY(due(upcoming.c))} (${upcoming.d} day${upcoming.d === 1 ? '' : 's'} left).` : 'Nothing is overdue.',
  ];
  if (noDate > 0) findings.push(`${noDate} non-compliance${noDate === 1 ? ' has' : 's have'} no due date set.`);
  if (!isAll && notCovered.length > 0) findings.push(`Checklist areas not audited: ${notCovered.map(a => a.code).join(', ')}.`);

  return (
    <div className="dsh">
      <style>{CSS}</style>

      <div className="dsh-bar dsh-noprint">
        <label style={{ fontSize: 12.5, fontWeight: 700 }} htmlFor="dsh-sel">Audit</label>
        <select id="dsh-sel" className="dsh-sel" value={view.key} onChange={e => setSel(e.target.value)}>
          {options.map(o => <option key={o.key} value={o.key}>{o.title}</option>)}
        </select>
        <span style={{ fontSize: 12, color: MUTED }}>{view.site}{isAll ? ` · ${saved.length} audits · ${audit.total} NC` : view.auditDate ? ` · Audit date ${formatDMY(view.auditDate)}` : ''}</span>
      </div>

      <div ref={printRef} id="printable-area" className="dsh-sheet">
        <div className="dsh-head">
          <h1>{current.factoryName || 'FACTORY NAME'}</h1>
          {current.factoryAddress && <p>{current.factoryAddress}</p>}
          <h2>Compliance Audit Dashboard</h2>
          <p><b>{view.site}</b>{isAll ? ` · ${saved.length} audits` : view.auditDate ? ` · Audit date ${formatDMY(view.auditDate)}` : ''} · Printed {formatDMY(today)}</p>
        </div>

        {/* <div className="dsh-sum">
          <h3>Key findings</h3>
          <ul>{findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div> */}

        <div className="dsh-kpis">
          <div className="dsh-kpi"><b>{audit.score}/100</b><span>{scoreLabel}</span>{deltaText && <span className="d">{deltaText}</span>}</div>
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
            <div className="dsh-note" style={{ textAlign: 'center', fontSize: 11.5, color: MUTED, marginTop: 4 }}>
              {isAll ? 'Average of all saved audit scores' : '100 − (Critical×10 + Major×5 + Minor×2)'}
            </div>
            <div className="dsh-legend" style={{ justifyContent: 'center' }}>
              <span>Good ≥ 90</span><span>Satisfactory 75–89</span><span>Needs Improvement 60–74</span><span>High Risk &lt; 60</span>
            </div></div>

          <div className="dsh-card"><h3><i />NC by severity</h3>
            <Donut parts={[{ label: 'Critical', value: audit.critical, color: SEV_SHADE.Critical }, { label: 'Major', value: audit.major, color: SEV_SHADE.Major }, { label: 'Minor', value: audit.minor, color: SEV_SHADE.Minor }]} /></div>

          <div className="dsh-card"><h3><i />NC by checklist area</h3><StackedColumns data={byArea} />
            <div className="dsh-legend">{SEVERITIES.map(sv => <span key={sv}><i style={{ background: SEV_SHADE[sv] }} />{sv}</span>)}</div>
            <div className="dsh-chips" aria-label="Areas audited">
              {AUDIT_AREAS.map(a => <span key={a.code} className={view.areas.includes(a.label) ? 'on' : ''} title={`${a.name}${view.areas.includes(a.label) ? ' — audited' : ' — not audited'}`}>{a.code}</span>)}
            </div>
            <div className="dsh-note" style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{AUDIT_AREAS.map(a => `${a.code} = ${a.name}`).join(' · ')}</div></div>

          <div className="dsh-card"><h3><i />Due-date status</h3><HBars rows={status} /></div>
        </div>

        <div className="dsh-two" style={showTrend ? undefined : { gridTemplateColumns: '1fr' }}>
          {isAll ? (
            <div className="dsh-card"><h3><i />All audits — summary</h3>
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
          ) : (
            <div className="dsh-card"><h3><i />Highest-priority non-compliances</h3>
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
            </div>
          )}

          {showTrend && (
            <div className="dsh-card"><h3><i />Score trend{isAll ? ' — all audits' : ` — ${view.site}`}</h3>
              <TrendChart points={trend} current={view.key} />
              <div className="dsh-note" style={{ fontSize: 11, color: MUTED }}>Oldest to newest, last {trend.length} audits. Dashed lines mark the rating bands (60 / 75 / 90).</div>
            </div>
          )}
        </div>

        {ranked.length > 1 && (
          <div className="dsh-card dsh-wide"><h3><i />Audit score — {isAll ? 'all saved audits (latest 12)' : 'recent saved audits'}</h3>
            <HBars highlight={view.key} labelWidth={280} rows={ranked.map(r => ({ key: r.v.key, label: r.v.title, value: r.a.score, max: 100 }))} />
          </div>
        )}

        <div className="dsh-foot">
          Score = 100 − (Critical×10 + Major×5 + Minor×2). Rating bands: Good ≥ 90 · Satisfactory 75–89 · Needs Improvement 60–74 · High Risk &lt; 60.
          Due dates are counted from today ({formatDMY(today)}).
        </div>
      </div>
    </div>
  );
}