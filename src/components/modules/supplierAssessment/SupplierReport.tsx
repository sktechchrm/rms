// ─────────────────────────────────────────────────────────────────────────────
// SupplierReport.tsx — the Supplier Assessment Report of ONE supplier (screen + print / PDF use the same component).
//
// Built from the supplier's saved assessment AND every external audit of that site in the Compliance Audit module:
//   Executive summary  — score gauge, result, risk level (with the reasons) and the decision the evidence supports
//   A  Supplier profile
//   B  Audit history   — every audit, score trend, severity counts
//   C  Findings analysis — severity, area, repeat findings, past-timeline
//   D  Key findings    — Critical and Major NCs of the latest audit
//   E  Assessment scorecard (the ten areas)
//   F  Approval decision
//   G  Method / basis of this report
// Also exports <AuditEvidence> (executive summary + history), used inside the Supplier form once an audit is picked.
// Print-safe: only borders + light fills, blocks never split across pages.
// Path: src/components/modules/supplierAssessment/SupplierReport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  isManualArea, MAX_TOTAL, SOON_DAYS, STATUS_COLORS, RATING_COLORS, RISK_COLORS, approvalLabel, formatDMY, areaName, scoreFrom, suggestedStatus,
} from './types';
import type { SupplierRow, SiteSummary, ExtAudit, ExtNc, SupplierStatus, PartScore } from './types';
import { font } from '../livingWage/ui';

const INK = '#0f172a', MUTED = '#64748b', LINE = '#e2e8f0', NAVY = '#1e3a5f';
const exact: CSSProperties = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as CSSProperties;
const wrap: CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const avoid: CSSProperties = { breakInside: 'avoid', pageBreakInside: 'avoid' };
const SEV_COLORS: Record<string, { bg: string; color: string }> = {
  Critical: { bg: '#fee2e2', color: '#b91c1c' }, Major: { bg: '#ffedd5', color: '#c2410c' }, Minor: { bg: '#fef3c7', color: '#92400e' },
};
const scoreColor = (n: number) => (n >= 85 ? '#16a34a' : n >= 70 ? '#f59e0b' : '#dc2626');
const rankOf = (s: SupplierStatus | string) => (s === 'Approved' ? 2 : s === 'Conditional' ? 1 : 0);

const Pill = ({ text, bg, color }: { text: string; bg: string; color: string }) => (
  <span style={{ ...exact, display: 'inline-block', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: bg, color, whiteSpace: 'nowrap', fontFamily: font }}>{text}</span>
);

function Section({ n, title, children, split = false }: { n: string; title: string; children: ReactNode; split?: boolean }) {
  return (
    <section style={{ marginTop: 14, ...(split ? {} : avoid) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `2px solid ${NAVY}`, paddingBottom: 4, marginBottom: 8, breakAfter: 'avoid', pageBreakAfter: 'avoid' }}>
        <span style={{ ...exact, background: NAVY, color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 4, padding: '1px 7px', fontFamily: font }}>{n}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: NAVY, fontFamily: font }}>{title}</span>
      </div>
      {children}
    </section>
  );
}

const Kv = ({ label, value }: { label: string; value: ReactNode }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 600, fontFamily: font }}>{label}</div>
    <div style={{ fontSize: 12.5, color: INK, fontFamily: font, ...wrap }}>{value || '—'}</div>
  </div>
);

/** Semi-circle gauge. */
function Gauge({ value, max, label }: { value: number | null; max: number; label: string }) {
  const R = 52, C = 60, pct = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const a = Math.PI * (1 - pct), ex = C + R * Math.cos(a), ey = C - R * Math.sin(a);
  return (
    <svg width={124} height={86} viewBox="0 0 120 80" role="img" aria-label={`${label}: ${value ?? 'not scored'}`} style={exact}>
      <path d={`M ${C - R} ${C} A ${R} ${R} 0 0 1 ${C + R} ${C}`} fill="none" stroke="#e2e8f0" strokeWidth={10} strokeLinecap="round" />
      {value !== null && pct > 0 && <path d={`M ${C - R} ${C} A ${R} ${R} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`} fill="none" stroke={scoreColor((value / max) * 100)} strokeWidth={10} strokeLinecap="round" />}
      <text x={C} y={C - 8} textAnchor="middle" fontSize={22} fontWeight={800} fill={INK} fontFamily={font}>{value ?? '—'}</text>
      <text x={C} y={C + 8} textAnchor="middle" fontSize={9} fill={MUTED} fontFamily={font}>{label}</text>
    </svg>
  );
}

/** Small donut ring: score out of max, the score in the centre. */
function Ring({ value, max, size = 62 }: { value: number | null; max: number; size?: number }) {
  const sw = 8, rad = (size - sw) / 2, circ = 2 * Math.PI * rad, pct = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value ?? 'not scored'} of ${max}`} style={{ ...exact, flex: '0 0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
      {value !== null && pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={rad} fill="none" stroke={scoreColor(pct * 100)} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(circ * pct).toFixed(2)} ${circ.toFixed(2)}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.26} fontWeight={800} fill={INK} fontFamily={font}>{value ?? '—'}</text>
    </svg>
  );
}

/** Score history, oldest → newest. */
function Sparkline({ audits }: { audits: ExtAudit[] }) {
  const pts = [...audits].reverse();
  if (pts.length < 2) return <div style={{ fontSize: 11.5, color: MUTED, fontFamily: font }}>Trend appears after the second audit.</div>;
  const W = 260, H = 64, pad = 10;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (pts.length - 1);
  const y = (v: number) => H - pad - (Math.max(0, Math.min(100, v)) / 100) * (H - 2 * pad);
  return (
    <svg width={W} height={H + 14} viewBox={`0 0 ${W} ${H + 14}`} role="img" aria-label="Audit score trend" style={exact}>
      <line x1={pad} x2={W - pad} y1={y(75)} y2={y(75)} stroke="#cbd5e1" strokeDasharray="3 3" />
      <polyline points={pts.map((p, i) => `${x(i)},${y(p.score)}`).join(' ')} fill="none" stroke={NAVY} strokeWidth={2} />
      {pts.map((p, i) => (
        <g key={p.id || i}>
          <circle cx={x(i)} cy={y(p.score)} r={3.5} fill={scoreColor(p.score)} stroke="#fff" strokeWidth={1} />
          <text x={x(i)} y={y(p.score) - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK} fontFamily={font}>{p.score}</text>
          <text x={x(i)} y={H + 11} textAnchor="middle" fontSize={8} fill={MUTED} fontFamily={font}>{formatDMY(p.auditDate).slice(0, 5) || '—'}</text>
        </g>
      ))}
    </svg>
  );
}

const Bar = ({ label, count, total, color, w = 130 }: { label: string; count: number; total: number; color: string; w?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontFamily: font, marginBottom: 3 }}>
    <span style={{ width: w, color: '#475569', flex: '0 0 auto' }}>{label}</span>
    <div style={{ ...exact, height: 8, background: LINE, borderRadius: 4, flex: 1, minWidth: 40 }}><div style={{ ...exact, width: `${total ? (count / total) * 100 : 0}%`, height: 8, borderRadius: 4, background: color }} /></div>
    <span style={{ width: 24, textAlign: 'right', fontWeight: 700 }}>{count}</span>
  </div>
);

const th: CSSProperties = { ...exact, textAlign: 'left', padding: '5px 7px', fontSize: 11, fontWeight: 700, background: '#f1f5f9', border: `1px solid ${LINE}`, fontFamily: font, color: NAVY };
const td: CSSProperties = { padding: '5px 7px', fontSize: 11.5, border: `1px solid ${LINE}`, verticalAlign: 'top', fontFamily: font, ...wrap };

// ─── Audit evidence: executive summary + history (also used in the form) ─────

export function AuditEvidence({ site, status, parts, overall, compact = false }: { site: SiteSummary; status: SupplierStatus; parts?: PartScore[]; overall?: number | null; compact?: boolean }) {
  const a = site.latest, r = site.risk, rc = RISK_COLORS[r.level], rt = RATING_COLORS[a.rating] ?? { bg: '#f1f5f9', color: '#475569' };
  const delta = site.prevScore === null ? null : a.score - site.prevScore;
  const lenient = rankOf(status) > rankOf(r.hint);
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', fontFamily: font }}>
      {!compact && <>
      <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
        <Gauge value={a.score} max={100} label="Latest audit score" />
        <div style={{ marginTop: 2 }}><Pill text={a.rating} bg={rt.bg} color={rt.color} /></div>
        {delta !== null && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: delta >= 0 ? '#15803d' : '#b91c1c' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs previous audit</div>}
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>Risk level</span>
          <Pill text={r.level} bg={rc.bg} color={rc.color} />
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginLeft: 6 }}>Evidence supports</span>
          <Pill text={r.hint} bg={STATUS_COLORS[r.hint].bg} color={STATUS_COLORS[r.hint].color} />
        </div>
        <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12, color: '#334155' }}>{r.reasons.map(x => <li key={x}>{x}</li>)}</ul>
        {lenient && <div style={{ ...exact, fontSize: 11.5, fontWeight: 600, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '4px 8px' }}>
          The current status ({status}) is more lenient than the audit evidence ({r.hint}) — record the justification.</div>}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 12 }}>
          <span><strong style={{ color: '#b91c1c' }}>{a.critical}</strong> Critical</span><span><strong style={{ color: '#c2410c' }}>{a.major}</strong> Major</span>
          <span><strong style={{ color: '#92400e' }}>{a.minor}</strong> Minor</span><span><strong style={{ color: a.pastDue ? '#b91c1c' : INK }}>{a.pastDue}</strong> past timeline</span>
          <span><strong>{site.repeat.length}</strong> repeat</span><span><strong>{site.audits}</strong> audit{site.audits === 1 ? '' : 's'} · latest {formatDMY(a.auditDate) || '—'} {a.round && `(${a.round})`}</span>
        </div>
      </div>
      <div style={{ flex: '0 0 auto' }}><Sparkline audits={site.history} /></div>
      </>}
      {parts && (
        <div style={{ flex: '1 1 100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
          {parts.map(p => (
            <div key={p.key} style={{ ...exact, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', background: '#f8fafc' }}>
              <Ring value={p.score} max={p.max} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>{p.label} · {p.short}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: NAVY }}>{p.score ?? '—'}<span style={{ fontSize: 11, color: MUTED }}> / {p.max}</span></div>
                <div style={{ fontSize: 10, color: MUTED }}>{p.auto ? 'Automatic from the audit' : 'Manual assessment'}</div>
              </div>
            </div>
          ))}
          <div style={{ ...exact, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${NAVY}`, borderRadius: 8, padding: '8px 10px', background: '#eef2f7' }}>
            <Ring value={overall ?? null} max={MAX_TOTAL} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>Final compliance score</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: NAVY }}>{overall ?? '—'}<span style={{ fontSize: 11, color: MUTED }}> / {MAX_TOTAL}</span></div>
              <div style={{ fontSize: 10, color: MUTED }}>(Part 1 + Part 2 + Part 3) ÷ 3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── The full report ─────────────────────────────────────────────────────────

const keyFinding = (n: ExtNc, i: number) => (
  <tr key={`${n.ncId}-${i}`} style={avoid}>
    <td style={td}>{n.ncId || '—'}</td>
    <td style={td}>{n.area && <strong>{n.area} · </strong>}{n.point || '—'}</td>
    <td style={td}><Pill text={n.severity} bg={SEV_COLORS[n.severity].bg} color={SEV_COLORS[n.severity].color} /></td>
    <td style={td}>{n.details || '—'}{n.recommendation && <div style={{ color: MUTED, marginTop: 2 }}>Recommendation: {n.recommendation}</div>}</td>
    <td style={td}>{n.responsible || '—'}</td>
    <td style={{ ...td, whiteSpace: 'nowrap', color: n.overdue ? '#b91c1c' : INK, fontWeight: n.overdue ? 700 : 400 }}>{formatDMY(n.timeline) || '—'}{n.overdue && <div>past timeline</div>}</td>
  </tr>
);

export default function SupplierReport({ row, site, today, bordered = true }: { row: SupplierRow; site: SiteSummary | null; today: string; bordered?: boolean }) {
  const sc = scoreFrom(row.overall);
  const stc = STATUS_COLORS[row.state];
  const live = row.status === 'Approved' || row.status === 'Conditional';
  const latest = site?.latest ?? null;
  const key = latest ? latest.ncs.filter(n => n.severity !== 'Minor').sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'Critical' ? -1 : 1)) : [];
  const printing = !bordered;                              // the print / PDF copy shows EVERY finding; the screen shows the first 15
  const shownKey = printing ? key : key.slice(0, 15);
  const totalNc = latest ? latest.critical + latest.major + latest.minor : 0;
  const frame: CSSProperties = bordered ? { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 16px' } : {};
  const parts = row.parts;
  const legacy = row.legacy;
  const evidenceSuggest = site ? site.risk.hint : suggestedStatus(row.overall);

  return (
    <div style={{ ...frame, fontFamily: font, color: INK }}>
      {/* Title block */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 1, fontWeight: 800, color: MUTED }}>SUPPLIER ASSESSMENT REPORT</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, ...wrap }}>{row.name}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{row.code} · {row.category || 'No category'} · {row.businessType}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Pill text={row.state} bg={stc.bg} color={stc.color} />
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Report date: {formatDMY(today)}</div>
        </div>
      </div>

      {/* Executive summary */}
      <Section n="•" title="Executive summary">
        {site ? <AuditEvidence site={site} status={row.status} parts={row.parts} overall={row.overall} /> : (
          <div style={{ fontSize: 12.5, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px' }}>
            No external audit of the Compliance Audit module is linked to this supplier name, so this report uses the entered assessment only. Spell the company / site name the same way in both modules.
          </div>
        )}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 10, fontSize: 12.5 }}>
          <span>Overall compliance score: <strong>{row.overall === null ? '—' : `${row.overall}/${MAX_TOTAL}`}</strong> {row.overall !== null && `(${approvalLabel(sc.result)}, grade ${sc.grade})`}</span>
          <span>Decision on record: <strong>{row.state}</strong></span>
          <span>Supported by evidence: <strong>{evidenceSuggest}</strong></span>
        </div>
      </Section>

      <Section n="A" title="Supplier profile">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          <Kv label="Supplier" value={row.name} /><Kv label="Supplier ID" value={row.code} /><Kv label="Category" value={row.category} /><Kv label="Supplier type" value={row.businessType} />
          <Kv label="Product / service" value={row.product} /><Kv label="Contact person" value={row.contact} /><Kv label="Mobile" value={row.phone} /><Kv label="Email" value={row.email} />
        </div>
        <div style={{ marginTop: 8 }}><Kv label="Factory address" value={row.address} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 8 }}>
          <Kv label="Audit certifications" value={<span style={{ whiteSpace: 'pre-wrap' }}>{row.certificationList}</span>} />
          <Kv label="Brands / buyers" value={<span style={{ whiteSpace: 'pre-wrap' }}>{row.buyerList}</span>} />
        </div>
      </Section>

      <Section n="B" split title="Audit history (Compliance Audit module — External for Supplier)">
        {!site ? <div style={{ fontSize: 12, color: MUTED }}>No audit on record.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ display: 'table-header-group' }}><tr>{['Date', 'Round', 'Auditors', 'Score', 'Rating', 'Critical', 'Major', 'Minor', 'Past timeline', 'Change'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {site.history.map((a, i) => {
                const prev = site.history[i + 1], d = prev ? a.score - prev.score : null, rt = RATING_COLORS[a.rating] ?? { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={a.id || i} style={avoid}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatDMY(a.auditDate) || '—'}</td><td style={td}>{a.round || '—'}</td><td style={td}>{a.auditors || '—'}</td>
                    <td style={{ ...td, fontWeight: 800 }}>{a.score}</td><td style={td}><Pill text={a.rating} bg={rt.bg} color={rt.color} /></td>
                    <td style={td}>{a.critical}</td><td style={td}>{a.major}</td><td style={td}>{a.minor}</td><td style={td}>{a.pastDue}</td>
                    <td style={{ ...td, fontWeight: 700, color: d === null ? MUTED : d >= 0 ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>{d === null ? 'first audit' : `${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section n="C" title="Findings analysis (latest audit)">
        {!site || !latest ? <div style={{ fontSize: 12, color: MUTED }}>No audit findings available.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, marginBottom: 4 }}>By severity ({totalNc} NC{totalNc === 1 ? '' : 's'})</div>
              <Bar label="Critical" count={latest.critical} total={totalNc} color="#b91c1c" /><Bar label="Major" count={latest.major} total={totalNc} color="#c2410c" /><Bar label="Minor" count={latest.minor} total={totalNc} color="#f59e0b" />
              <div style={{ fontSize: 11.5, marginTop: 6, color: '#334155' }}>Past their timeline: <strong style={{ color: latest.pastDue ? '#b91c1c' : INK }}>{latest.pastDue}</strong></div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, marginBottom: 4 }}>By auditing area</div>
              {Object.keys(latest.byArea).length === 0 ? <div style={{ fontSize: 12, color: MUTED }}>No standard-point NCs.</div>
                : Object.entries(latest.byArea).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => <Bar key={k} label={`${k}. ${areaName(k)}`} count={v} total={totalNc} color={NAVY} w={190} />)}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Repeat findings (also in the previous audit)</div>
              {site.repeat.length === 0 ? <div style={{ fontSize: 12, color: MUTED }}>{site.audits < 2 ? 'First audit — nothing to compare.' : 'None.'}</div>
                : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>{site.repeat.map(p => <li key={p}>{p}</li>)}</ul>}
            </div>
          </div>
        )}
      </Section>

      <Section n="D" split title="Key findings — Critical and Major NCs of the latest audit">
        {!site ? <div style={{ fontSize: 12, color: MUTED }}>No audit findings available.</div> : key.length === 0 ? <div style={{ fontSize: 12.5, color: '#15803d', fontWeight: 600 }}>No Critical or Major non-compliance in the latest audit.</div> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ display: 'table-header-group' }}><tr>{['NC ID', 'Point', 'Severity', 'Finding', 'Responsible', 'Timeline'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{shownKey.map(keyFinding)}</tbody>
            </table>
            {key.length > shownKey.length && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>+ {key.length - shownKey.length} more — see the Compliance Audit record and the “Findings” sheet of the Excel export.</div>}
          </>
        )}
      </Section>

      <Section n="E" split title="Assessment scorecard — 3 parts × 100 marks">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
          {parts.map(p => (
            <div key={p.key} style={{ ...exact, border: `1px solid ${LINE}`, borderRadius: 8, padding: '6px 10px', background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{p.score ?? '—'}<span style={{ fontSize: 11, color: MUTED }}> / {p.max}</span></div>
              <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 600 }}>{p.label} · {p.short}</div>
            </div>
          ))}
          <div style={{ ...exact, border: `1px solid ${NAVY}`, borderRadius: 8, padding: '6px 10px', background: '#eef2f7', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>{row.overall ?? '—'}<span style={{ fontSize: 11, color: MUTED }}> / {MAX_TOTAL}</span></div>
            <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 600 }}>Final · {row.overall === null ? '—' : `${approvalLabel(sc.result)} · grade ${sc.grade}`}</div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ display: 'table-header-group' }}><tr><th style={{ ...th, width: 40 }}>SL</th><th style={th}>Audit criteria</th><th style={{ ...th, width: 74 }}>Method</th><th style={{ ...th, width: 50 }}>Marks</th><th style={{ ...th, width: 60 }}>Score</th><th style={{ ...th, width: '28%' }}>Evidence / remark</th></tr></thead>
          <tbody>
            {parts.map(p => (
              <Fragment key={p.key}>
                <tr style={avoid}><td colSpan={6} style={{ ...td, ...exact, background: '#f1f5f9', fontWeight: 800, color: NAVY }}>{p.title}</td></tr>
                {p.defs.map(a => {
                  const na = !legacy && isManualArea(a.key) && row.na[a.key];
                  return (
                    <tr key={a.key} style={avoid}>
                      <td style={td}>{a.no}</td><td style={td}>{a.label}</td><td style={td}>{legacy ? 'Overall split' : isManualArea(a.key) ? 'Manual' : 'Auto'}</td>
                      <td style={td}>{a.max}</td><td style={{ ...td, fontWeight: 700 }}>{na ? 'N/A' : row.areas[a.key] ?? '—'}</td><td style={td}>{row.remarks[a.key] || '—'}</td>
                    </tr>
                  );
                })}
                <tr style={avoid}><td style={td} /><td style={{ ...td, fontWeight: 800 }} colSpan={2}>{p.label} total{p.naCount > 0 && !legacy ? ` (N/A scaled: ${p.applicableMax} applicable marks → 100)` : ''}</td><td style={{ ...td, fontWeight: 800 }}>{p.max}</td><td style={{ ...td, fontWeight: 800 }}>{p.score ?? '—'}</td><td style={td} /></tr>
              </Fragment>
            ))}
            <tr><td style={td} /><td style={{ ...td, fontWeight: 800 }} colSpan={2}>Final score = (Part 1 + Part 2 + Part 3) ÷ 3</td><td style={{ ...td, fontWeight: 800 }}>{MAX_TOTAL}</td><td style={{ ...td, fontWeight: 800 }}>{row.overall ?? '—'}</td><td style={td}>{row.overall === null ? '—' : `${approvalLabel(sc.result)} · grade ${sc.grade}`}</td></tr>
          </tbody>
        </table>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>Part 1 is automatic: the latest Compliance Audit score spread over the criteria by their marks. Parts 2 and 3 are assessor-entered; N/A needs a written justification and the applicable criteria are scaled to 100. Older records show their saved overall score for every part.</div>
      </Section>

      <Section n="F" title="Approval decision">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <Kv label="Status" value={<Pill text={row.state} bg={stc.bg} color={stc.color} />} /><Kv label="Approved by" value={row.approvedBy} /><Kv label="Date of approval" value={formatDMY(row.approvalDate)} />
          <Kv label="Validity" value={row.validityYears === null ? '' : `${row.validityYears} year${row.validityYears === 1 ? '' : 's'}`} />
          <Kv label="Expire on" value={row.expireOn ? `${formatDMY(row.expireOn)}${live && row.daysLeft !== null ? (row.daysLeft < 0 ? ` · expired ${-row.daysLeft}d ago` : row.daysLeft <= SOON_DAYS ? ` · ${row.daysLeft}d left` : '') : ''}` : ''} />
          <Kv label="Assessed by" value={`${row.assessedBy || '—'}${row.assessmentDate ? ` · ${formatDMY(row.assessmentDate)}` : ''}${row.method ? ` · ${row.method}` : ''}`} />
        </div>
      </Section>

      <Section n="G" title="Basis of this report">
        <div style={{ fontSize: 10.5, color: MUTED, lineHeight: 1.5 }}>
          Framework: Global Manufacturing Factory & Supplier Assessment (GMFSA) — three parts of 100 marks; final score = (Part 1 + Part 2 + Part 3) ÷ 3. Result: 85+ Approved · 70–84 Conditional · below 70 Not Approved.
          Audit score = 100 − (Critical × 10 + Major × 5 + Minor × 2); rating 90+ Good · 75+ Satisfactory · 60+ Needs Improvement · below 60 High Risk, and a Critical NC caps the rating at Needs Improvement.
          Risk — Critical: any Critical NC; High: score below 60, 3+ Major NCs or 2+ NCs past timeline; Medium: score below 75, any Major NC, any NC past timeline or any repeat finding; Low: none.
          A Critical non-compliance is a separate critical-risk condition: the supplier is not supported for “Approved” whatever the final average, until it is closed.
          “Past timeline” means the NC's timeline date is earlier than the report date; the Compliance Audit module does not record closure of an NC.
          Benchmarks: ISO 9001 / 14001 / 45001 / 50001 / 22301, amfori BSCI, Sedex SMETA, SA8000, ILO Conventions, IFC EHS Guidelines, NFPA, national building and fire codes. This assessment is not an official certification or a substitute for a standard-specific audit.
        </div>
      </Section>
    </div>
  );
}