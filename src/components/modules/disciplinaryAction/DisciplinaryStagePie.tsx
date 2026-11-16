// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryStagePie.tsx — small ring that shows one KPI's share of all cases (percentage in the centre).
// Used inside each KPI tile of the Statement, so every tile carries its own percentage.
// Pure SVG (no chart library).
// Path: src/components/modules/disciplinaryAction/DisciplinaryStagePie.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { font } from './formStyles';

const SIZE = 46;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export function ShareRing({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const label = clamped === 0 ? '0%' : clamped < 1 ? '<1%' : `${Math.round(clamped)}%`;
  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label} of all cases`} style={{ flex: 'none' }}>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="#fff" stroke="#e2e8f0" strokeWidth={STROKE} />
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={color} strokeWidth={STROKE}
        strokeDasharray={`${(clamped / 100) * CIRC} ${CIRC}`} strokeLinecap="butt"
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="10" fontWeight="700"
        fill="#0f172a" fontFamily={font} style={{ fontVariantNumeric: 'tabular-nums' }}>{label}</text>
    </svg>
  );
}