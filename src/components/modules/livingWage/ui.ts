import type { CSSProperties } from 'react';

export const font = "'Noto Sans Bengali', Arial, sans-serif";
export const CONTROL_H = 34;

export const labelStyle: CSSProperties = { fontSize: 12.5, fontWeight: 600, fontFamily: font, color: '#1e293b', display: 'block', marginBottom: 4 };
export const inputStyle: CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12.5,
  fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none', boxSizing: 'border-box',
};
export const readStyle: CSSProperties = { ...inputStyle, background: '#f1f5f9', color: '#0f172a', fontWeight: 600 };
export const areaStyle: CSSProperties = { ...inputStyle, minHeight: 58, resize: 'vertical', lineHeight: 1.4 };
export const card: CSSProperties = { background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, marginBottom: 12, boxSizing: 'border-box' };
export const cardTitle: CSSProperties = { fontSize: 13.5, fontWeight: 700, fontFamily: font, color: '#1e3a5f' };

/** Small solid button (used inside tables and cards). */
export const btn = (bg: string): CSSProperties => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font,
});

/** Toolbar button: one height (32px), icon + label. */
export const toolBtn = (kind: 'primary' | 'secondary' | 'danger' = 'secondary'): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8,
  fontSize: 12.5, fontWeight: 600, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap',
  border: `1px solid ${kind === 'primary' ? '#1d4ed8' : kind === 'danger' ? '#fecaca' : '#cbd5e1'}`,
  background: kind === 'primary' ? '#2563eb' : kind === 'danger' ? '#fff5f5' : '#fff',
  color: kind === 'primary' ? '#fff' : kind === 'danger' ? '#b91c1c' : '#334155',
  boxShadow: kind === 'primary' ? '0 1px 2px rgba(37,99,235,0.35)' : 'none',
});

export const th: CSSProperties = {
  padding: '7px 8px', fontSize: 11, fontWeight: 700, fontFamily: font, color: '#374151', background: '#f1f5f9',
  textAlign: 'left', verticalAlign: 'bottom', boxShadow: 'inset 0 -1px 0 #e2e8f0', whiteSpace: 'nowrap',
};
export const td: CSSProperties = { padding: '5px 6px', borderBottom: '1px solid #e2e8f0', fontSize: 12.5, fontFamily: font, color: '#1e293b', verticalAlign: 'top' };
export const mini = (active: boolean): CSSProperties => ({
  flexShrink: 0, padding: '2px 5px', cursor: 'pointer', borderRadius: 5, fontSize: 11, fontWeight: 700,
  border: `1px solid ${active ? '#93c5fd' : 'transparent'}`, background: active ? '#dbeafe' : 'transparent', color: active ? '#1d4ed8' : '#64748b',
});

export const FORM_CSS = `
  .lw-form { container-type: inline-size; }
  .lw-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px 14px; align-items: start; }
  .lw-grid > .s2 { grid-column: span 2; }
  .lw-grid > .s3 { grid-column: span 3; }
  .lw-grid > .s4 { grid-column: span 4; }
  @container (max-width: 760px) {
    .lw-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lw-grid > .s3, .lw-grid > .s4 { grid-column: span 2; }
  }
  @container (max-width: 480px) {
    .lw-grid { grid-template-columns: minmax(0, 1fr); }
    .lw-grid > .s2, .lw-grid > .s3, .lw-grid > .s4 { grid-column: span 1; }
  }
`;