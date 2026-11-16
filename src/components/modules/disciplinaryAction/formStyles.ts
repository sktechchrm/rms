// ─────────────────────────────────────────────────────────────────────────────
// formStyles.ts — shared look of the Disciplinary step forms (used by FormPage.tsx and the six forms).
// Forms contain NO action buttons. Outputs (notices / report / flowchart) are generated from the sidebar.
// Path: src/components/modules/disciplinaryAction/formStyles.ts
// ─────────────────────────────────────────────────────────────────────────────

export const font = "'Noto Sans Bengali', Arial, sans-serif";

export const NAVY = '#1e3a5f';

export const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, fontFamily: font, color: '#334155',
  display: 'block', marginBottom: 5,
};

export const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 11px', border: '1px solid #cbd5e1',
  borderRadius: 8, fontSize: 13, fontFamily: font, background: '#fff',
  color: '#0f172a', outline: 'none', boxSizing: 'border-box',
};

export const hintStyle: React.CSSProperties = {
  fontSize: 11.5, fontFamily: font, color: '#64748b', marginTop: 4, lineHeight: 1.5,
};

/** Two-column grid that collapses to one column on narrow screens (see FormPage's style tag). */
export const gridTwo: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px 18px',
};

/** Shown at the bottom of every form that has an output. */
export const OUTPUT_NOTE = 'নোটিশ / প্রতিবেদন / ফ্লোচার্ট তৈরি বাম পাশের «ফলাফল» তালিকা থেকে করুন।';
