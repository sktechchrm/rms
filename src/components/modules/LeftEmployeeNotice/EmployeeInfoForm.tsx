// ─────────────────────────────────────────────────────────────────────────────
// EmployeeInfoForm.tsx — one compact entry form: employee · absence + notice schedule · addresses.
// Plain controlled inputs: the Employee state is the single source. The three notice dates are read-only — they come from computeNotice().
// Path: src/components/modules/LeftEmployeeNotice/EmployeeInfoForm.tsx
//
// LAYOUT (same language as the Employee Personal File form)
//   Fixed command bar  — progress "আবশ্যক তথ্য filled/total · %" · ঘর খুঁজুন · Excel থেকে ইমপোর্ট · সব বন্ধ/খুলুন
//   Profile card       — live name, card · designation · section · days absent, and the stage the worker is at today
//   Sections (cards, collapsible, current one highlighted): ১ কর্মীর সাধারণ তথ্য · ২ অনুপস্থিতি ও নোটিশের সময়সূচি ·
//                        ৩ বর্তমান ঠিকানা · ৪ স্থায়ী ঠিকানা
//   Notice schedule    — a three-step timeline (পত্র-১ → পত্র-২ → পত্র-৩) with each date and "আজ ইস্যুযোগ্য / N দিন বাকি / ইস্যু হয়েছে".
//
// Required fields (name · card no · designation · absence start) show a red star; after you leave one empty (or press "ঘর খুঁজুন"),
// or after a failed Save (showErrors), it turns red with the message. Nothing blocks typing; the manager's Save checks everything.
// Props are unchanged, plus onBulkImport (opens the manager's "Excel থেকে ইমপোর্ট" page).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Address, Employee } from './LeftNoticeDataType';
import { NOTICE_RULES, formatDMY, daysFrom, todayIso } from './leftNoticeModel';
import type { NoticeCalc, NoticeIssues } from './leftNoticeModel';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import InfoBall from '../livingWage/InfoBall';

interface Props {
  employee: Employee;
  setEmployee: (e: Employee) => void;
  calc: NoticeCalc;
  issues: NoticeIssues;
  showErrors: boolean;
  onBulkImport?: () => void;
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
const font = "'Segoe UI', 'Noto Sans Bengali', system-ui, sans-serif";
const NAVY = '#1e3a5f', ACCENT = '#2563eb', ERR = '#dc2626', OK = '#15803d';
const C = { page: '#f1f5f9', card: '#ffffff', line: '#cbd5e1', soft: '#e2e8f0', text: '#0f172a', mute: '#64748b', ro: '#f1f5f9' };

const GENDERS = [{ value: 'male', label: 'পুরুষ' }, { value: 'female', label: 'মহিলা' }, { value: 'third', label: 'তৃতীয় লিঙ্গ' }];
const ADDRESS_FIELDS: { key: keyof Address; label: string; placeholder: string }[] = [
  { key: 'houseNo',    label: 'বাড়ি / রাস্তা', placeholder: 'বাড়ি নং, রাস্তা' },
  { key: 'village',    label: 'গ্রাম',         placeholder: 'গ্রামের নাম' },
  { key: 'postOffice', label: 'ডাকঘর',        placeholder: 'ডাকঘর' },
  { key: 'thana',      label: 'থানা',          placeholder: 'থানা / উপজেলা' },
  { key: 'district',   label: 'জেলা',          placeholder: 'জেলা' },
];
const SECTIONS = [
  { id: 'person',  no: '১', title: 'কর্মীর সাধারণ তথ্য',            sub: 'নাম, কার্ড নং, পদবী ও পরিবার' },
  { id: 'absence', no: '২', title: 'অনুপস্থিতি ও নোটিশের সময়সূচি', sub: 'যোগদান, অনুপস্থিতির শুরু ও তিনটি পত্রের তারিখ' },
  { id: 'present', no: '৩', title: 'বর্তমান ঠিকানা',                 sub: 'পত্র ও খামে যে ঠিকানায় যাবে' },
  { id: 'perm',    no: '৪', title: 'স্থায়ী ঠিকানা',                  sub: 'স্থায়ী ঠিকানার খাম ও পত্র' },
];
// required fields, in the order the form shows them
const REQUIRED: { key: string; label: string }[] = [
  { key: 'name', label: 'কর্মীর নাম' }, { key: 'cardNo', label: 'কার্ড নং' }, { key: 'designation', label: 'পদবী' }, { key: 'absenceStartDate', label: 'অনুপস্থিতির শুরুর তারিখ' },
];

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(var(--ln-cols, 4), minmax(0, 1fr))', gap: '15px 18px' };
const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5, fontFamily: font };
const inputBase: CSSProperties = {
  width: '100%', height: 37, boxSizing: 'border-box', padding: '0 11px', border: `1px solid ${C.line}`, borderRadius: 8,
  background: '#fff', color: C.text, fontSize: 13, fontFamily: font, outline: 'none', transition: 'border-color .12s, box-shadow .12s',
};
const hintStyle: CSSProperties = { fontSize: 11, marginTop: 3, fontFamily: font };
const FORM_STYLE = `
.ln-root{--ln-cols:4}
.ln-in::placeholder{color:#a3b1c2}
.ln-in:focus{border-color:#2563eb !important;box-shadow:0 0 0 3px rgba(37,99,235,.16)}
.ln-in:hover:not(:disabled):not([readonly]){border-color:#94a3b8}
.ln-btn{transition:background .12s,border-color .12s,color .12s,box-shadow .12s}
.ln-btn:hover:not(:disabled){box-shadow:0 1px 3px rgba(15,23,42,.18)}
/* fills the strip between the module header and the stuck command bar, so the form never shows through it */
.ln-bar::before{content:'';position:absolute;left:0;right:0;bottom:100%;height:44px;background:#f1f5f9}
.ln-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:1100px){.ln-root{--ln-cols:3}}
@media (max-width:760px){.ln-root{--ln-cols:2}.ln-steps{grid-template-columns:1fr}}
@media (max-width:480px){.ln-root{--ln-cols:1}}
`;

const STAGE_LABEL = { Waiting: 'অপেক্ষমান', N1: 'পত্র-১ পর্যায়', N2: 'পত্র-২ পর্যায়', Final: 'চূড়ান্ত (ইস্তফা গণ্য)' } as const;

export function EmployeeForm({ employee, setEmployee, calc, issues, showErrors, onBulkImport }: Props) {
  const [sameAddress, setSameAddress] = useState(false);
  const [visited, setVisited] = useState<Record<string, boolean>>({});   // required fields the user has left once
  const [showAll, setShowAll] = useState(false);                         // "ঘর খুঁজুন": every missing required field turns red
  const [closed, setClosed]   = useState<Record<string, boolean>>({});
  const [active, setActive]   = useState('person');                      // section in view (scroll-spy)
  const set = <K extends keyof Employee>(k: K, v: Employee[K]) => setEmployee({ ...employee, [k]: v });
  const leave = (k: string) => setVisited(p => (p[k] ? p : { ...p, [k]: true }));

  const valueOf = (k: string): string => String((employee as unknown as Record<string, unknown>)[k] ?? '');
  const missing = REQUIRED.filter(f => valueOf(f.key).trim() === '');
  const filled = REQUIRED.length - missing.length, pct = Math.round((filled / REQUIRED.length) * 100), complete = missing.length === 0;

  // error text: the manager's message (after a failed Save) or "আবশ্যক" once the field was left empty / "ঘর খুঁজুন" was pressed
  const errorOf = (field: string): string | undefined => {
    const m = showErrors ? issues.errors.find(e => e.field === field)?.text : undefined;
    if (m) return m;
    const req = REQUIRED.some(r => r.key === field);
    if (req && valueOf(field).trim() === '' && (showAll || visited[field])) return 'আবশ্যক';
    return undefined;
  };
  const bad = (k: string): CSSProperties => (errorOf(k) ? { borderColor: ERR, background: '#fff8f8' } : {});
  const err = (k: string) => { const m = errorOf(k); return m ? <div role="alert" style={{ ...hintStyle, color: ERR, fontWeight: 600 }}>⚠ {m}</div> : null; };

  const findMissing = () => {
    setShowAll(true);
    const first = missing[0];
    if (!first) return;
    setClosed({});
    window.setTimeout(() => {
      const box = document.querySelector<HTMLElement>(`[data-field="${first.key}"]`);
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (box?.querySelector<HTMLElement>('input, select, textarea, button') ?? box)?.focus({ preventScroll: true });
    }, 60);
  };

  // scroll-spy: the section nearest the top of the viewport is "current"
  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(`ln-sec-${s.id}`)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(es => {
      const hit = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id.replace('ln-sec-', ''));
    }, { rootMargin: '-8% 0px -70% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  // Present address edits also write the permanent address while "same as present" is ticked.
  const setPresent = (k: keyof Address, v: string) => {
    const presentAddress = { ...employee.presentAddress, [k]: v };
    setEmployee({ ...employee, presentAddress, ...(sameAddress ? { permanentAddress: { ...presentAddress } } : {}) });
  };
  const setPermanent = (k: keyof Address, v: string) => setEmployee({ ...employee, permanentAddress: { ...employee.permanentAddress, [k]: v } });
  const toggleSame = (on: boolean) => {
    setSameAddress(on);
    if (on) setEmployee({ ...employee, permanentAddress: { ...employee.presentAddress } });
  };

  // ── derived ──
  const today = todayIso();
  const late = calc.daysAbsent !== null && calc.daysAbsent > 0;
  const stage: keyof typeof STAGE_LABEL = calc.third && today >= calc.third ? 'Final' : calc.second && today >= calc.second ? 'N2' : calc.first && today >= calc.first ? 'N1' : 'Waiting';
  const stageTone = { Waiting: { bg: 'rgba(255,255,255,.16)', fg: '#fff' }, N1: { bg: '#fef3c7', fg: '#92400e' }, N2: { bg: '#ffedd5', fg: '#c2410c' }, Final: { bg: '#fee2e2', fg: '#b91c1c' } }[stage];
  const tenure = employee.joiningDate && employee.absenceStartDate ? daysFrom(employee.joiningDate, employee.absenceStartDate) : null;
  const heroTags = [
    employee.cardNo && `কার্ড: ${employee.cardNo}`, employee.designation, employee.section,
    employee.absenceStartDate && `অনুপস্থিত: ${formatDMY(employee.absenceStartDate)}`, late && `${calc.daysAbsent} দিন`,
  ].filter((t): t is string => Boolean(t));
  const initials = employee.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();

  // ── building blocks (plain functions, not components, so typing never remounts an input) ──
  const field = (k: string, label: string, input: ReactNode, o: { wide?: boolean; hint?: ReactNode; star?: boolean } = {}) => (
    <div key={k} data-field={k} style={o.wide ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={`ln-${k}`} style={labelStyle}>{label}{o.star && <span style={{ color: ERR, marginLeft: 3 }} aria-hidden="true">*</span>}</label>
      {input}
      {err(k) ?? (o.hint ? <div style={{ ...hintStyle, color: C.mute }}>{o.hint}</div> : null)}
    </div>
  );
  const text = (k: keyof Employee, label: string, o: { star?: boolean; placeholder?: string; hint?: ReactNode } = {}) =>
    field(String(k), label, (
      <input id={`ln-${String(k)}`} className="ln-in" value={String(employee[k] ?? '')} placeholder={o.placeholder ?? label} aria-required={o.star || undefined} aria-invalid={Boolean(errorOf(String(k))) || undefined}
        onChange={e => set(k, e.target.value as never)} onBlur={() => leave(String(k))} style={{ ...inputBase, ...bad(String(k)) }} />
    ), { star: o.star, hint: o.hint });
  const dateBox: CSSProperties = { padding: '7px 10px', fontSize: 13 };

  const section = (id: string, children: ReactNode, right?: ReactNode) => {
    const meta = SECTIONS.find(s => s.id === id)!, shut = Boolean(closed[id]), here = active === id;
    return (
      <section id={`ln-sec-${id}`} key={id}
        style={{ background: C.card, border: `1px solid ${here ? '#93c5fd' : C.line}`, borderRadius: 12, boxShadow: here ? '0 2px 10px rgba(37,99,235,.12)' : '0 1px 2px rgba(15,23,42,.05)', marginBottom: 14, scrollMarginTop: 70, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', background: here ? 'linear-gradient(180deg,#f3f8ff,#e6f0ff)' : 'linear-gradient(180deg,#f8fafc,#eef2f7)', boxShadow: here ? `inset 4px 0 0 ${ACCENT}` : undefined, borderBottom: shut ? 'none' : `1px solid ${C.soft}` }}>
          <span style={{ width: 28, height: 28, flex: '0 0 28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: NAVY, color: '#fff', borderRadius: '50%', fontSize: 13, fontWeight: 700, fontFamily: font }}>{meta.no}</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: NAVY, fontFamily: font, lineHeight: 1.25 }}>{meta.title}</h3>
            <div style={{ fontSize: 11, color: C.mute, fontFamily: font }}>{meta.sub}</div>
          </div>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {right}
            <button type="button" onClick={() => setClosed(p => ({ ...p, [id]: !p[id] }))} aria-expanded={!shut} aria-label={`${meta.title} ${shut ? 'খুলুন' : 'বন্ধ করুন'}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mute, padding: '4px 6px', lineHeight: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ transform: shut ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><path d="M3 5l4 4 4-4" /></svg>
            </button>
          </span>
        </div>
        {!shut && <div style={{ padding: 16 }}>{children}</div>}
      </section>
    );
  };

  const addressGrid = (kind: 'present' | 'perm') => {
    const locked = kind === 'perm' && sameAddress;
    const a = kind === 'present' ? employee.presentAddress : employee.permanentAddress;
    return (
      <div style={grid}>
        {ADDRESS_FIELDS.map(f => (
          <div key={f.key}>
            <label htmlFor={`ln-${kind}-${f.key}`} style={labelStyle}>{f.label}</label>
            <input id={`ln-${kind}-${f.key}`} className="ln-in" value={a[f.key]} placeholder={f.placeholder} disabled={locked}
              onChange={e => (kind === 'present' ? setPresent(f.key, e.target.value) : setPermanent(f.key, e.target.value))}
              style={{ ...inputBase, ...(locked ? { background: C.ro, color: C.mute, cursor: 'not-allowed' } : {}) }} />
          </div>
        ))}
      </div>
    );
  };

  // one step of the notice timeline
  const step = (no: number, label: string, rule: string, date: string, final?: boolean) => {
    const d = date ? daysFrom(today, date) : null;
    const state = !date ? 'none' : d !== null && d < 0 ? 'past' : d === 0 ? 'today' : 'future';
    const tone = state === 'today' ? { bd: '#fecaca', bg: '#fef2f2', fg: '#b91c1c' } : state === 'past' ? { bd: '#bbf7d0', bg: '#f0fdf4', fg: '#166534' }
      : final && state === 'future' ? { bd: '#fecaca', bg: '#fff7f7', fg: '#b91c1c' } : { bd: C.soft, bg: '#f8fafc', fg: NAVY };
    const sub = state === 'none' ? 'অনুপস্থিতির তারিখ দিন' : state === 'today' ? 'আজ ইস্যুযোগ্য' : state === 'past' ? `ইস্যুযোগ্য ছিল — ${-(d as number)} দিন আগে` : `${d} দিন বাকি`;
    return (
      <div key={no} style={{ border: `1px solid ${tone.bd}`, background: tone.bg, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ width: 30, height: 30, flex: '0 0 30px', borderRadius: '50%', background: state === 'none' ? '#cbd5e1' : tone.fg, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: font }}>{state === 'past' ? '✓' : no}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.mute, fontFamily: font }}>{label} · {rule}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: state === 'none' ? '#94a3b8' : tone.fg, fontFamily: font, fontVariantNumeric: 'tabular-nums' }}>{date ? formatDMY(date) : '—'}</div>
          <div style={{ fontSize: 11, color: tone.fg, fontWeight: 600, fontFamily: font }}>{sub}</div>
        </div>
      </div>
    );
  };

  const allShut = SECTIONS.every(s => closed[s.id]);
  const topBtn: CSSProperties = { height: 33, padding: '0 14px', border: `1px solid ${C.line}`, background: '#fff', color: '#1e293b', fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' };
  const hasProblems = (showErrors && issues.errors.length > 0) || issues.warnings.length > 0;

  return (
    <div className="ln-root" style={{ background: C.page, padding: 14, fontFamily: font }}>
      <style>{FORM_STYLE}</style>

      {/* ── fixed command bar ── */}
      <div className="ln-bar" style={{ position: 'sticky', top: 0, zIndex: 30, margin: '-24px -14px 12px', background: '#fff', boxShadow: '0 2px 6px rgba(15,23,42,.10)' }}>
        <div style={{ background: '#fff', borderBottom: `2px solid ${NAVY}`, padding: '8px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px', minWidth: 230 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', fontFamily: font }}>আবশ্যক তথ্য</span>
              <span style={{ flex: 1, minWidth: 80, height: 9, background: C.soft, borderRadius: 99, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .25s', background: complete ? '#22c55e' : `linear-gradient(90deg, #f59e0b, ${ACCENT})` }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: complete ? OK : NAVY, whiteSpace: 'nowrap', fontFamily: font, fontVariantNumeric: 'tabular-nums' }}>{filled}/{REQUIRED.length} · {pct}%</span>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <button type="button" className="ln-btn" onClick={findMissing} disabled={complete}
                style={{ ...topBtn, border: 'none', background: complete ? '#dcfce7' : NAVY, color: complete ? '#166534' : '#fff', cursor: complete ? 'default' : 'pointer' }}>
                {complete ? 'সব ঘর পূরণ ✓' : `ঘর খুঁজুন (${missing.length})`}
              </button>
              {onBulkImport && <button type="button" className="ln-btn" onClick={onBulkImport} title="Excel ফাইল থেকে একসাথে অনেক অনুপস্থিত কর্মী ইমপোর্ট করুন" style={{ ...topBtn, background: '#eff6ff', borderColor: ACCENT, color: ACCENT }}>⬆ Excel থেকে ইমপোর্ট</button>}
              <button type="button" className="ln-btn" onClick={() => setClosed(allShut ? {} : Object.fromEntries(SECTIONS.map(s => [s.id, true])))} style={topBtn}>{allShut ? 'সব খুলুন' : 'সব বন্ধ করুন'}</button>
            </span>
          </div>
        </div>
      </div>

      {/* ── profile card ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)', color: '#fff', borderRadius: 10, padding: '7px 14px', marginBottom: 12, boxShadow: '0 2px 8px rgba(30,58,95,.22)' }}>
        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.16)', border: '2px solid rgba(255,255,255,.35)', fontSize: 14, fontWeight: 800 }}>{initials || '＋'}</span>
        <div style={{ minWidth: 0, flex: '1 1 260px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3px 10px' }}>
          <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, fontFamily: font, wordBreak: 'break-word', opacity: employee.name ? 1 : 0.6 }}>{employee.name || 'নতুন রেকর্ড — কর্মীর নাম লিখুন'}</span>
          {heroTags.map(t => <span key={t} style={{ background: 'rgba(255,255,255,.16)', borderRadius: 99, padding: '1px 9px', fontSize: 11, fontFamily: font, whiteSpace: 'nowrap' }}>{t}</span>)}
        </div>
        {employee.absenceStartDate && (
          <span style={{ flex: 'none', background: stageTone.bg, color: stageTone.fg, borderRadius: 99, padding: '3px 12px', fontSize: 11.5, fontWeight: 700, fontFamily: font }}>● {STAGE_LABEL[stage]}</span>
        )}
      </div>

      {hasProblems && (
        <div style={{ background: showErrors && issues.errors.length ? '#fff5f5' : '#fffbeb', border: `1px solid ${showErrors && issues.errors.length ? '#fecaca' : '#fde68a'}`, borderRadius: 10, padding: '9px 14px', marginBottom: 14 }}>
          {showErrors && issues.errors.map((e, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>✕ {e.text}</div>)}
          {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', fontFamily: font }}>⚠ {m}</div>)}
        </div>
      )}

      {/* 1 ── employee */}
      {section('person', (
        <div style={grid}>
          <div style={{ gridColumn: 'span 2' }}>{text('name', 'কর্মীর নাম', { star: true, placeholder: 'কর্মীর পূর্ণ নাম' })}</div>
          {text('cardNo', 'কার্ড নং', { star: true })}
          {text('designation', 'পদবী', { star: true })}
          {text('section', 'সেকশন')}
          {field('gender', 'লিঙ্গ', (
            <select id="ln-gender" className="ln-in" value={employee.gender ?? ''} onChange={e => set('gender', e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>
              <option value="">নির্বাচন করুন</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          ))}
          {text('fatherName', 'পিতার নাম')}
          {text('motherName', 'মাতার নাম')}
          {employee.gender === 'female' && text('husbandName', 'স্বামীর নাম', { hint: 'পত্র ও খামে পিতার পরিবর্তে স্বামীর নাম আসবে (পিতার নাম ফাঁকা থাকলে)' })}
        </div>
      ))}

      {/* 2 ── absence + schedule */}
      {section('absence', (
        <>
          <div style={{ ...grid, marginBottom: 16 }}>
            {field('joiningDate', 'যোগদানের তারিখ', (
              <div style={{ display: 'flex' }}><DateFieldDMY value={employee.joiningDate ?? ''} onChange={v => set('joiningDate', v)} ariaLabel="Joining date" max={employee.absenceStartDate || undefined} clearable boxStyle={dateBox} /></div>
            ), { hint: tenure !== null && tenure >= 0 ? `অনুপস্থিতির আগে চাকরি: ${tenure} দিন` : undefined })}
            {field('absenceStartDate', 'অনুপস্থিতির শুরুর তারিখ', (
              <div style={{ display: 'flex' }}><DateFieldDMY value={employee.absenceStartDate ?? ''} onChange={v => set('absenceStartDate', v)} ariaLabel="Absence start date" min={employee.joiningDate || undefined} clearable invalid={Boolean(errorOf('absenceStartDate'))} boxStyle={dateBox} /></div>
            ), { star: true, hint: calc.daysAbsent !== null ? (late ? `এখন পর্যন্ত ${calc.daysAbsent} দিন অনুপস্থিত` : 'তারিখটি এখনো শুরু হয়নি') : 'এই তারিখ থেকেই তিনটি পত্রের তারিখ হিসাব হয়' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 11px', paddingBottom: 6, borderBottom: `1px dashed ${C.line}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, fontFamily: font }}>নোটিশের সময়সূচি</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: font }}>স্বয়ংক্রিয়</span>
            <InfoBall title="তারিখ কীভাবে হিসাব হয়">
              পত্র-১ = অনুপস্থিতির শুরু থেকে {NOTICE_RULES.first} কর্মদিবস পর। পত্র-২ = পত্র-১ থেকে {NOTICE_RULES.second} কর্মদিবস পর। পত্র-৩ (চূড়ান্ত) = পত্র-২ থেকে {NOTICE_RULES.third} কর্মদিবস পর।
              শুক্র-শনিবার ও নির্দিষ্ট তারিখের সরকারি ছুটি (২১ ফেব্রু, ২৬ মার্চ, ১৪ এপ্রিল, ১ মে, ১৫ আগস্ট, ১৬ ডিসেম্বর) বাদ যায়। ঈদ ইত্যাদি চলমান ছুটি সিস্টেমে নেই — প্রয়োজনে তারিখ মিলিয়ে নিন।
            </InfoBall>
          </div>
          <div className="ln-steps">
            {step(1, 'পত্র নং-১', `${NOTICE_RULES.first} কর্মদিবস পর`, calc.first)}
            {step(2, 'পত্র নং-২', `${NOTICE_RULES.second} কর্মদিবস পর`, calc.second)}
            {step(3, 'পত্র নং-৩ (চূড়ান্ত)', `${NOTICE_RULES.third} কর্মদিবস পর`, calc.third, true)}
          </div>
        </>
      ))}

      {/* 3 ── present address */}
      {section('present', addressGrid('present'))}

      {/* 4 ── permanent address */}
      {section('perm', addressGrid('perm'), (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontFamily: font, cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
          <input type="checkbox" checked={sameAddress} onChange={e => toggleSame(e.target.checked)} style={{ accentColor: ACCENT }} /> বর্তমান ঠিকানার মতোই
        </label>
      ))}
    </div>
  );
}

export default EmployeeForm;