// ─────────────────────────────────────────────────────────────────────────────
// FormPage.tsx — the one layout every Disciplinary step uses, matched to the Left Notice entry form:
//   • sticky command bar: "আবশ্যক তথ্য" progress · "ঘর খুঁজুন (n)" · "সব বন্ধ/খুলুন"
//   • numbered section cards (blue circle), collapsible, the section in view is highlighted
//   • required fields show a red star; an empty one turns red ("আবশ্যক") after you leave it or after "ঘর খুঁজুন"
// No action buttons inside a form. The command-bar buttons only move the cursor or fold sections; they never generate outputs.
// Path: src/components/modules/disciplinaryAction/FormPage.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { font, labelStyle, hintStyle, OUTPUT_NOTE } from './formStyles';

const NAVY = '#1e3a5f', ACCENT = '#2563eb', ERR = '#dc2626', OK = '#15803d', LINE = '#cbd5e1', SOFT = '#e2e8f0', MUTE = '#64748b';

/** One required field. `name` matches the Field's `name`; `section` is the FormSection id it sits in; `ok` = has a value. */
export interface FormCheck { name: string; label: string; section?: string; ok: boolean }

interface Ctx { showAll: boolean; closed: Record<string, boolean>; active: string; toggle: (id: string) => void }
const FormCtx = createContext<Ctx>({ showAll: false, closed: {}, active: '', toggle: () => {} });

/** For controls that are not wrapped in a Field (e.g. table cells): tells them whether "ঘর খুঁজুন" was pressed. */
// This hook intentionally shares the form context with components in other files.
// eslint-disable-next-line react-refresh/only-export-components
export function useFormState(): { showAll: boolean } { return useContext(FormCtx); }

export function FormPage({ step, title, subtitle, reference, output = true, checks, children }: {
  step: string;
  title: string;
  subtitle?: string;
  reference?: string;
  /** false for steps that produce no printed output (e.g. ধাপ ২). */
  output?: boolean;
  /** Required fields. Drives the progress bar and "ঘর খুঁজুন". */
  checks?: FormCheck[];
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState('');

  const total = checks?.length ?? 0;
  const missing = (checks ?? []).filter(c => !c.ok);
  const done = total - missing.length;
  const pct = total ? Math.round((done / total) * 100) : 100;
  const complete = total > 0 && missing.length === 0;

  // the section nearest the top of the viewport is the active one (same scroll-spy as the Left Notice form)
  useEffect(() => {
    const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-section]') ?? []);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(es => {
      const hit = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.getAttribute('data-section') ?? '');
    }, { rootMargin: '-8% 0px -70% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  const toggle = (id: string) => setClosed(p => ({ ...p, [id]: !p[id] }));

  const findMissing = () => {
    setShowAll(true);
    const first = missing[0];
    if (!first) return;
    if (first.section) setClosed(p => ({ ...p, [first.section as string]: false }));
    window.setTimeout(() => {
      const box = rootRef.current?.querySelector<HTMLElement>(`[data-field="${first.name}"]`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box?.querySelector<HTMLElement>('input, select, textarea, .rta-editable')?.focus({ preventScroll: true });
    }, 60);
  };

  const toggleAll = () => {
    const ids = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-section]') ?? []).map(e => e.getAttribute('data-section') ?? '').filter(Boolean);
    const allShut = ids.length > 0 && ids.every(id => closed[id]);
    setClosed(allShut ? {} : Object.fromEntries(ids.map(id => [id, true])));
  };

  const bar = (
    <div role="status" aria-live="polite" style={{ position: 'sticky', top: 0, zIndex: 20, margin: '-16px -20px 14px', background: '#fff', borderBottom: `2px solid ${NAVY}`, boxShadow: '0 2px 6px rgba(15,23,42,.10)', padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontFamily: font }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' }}>আবশ্যক তথ্য</span>
      <span style={{ flex: '1 1 160px', minWidth: 110, height: 9, background: SOFT, borderRadius: 99, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .25s', background: complete ? '#22c55e' : `linear-gradient(90deg,#f59e0b,${ACCENT})` }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: complete ? OK : NAVY, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{done}/{total} · {pct}%</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
        {total > 0 && (
          <button type="button" onClick={findMissing} disabled={complete} style={{
            height: 33, padding: '0 14px', borderRadius: 8, fontFamily: font, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            border: complete ? '1px solid #bbf7d0' : 'none', background: complete ? '#dcfce7' : NAVY, color: complete ? '#166534' : '#fff',
            cursor: complete ? 'default' : 'pointer',
          }}>{complete ? 'সব ঘর পূরণ ✓' : `ঘর খুঁজুন (${missing.length})`}</button>
        )}
        <button type="button" onClick={toggleAll} style={{
          height: 33, padding: '0 14px', borderRadius: 8, fontFamily: font, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          border: `1px solid ${LINE}`, background: '#fff', color: '#1e293b', cursor: 'pointer',
        }}>{Object.values(closed).some(Boolean) ? 'সব খুলুন' : 'সব বন্ধ করুন'}</button>
      </span>
    </div>
  );

  return (
    <FormCtx.Provider value={{ showAll, closed, active, toggle }}>
      <div ref={rootRef} style={{ fontFamily: font, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <style>{`
          .da-form-grid { display: grid; grid-template-columns: repeat(var(--da-cols, 4), minmax(0, 1fr)); gap: 15px 18px; }
          .da-form-wide { grid-column: 1 / -1; }
          .da-in::placeholder { color: #a3b1c2; }
          .da-in:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px rgba(37,99,235,.16); outline: none; }
          [data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea, [data-invalid="true"] .rta-editable {
            border-color: ${ERR} !important; background: #fff8f8 !important;
          }
          @media (max-width: 1100px) { .da-form-grid { --da-cols: 3; } }
          @media (max-width: 760px)  { .da-form-grid { --da-cols: 2; } }
          @media (max-width: 480px)  { .da-form-grid { --da-cols: 1; } }
        `}</style>

        {bar}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: -4 }}>
          {subtitle && <span style={{ fontSize: 12, color: MUTE }}>{subtitle}</span>}
          {reference && <span style={{ fontSize: 12, color: '#334155', background: '#f1f5f9', border: `1px solid ${SOFT}`, borderRadius: 8, padding: '3px 10px' }}>সূত্র নং: <b>{reference}</b></span>}
          <span style={{ display: 'none' }}>{step}{title}</span>
        </div>

        {children}

        {output && <p style={{ margin: '2px 2px 0', fontSize: 12, color: MUTE }}>{OUTPUT_NOTE}</p>}
      </div>
    </FormCtx.Provider>
  );
}

/** A numbered section card. Give it an `id` (and `no`) to get the active highlight, folding and the command bar's "সব বন্ধ/খুলুন". */
export function FormSection({ id, no, title, hint, children }: { id?: string; no?: string; title: string; hint?: string; children: ReactNode }) {
  const ctx = useContext(FormCtx);
  const [local, setLocal] = useState(false);
  const shut = id ? !!ctx.closed[id] : local;
  const here = !!id && ctx.active === id;
  const flip = () => (id ? ctx.toggle(id) : setLocal(v => !v));
  return (
    <section data-section={id} id={id ? `sec-${id}` : undefined} style={{
      background: '#fff', border: `1px solid ${here ? '#93c5fd' : LINE}`, borderRadius: 12, marginBottom: 0, scrollMarginTop: 90,
      boxShadow: here ? '0 2px 10px rgba(37,99,235,.12)' : '0 1px 2px rgba(15,23,42,.05)', overflow: 'hidden',
    }}>
      <div role="button" tabIndex={0} aria-expanded={!shut} onClick={flip}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', cursor: 'pointer', userSelect: 'none',
          background: here ? 'linear-gradient(180deg,#f3f8ff,#e6f0ff)' : 'linear-gradient(180deg,#f8fafc,#eef2f7)',
          boxShadow: here ? `inset 4px 0 0 ${ACCENT}` : undefined, borderBottom: shut ? 'none' : `1px solid ${SOFT}`,
        }}>
        {no && (
          <span style={{ width: 28, height: 28, flex: '0 0 28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: NAVY, color: '#fff', borderRadius: '50%', fontSize: 13, fontWeight: 700 }}>{no}</span>
        )}
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: NAVY, lineHeight: 1.25 }}>{title}</span>
          {hint && <span style={{ display: 'block', fontSize: 11, color: MUTE, marginTop: 1 }}>{hint}</span>}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: shut ? 'rotate(-90deg)' : 'none', transition: 'transform .15s', flex: 'none' }}><path d="M3 5l4 4 4-4" /></svg>
      </div>
      {!shut && <div style={{ padding: 16 }}>{children}</div>}
    </section>
  );
}

/** Label + control + message. Pass `name` (= FormCheck.name) and `missing` for a required field that is empty. */
export function Field({ label, required, hint, error, wide, name, missing, children }: {
  label: string; required?: boolean; hint?: ReactNode; error?: string; wide?: boolean;
  name?: string; missing?: boolean; children: ReactNode;
}) {
  const ctx = useContext(FormCtx);
  const [touched, setTouched] = useState(false);
  const invalid = !!error || (!!missing && (ctx.showAll || touched));
  const msg = error ?? (invalid && missing ? 'আবশ্যক' : undefined);
  return (
    <div className={wide ? 'da-form-wide' : undefined} data-field={name} data-invalid={invalid ? 'true' : undefined}
      onBlurCapture={() => setTouched(true)} style={{ minWidth: 0 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: ERR, marginLeft: 3 }} aria-hidden="true">*</span>}
      </label>
      {children}
      {msg
        ? <div role="alert" style={{ ...hintStyle, color: ERR, fontWeight: 600 }}>⚠ {msg}</div>
        : hint ? <div style={{ ...hintStyle, color: MUTE }}>{hint}</div> : null}
    </div>
  );
}

/** Yellow / blue / green / red strip, same style as the Left Notice warnings. */
export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'success' | 'danger'; children: ReactNode }) {
  const t = {
    info:    { bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e40af' },
    warn:    { bg: '#fffbeb', bd: '#fde68a', fg: '#92400e' },
    success: { bg: '#f0fdf4', bd: '#bbf7d0', fg: '#166534' },
    danger:  { bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b' },
  }[tone];
  return (
    <div style={{ padding: '10px 14px', background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 10, fontSize: 12.5, color: t.fg, lineHeight: 1.6, fontFamily: font }}>
      {children}
    </div>
  );
}