// ─────────────────────────────────────────────────────────────────────────────
// SettlementSectionCard.tsx — the section card used by the single and the multi-employee forms
// (header band · dark accent bar · title + hint · optional round icon actions on the right).
// Path: src/components/modules/finalSettlement/SettlementSectionCard.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode, CSSProperties } from 'react';
import { font, card } from '../livingWage/ui';

interface SectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** No inner padding — for cards that hold full-width rows (earnings / deductions). */
  flush?: boolean;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, actions, flush, children }: SectionProps) {
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 0 }}>
          <span aria-hidden="true" style={{ width: 4, borderRadius: 2, background: '#0f172a', flex: 'none' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a', fontFamily: font }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>{actions}</div>}
      </div>
      <div style={flush ? undefined : { padding: 14 }}>{children}</div>
    </div>
  );
}

// ─── Round icon actions (top-right of a section) ─────────────────────────────

type Tone = 'green' | 'blue' | 'slate';
const TONES: Record<Tone, { bd: string; bg: string; fg: string }> = {
  green: { bd: '#86efac', bg: '#f0fdf4', fg: '#16a34a' },
  blue:  { bd: '#93c5fd', bg: '#eff6ff', fg: '#2563eb' },
  slate: { bd: '#cbd5e1', bg: '#f8fafc', fg: '#475569' },
};

export function IconAction({ title, tone, onClick, children }: { title: string; tone: Tone; onClick: () => void; children: ReactNode }) {
  const t = TONES[tone];
  const style: CSSProperties = {
    width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${t.bd}`, background: t.bg, color: t.fg,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
  };
  return <button type="button" title={title} aria-label={title} onClick={onClick} style={style}>{children}</button>;
}

const svg = (children: ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
/** Excel upload (file with a plus). */
export const ExcelIcon = () => svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 12v5M9.5 14.5h5" /></>);
/** Many employees. */
export const UsersIcon = () => svg(<><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14a4 4 0 0 1 4 4v2" /></>);
/** One employee. */
export const UserIcon = () => svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>);
/** Download (tray with an arrow). */
export const DownloadIcon = () => svg(<><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>);

// ─── Step card (the single-employee form): title · optional right slot · slim coloured top edge by tone ───

type StepTone = 'blue' | 'green' | 'orange';
/** One neutral surface for every card; only a slim top edge tells entitlements (green) from deductions (orange). */
const STEP: Record<StepTone, { top?: string }> = { blue: {}, green: { top: '#16a34a' }, orange: { top: '#ea580c' } };

export function StepCard({ title, tone = 'blue', right, children }: { title: string; tone?: StepTone; right?: ReactNode; children: ReactNode }) {
  const t = STEP[tone];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #dbe3ee', borderTop: t.top ? `3px solid ${t.top}` : '1px solid #dbe3ee', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,.06)', padding: '12px 14px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: font }}>{title}</h3>
        </div>
        {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>{right}</div>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>{children}</div>
    </section>
  );
}