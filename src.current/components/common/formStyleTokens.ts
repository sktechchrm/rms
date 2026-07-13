// ═══════════════════════════════════════════════════════════════════════════════
// Shared form-layout style tokens
// ═══════════════════════════════════════════════════════════════════════════════
//
// CONSOLIDATED (audit): these were byte-identical copies declared independently
// in both EmployeeInfoForm.tsx (Left Worker Notice) and EmployeeForm.tsx
// (Employee Personal File) — EmployeeForm.tsx's own comment even said
// "Shared style tokens (same as LWN)", acknowledging the duplication without
// actually sharing the code. Any module building a card-based step-form should
// import from here instead of re-declaring its own copy.
//
// Font resolves to the single app-wide token (see src/index.css --app-font) —
// do not hardcode a font name here.
// ═══════════════════════════════════════════════════════════════════════════════

import type { CSSProperties } from 'react';

export const font = 'var(--app-font)';

export const card: CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0',
  borderRadius: 12, padding: '16px 18px', marginBottom: 14,
};

export const cardHead: CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#0F2442', fontFamily: font,
  marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
};

export const g2: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
export const g3: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 };
export const g4: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 };
