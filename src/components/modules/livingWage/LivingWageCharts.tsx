// ─────────────────────────────────────────────────────────────────────────────
// LivingWageCharts.tsx — charts & dashboard page (bar, pie/donut, histogram, line).
// Plain SVG, no chart library. Follows the wage-gap filters (entries) and prints A4 landscape.
// NO id="printable-area" here — LivingWageManager wraps it.
// Path: src/components/modules/livingWage/LivingWageCharts.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import type { LivingWageData, GapEntry } from './types';
import { COST_COMPONENTS, computeLivingWage, gapStats, departmentSummary, parseAmount, money, formatDMY, todayIso } from './types';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { font, card, cardTitle } from './ui';

const RED = '#dc2626', GREEN = '#16a34a', AMBER = '#f59e0b', BLUE = '#2563eb';
const PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569', '#dc2626'];
const W = 640;

const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n * 10) / 10));
function niceTop(max: number): number {
  if (!(max > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function Empty({ text }: { text: string }) {
  return <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontFamily: font, fontSize: 12.5 }}>{text}</div>;
}

// ─── Bar chart (single or two series, optional reference line) ───────────────

interface BarItem { label: string; value: number; color?: string; value2?: number; color2?: string }

function BarChart({ items, refLine, refLabel, height = 270 }: { items: BarItem[]; refLine?: number; refLabel?: string; height?: number }) {
  if (!items.length) return <Empty text="No data to chart." />;
  const H = height, padL = 48, padR = 14, padT = 18, padB = items.length > 6 ? 66 : 44;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = Math.max(...items.flatMap(i => [i.value, i.value2 ?? 0]), refLine ?? 0);
  const top = niceTop(maxV);
  const y = (v: number) => padT + plotH * (1 - v / top);
  const band = plotW / items.length;
  const two = items.some(i => i.value2 !== undefined);
  const bw = Math.min(46, band * (two ? 0.34 : 0.6));
  const rotate = items.length > 6;
  const ticks = [0, 1, 2, 3, 4].map(k => (top * k) / 4);
  const base = padT + plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: 'block', fontFamily: font }}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#64748b">{short(t)}</text>
        </g>
      ))}
      {items.map((it, i) => {
        const cx = padL + band * i + band / 2;
        const bars = [{ v: it.value, c: it.color ?? BLUE, dx: two ? -bw / 2 - 1 : 0 }];
        if (two) bars.push({ v: it.value2 ?? 0, c: it.color2 ?? GREEN, dx: bw / 2 + 1 });
        const label = it.label.length > 14 ? `${it.label.slice(0, 13)}…` : it.label;
        const ly = base + 14;
        return (
          <g key={i}>
            {bars.map((b, k) => (
              <g key={k}>
                <rect x={cx + b.dx - bw / 2} y={y(b.v)} width={bw} height={Math.max(0, base - y(b.v))} fill={b.c} rx="2" />
                {items.length <= 12 && b.v > 0 && <text x={cx + b.dx} y={y(b.v) - 4} textAnchor="middle" fontSize="9.5" fill="#334155">{short(b.v)}</text>}
              </g>
            ))}
            <text x={cx} y={ly} textAnchor={rotate ? 'end' : 'middle'} fontSize="10.5" fill="#334155" transform={rotate ? `rotate(-35 ${cx} ${ly})` : undefined}>{label}</text>
          </g>
        );
      })}
      <line x1={padL} x2={W - padR} y1={base} y2={base} stroke="#94a3b8" />
      {refLine !== undefined && refLine > 0 && (
        <g>
          <line x1={padL} x2={W - padR} y1={y(refLine)} y2={y(refLine)} stroke={RED} strokeWidth="1.6" strokeDasharray="6 4" />
          {refLabel && <text x={W - padR} y={y(refLine) - 5} textAnchor="end" fontSize="10.5" fontWeight="700" fill={RED}>{refLabel}</text>}
        </g>
      )}
    </svg>
  );
}

// ─── Line graph ──────────────────────────────────────────────────────────────

function LineChart({ values, refLine, xLabel }: { values: number[]; refLine?: number; xLabel: string }) {
  if (values.length < 2) return <Empty text="Not enough data for a line graph." />;
  const H = 270, padL = 48, padR = 14, padT = 18, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const step = Math.ceil(values.length / 240);
  const pts = values.filter((_, i) => i % step === 0 || i === values.length - 1);
  const top = niceTop(Math.max(...pts, refLine ?? 0));
  const x = (i: number) => padL + (plotW * i) / (pts.length - 1);
  const y = (v: number) => padT + plotH * (1 - v / top);
  const base = padT + plotH;
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`;
  const ticks = [0, 1, 2, 3, 4].map(k => (top * k) / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: 'block', fontFamily: font }}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#64748b">{short(t)}</text>
        </g>
      ))}
      <path d={area} fill="#dbeafe" opacity="0.7" />
      <path d={line} fill="none" stroke={BLUE} strokeWidth="2" />
      {refLine !== undefined && refLine > 0 && (
        <g>
          <line x1={padL} x2={W - padR} y1={y(refLine)} y2={y(refLine)} stroke={RED} strokeWidth="1.6" strokeDasharray="6 4" />
          <text x={W - padR} y={y(refLine) - 5} textAnchor="end" fontSize="10.5" fontWeight="700" fill={RED}>Living wage {short(refLine)}</text>
        </g>
      )}
      <line x1={padL} x2={W - padR} y1={base} y2={base} stroke="#94a3b8" />
      <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#64748b">{xLabel}</text>
    </svg>
  );
}

// ─── Donut (pie) ─────────────────────────────────────────────────────────────

interface Slice { label: string; value: number; color: string }

function Donut({ slices, centerTop, centerBottom }: { slices: Slice[]; centerTop: string; centerBottom: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!(total > 0)) return <Empty text="No data to chart." />;
  const r = 70, sw = 30, C = 2 * Math.PI * r;
  let acc = 0;
  const arcs = slices.filter(s => s.value > 0).map(s => {
    const len = (s.value / total) * C;
    const el = <circle key={s.label} cx="100" cy="100" r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
    acc += len;
    return el;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center', fontFamily: font }}>
      <svg viewBox="0 0 200 200" width="190" height="190" role="img">
        <g transform="rotate(-90 100 100)">{arcs}</g>
        <text x="100" y="98" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e3a5f">{centerTop}</text>
        <text x="100" y="116" textAnchor="middle" fontSize="10.5" fill="#64748b">{centerBottom}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
        {slices.filter(s => s.value > 0).map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#334155' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', paddingLeft: 10, fontWeight: 700, color: '#1e3a5f' }}>{short(s.value)} · {((s.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function histogram(values: number[], living: number, bins = 8): BarItem[] {
  if (!values.length) return [];
  const min = Math.min(...values), max = Math.max(...values);
  if (min === max) return [{ label: short(min), value: values.length, color: min >= living ? GREEN : RED }];
  const width = (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);
  values.forEach(v => { counts[Math.min(bins - 1, Math.floor((v - min) / width))]++; });
  return counts.map((c, k) => {
    const lo = min + k * width, hi = lo + width;
    return { label: `${short(lo)}–${short(hi)}`, value: c, color: hi <= living ? RED : lo >= living ? GREEN : AMBER };
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface Props { data: LivingWageData; entries: GapEntry[]; datasetLabel: string; }

export default function LivingWageCharts({ data, entries, datasetLabel }: Props) {
  const calc  = useMemo(() => computeLivingWage(data), [data]);
  const lw    = calc.amount;
  const stats = useMemo(() => gapStats(entries), [entries]);
  const depts = useMemo(() => departmentSummary(entries), [entries]);
  const wages = useMemo(() => entries.map(e => e.gap.actualWage).sort((a, b) => a - b), [entries]);
  const meets = stats.n - stats.below;

  const sizeBars = useMemo(() => {
    const counts = new Map<number, number>();
    data.surveys.forEach(s => { const n = Math.round(parseAmount(s.actualFamilySize) ?? 0); if (n > 0) counts.set(n, (counts.get(n) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => a[0] - b[0]).map(([n, c]) => ({ label: `${n} members`, value: c, color: BLUE }));
  }, [data.surveys]);

  const costSlices: Slice[] = [
    ...COST_COMPONENTS.map((c, k) => ({ label: c.label, value: calc.inputs.costs[c.key], color: PALETTE[k % PALETTE.length] })),
    { label: 'Contingency margin', value: calc.margin, color: '#94a3b8' },
  ];

  const kpi = (label: string, value: string, color = '#1e3a5f') => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: font }}>{value}</div>
    </div>
  );
  const panel = (title: string, body: React.ReactNode) => (
    <div style={{ ...card, marginBottom: 0, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <div style={{ ...cardTitle, marginBottom: 8 }}>{title}</div>
      {body}
    </div>
  );
  const noWages = entries.length === 0;
  const noWageMsg = <Empty text="No employee / worker wage data to compare." />;

  return (
    <div className="bg-white max-w-full mx-auto" style={{ padding: 14, fontFamily: font }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>{data.factoryName || 'FACTORY NAME'}</div>
        <div style={{ fontSize: 11 }}>{data.factoryAddress}</div>
        <div style={{ fontSize: 15, fontWeight: 700, textDecoration: 'underline', marginTop: 6 }}>Living Wage — Charts &amp; Dashboard</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
          {data.location} · {data.studyYear} · Living wage Tk {money(lw)} / month · Compared with: {datasetLabel} · {formatDMY(data.date || todayIso())}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {kpi('Living wage (Tk)', money(lw))}
        {kpi('People compared', String(stats.n))}
        {kpi('Below living wage', `${stats.below}${stats.n ? ` (${((stats.below / stats.n) * 100).toFixed(0)}%)` : ''}`, stats.below ? RED : GREEN)}
        {kpi('Average / median gross', `${short(stats.avgActual)} / ${short(stats.median)}`)}
        {kpi('Cost to close gap / month', money(stats.shortfallTotal), stats.shortfallTotal ? RED : GREEN)}
        {kpi('Survey entries', `${calc.derived.n} / ${data.surveys.length}`)}
      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        .lwc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 12px; }
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .lwc-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="lwc-grid print-content">
        {panel('Below vs meets the living wage', noWages ? noWageMsg : (
          <Donut slices={[{ label: 'Below', value: stats.below, color: RED }, { label: 'Meets', value: meets, color: GREEN }]} centerTop={`${stats.n ? Math.round((stats.below / stats.n) * 100) : 0}%`} centerBottom="below" />
        ))}

        {panel('Average gross salary by department', noWages ? noWageMsg : (
          <BarChart items={depts.map(d => ({ label: d.department, value: d.avgGross, color: d.avgGross >= lw ? GREEN : RED }))} refLine={lw} refLabel={`Living wage ${short(lw)}`} />
        ))}

        {panel('People below the living wage, by department (%)', noWages ? noWageMsg : (
          <BarChart items={depts.map(d => ({ label: d.department, value: d.count ? (d.below / d.count) * 100 : 0, color: AMBER }))} />
        ))}

        {panel('Gross salary distribution', noWages ? noWageMsg : <BarChart items={histogram(wages, lw)} />)}

        {panel('Wage ladder (lowest to highest salary)', noWages ? noWageMsg : (
          <LineChart values={wages} refLine={lw} xLabel="People, sorted by gross salary (low → high)" />
        ))}

        {panel('Family cost build-up (Anker)', calc.totalFamilyCost > 0
          ? <Donut slices={costSlices} centerTop={short(calc.totalFamilyCost)} centerBottom="family cost / month" />
          : <Empty text="Available with the Full Calculator method (add survey data first)." />)}

        {panel('Survey: average household spending per item (Tk)', calc.derived.n > 0
          ? <BarChart items={COST_COMPONENTS.map((c, k) => ({ label: c.label, value: calc.derived.costs[c.key].raw, color: PALETTE[k % PALETTE.length] }))} />
          : <Empty text="No valid survey entries yet." />)}

        {panel('Survey: family size distribution', sizeBars.length ? <BarChart items={sizeBars} /> : <Empty text="No valid survey entries yet." />)}
      </div>
    </div>
  );
}