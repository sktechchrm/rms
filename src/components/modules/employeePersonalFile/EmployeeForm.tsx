// ─────────────────────────────────────────────────────────────────────────────
// EmployeeForm.tsx — ONE single-page entry form for the whole personal file (replaces the 8 separate steps).
// Path: src/components/modules/employeePersonalFile/EmployeeForm.tsx
//
// LAYOUT
//   Profile card (top, one slim row) — photo / initials, live name with card · designation · department · joining date · age,
//     and a small progress ring for the required information.
//   Fixed command bar (stays in view while the form scrolls) — progress bar "আবশ্যক তথ্য filled/total · %" ·
//     ঘর খুঁজুন · Excel থেকে কর্মী ইমপোর্ট · সব বন্ধ/খুলুন
//   Sections (cards, each can be collapsed; the one being read is highlighted, and each shows its own progress line):
//     1 ব্যক্তিগত তথ্য · 2 পরিবার ও সন্তান · 3 যোগাযোগ ও ঠিকানা · 4 চাকরির তথ্য · 5 বেতন ও ব্যাংক ·
//     6 শিক্ষাগত যোগ্যতা · 7 পূর্ববর্তী অভিজ্ঞতা · 8 নমিনি · 9 সুপারিশকারী / রেফারেন্স
//   Fields sit in a 4-column grid (3 / 2 / 1 columns on narrower screens). Section 1 keeps the employee photo in the first
//   column, spanning four rows, with the personal fields beside it.
//
// REQUIRED FIELDS come from employeeModel.ts → REQUIRED_FIELDS: the same list the Statement uses for "ফাইলের অবস্থা",
// so the form and the list always agree. Required fields show a red star; after you leave a required field empty (or press
// "ঘর খুঁজুন") it turns red with "আবশ্যক". Nothing blocks typing — Save in the module shell only needs name + joining date.
//
// SMART BEHAVIOUR (all derived while typing, no hidden state):
//   · age shown under the date of birth; under-18 at joining → blocking notice (শ্রম আইন ধারা ৩৪)
//   · "উভয় ঠিকানা একই": permanent address follows the present one live, and is locked while ticked
//   · nominee full address is composed from village / post office / thana / district
//   · salary: basic = (gross − medical − transport − food) ÷ 1.5, house rent = basic ÷ 2, with a "sums to gross" check
//   · mobile numbers are checked for 11 digits (a missing leading 0 is accepted, as the list does)
//   · education / previous-job tables: add (top) / remove rows; previous start date = end date − years of service
//
// Props are unchanged in spirit: formData, handleInputChange, setFormData, onDirtyChange (called on every edit),
// onBulkImport (opens the manager's "Excel থেকে কর্মী ইমপোর্ট" page).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { EmployeeFormData, EducationEntry, PreviousJobEntry, generateEntryId } from './employee.types';
import { PhotoUploadField } from './PrintFiles/PhotoAttach';
import { REQUIRED_FIELDS, formatDMY } from './employeeModel';
import type { SectionId } from './employeeModel';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const font = "'Segoe UI', 'Noto Sans Bengali', system-ui, sans-serif";
const NAVY = '#1e3a5f', ACCENT = '#2563eb', ERR = '#dc2626', OK = '#15803d';
const C = { page: '#f1f5f9', card: '#ffffff', line: '#cbd5e1', soft: '#e2e8f0', text: '#0f172a', mute: '#64748b', ro: '#f1f5f9' };

type Change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
interface Props {
  formData:          EmployeeFormData;
  handleInputChange: Change;
  setFormData:       (updater: (prev: EmployeeFormData) => EmployeeFormData) => void;
  onDirtyChange?:    (dirty: boolean) => void;
  onBulkImport?:     () => void;          // opens the manager's "Excel থেকে কর্মী ইমপোর্ট" page
}

const REQUIRED = new Set(REQUIRED_FIELDS.map(f => f.key));
const SECTIONS: { id: string; no: string; title: string; sub: string; req?: SectionId }[] = [
  { id: 'personal',  no: '১', title: 'ব্যক্তিগত তথ্য',        sub: 'নাম, জন্ম, পরিচয়পত্র ও শারীরিক তথ্য',        req: 'personal' },
  { id: 'family',    no: '২', title: 'পরিবার ও সন্তান',       sub: 'স্বামী/স্ত্রী ও সন্তানের তথ্য',               req: 'family' },
  { id: 'contact',   no: '৩', title: 'যোগাযোগ ও ঠিকানা',     sub: 'মোবাইল, বর্তমান ও স্থায়ী ঠিকানা, জরুরি যোগাযোগ', req: 'contact' },
  { id: 'job',       no: '৪', title: 'চাকরির তথ্য',           sub: 'পরিচিতি, পদবি ও যোগদান',                     req: 'job' },
  { id: 'pay',       no: '৫', title: 'বেতন ও ব্যাংক',         sub: 'বেতন কাঠামো, ব্যাংক ও কর',                   req: 'pay' },
  { id: 'education', no: '৬', title: 'শিক্ষাগত যোগ্যতা',      sub: 'পরীক্ষা, প্রতিষ্ঠান ও ফলাফল' },
  { id: 'previous',  no: '৭', title: 'পূর্ববর্তী অভিজ্ঞতা',   sub: 'আগের চাকরির বিবরণ' },
  { id: 'nominee',   no: '৮', title: 'নমিনি',                  sub: 'নমিনির ব্যক্তিগত তথ্য ও ঠিকানা',              req: 'nominee' },
  { id: 'referee',   no: '৯', title: 'সুপারিশকারী / রেফারেন্স', sub: 'সুপারিশকারীর পরিচিতি ও যোগাযোগ' },
];

// ─── Small styles ────────────────────────────────────────────────────────────

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(var(--ef-cols, 4), minmax(0, 1fr))', gap: '15px 18px' };
const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5, fontFamily: font };
const inputBase: CSSProperties = {
  width: '100%', height: 37, boxSizing: 'border-box', padding: '0 11px', border: `1px solid ${C.line}`, borderRadius: 8,
  background: '#fff', color: C.text, fontSize: 13, fontFamily: font, outline: 'none', transition: 'border-color .12s, box-shadow .12s',
};
const FORM_STYLE = `
.ef-root{--ef-cols:4}
.ef-in::placeholder,.ef-cell::placeholder{color:#a3b1c2}
.ef-in:focus{border-color:#2563eb !important;box-shadow:0 0 0 3px rgba(37,99,235,.16)}
.ef-in:hover:not(:disabled):not([readonly]){border-color:#94a3b8}
.ef-cell:focus{background:#eff6ff !important}
.ef-row:hover td{background:#f4f8ff}
.ef-btn{transition:background .12s,border-color .12s,color .12s,box-shadow .12s}
.ef-btn:hover:not(:disabled){box-shadow:0 1px 3px rgba(15,23,42,.18)}
.ef-sec{transition:box-shadow .15s}
/* fills the strip between the module header and the stuck command bar, so the form never shows through it */
.ef-bar::before{content:'';position:absolute;left:0;right:0;bottom:100%;height:44px;background:#f1f5f9}
@media (max-width:1100px){.ef-root{--ef-cols:3}}
@media (max-width:760px){.ef-root{--ef-cols:2}.ef-photo{grid-row:auto !important;grid-column:1 / -1 !important}}
@media (max-width:480px){.ef-root{--ef-cols:1}}
`;
const hintStyle: CSSProperties = { fontSize: 11, marginTop: 3, fontFamily: font };

const digitsOf = (v: string) => v.replace(/\D/g, '');
/** A Bangladeshi mobile: 11 digits, or 10 starting with 1 (spreadsheet dropped the leading 0). */
const mobileOk = (v: string) => { const d = digitsOf(v); return d.length === 11 || (d.length === 10 && d.startsWith('1')); };
const ageYears = (dob: string, on: Date): number | null => {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let a = on.getFullYear() - d.getFullYear();
  if (on.getMonth() < d.getMonth() || (on.getMonth() === d.getMonth() && on.getDate() < d.getDate())) a -= 1;
  return a;
};

// ─── Date input: always dd-mm-yyyy (stored as yyyy-mm-dd) ────────────────────

/** "05-03-2024" → "2024-03-05" ('' when incomplete or not a real calendar date). */
const dmyToIso = (t: string): string => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(t);
  if (!m) return '';
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  return y >= 1900 && dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
/** Keeps only digits and inserts the dashes while typing: 05032024 → 05-03-2024. */
const maskDmy = (raw: string): string => {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
};

function DateInput({ id, name, value, onCommit, style, className, disabled, readOnly, label, onBlur, bare }: {
  id?: string; name?: string; value: string; onCommit: (iso: string) => void; style?: CSSProperties; className?: string;
  disabled?: boolean; readOnly?: boolean; label?: string; onBlur?: () => void; bare?: boolean;
}) {
  const [text, setText] = useState(() => formatDMY(value));
  const [seen, setSeen] = useState(value);
  const pick = useRef<HTMLInputElement>(null);
  // the stored value changed from outside (Excel import, auto-calculation, another row): show it
  if (value !== seen) { setSeen(value); if (dmyToIso(text) !== value) setText(formatDMY(value)); }

  const type = (raw: string) => {
    const t = maskDmy(raw);
    setText(t);
    const iso = dmyToIso(t);
    if (iso || t === '') { setSeen(iso); onCommit(iso); }
    else if (value !== '') { setSeen(''); onCommit(''); }              // half-typed: the old date is no longer valid
  };
  const invalid = text.length === 10 && dmyToIso(text) === '';
  // the native calendar anchors to this hidden input, which sits under the middle of the field (so it opens centred on the field, not at the far right)
  const open = () => { try { pick.current?.showPicker(); } catch { pick.current?.focus(); } };
  return (
    <span style={{ position: 'relative', display: 'block' }}>
      <input id={id} name={name} className={className} type="text" inputMode="numeric" autoComplete="off" maxLength={10} value={text}
        disabled={disabled} readOnly={readOnly} placeholder="dd-mm-yyyy" aria-label={label} aria-invalid={invalid || undefined}
        onChange={e => type(e.target.value)} onBlur={onBlur}
        style={{ ...style, paddingRight: bare ? 30 : 32, ...(invalid ? { borderColor: ERR } : null) }} />
      {!disabled && !readOnly && (
        <>
          <button type="button" tabIndex={-1} onClick={open} aria-label="ক্যালেন্ডার থেকে নির্বাচন"
            style={{ position: 'absolute', right: 6, top: bare ? '50%' : 18, transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 2, lineHeight: 0, color: '#475569' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /><path d="M5 9h1.5M9.5 9H11M5 11.5h1.5" />
            </svg>
          </button>
          <input ref={pick} type="date" tabIndex={-1} aria-hidden="true" value={dmyToIso(text)} onChange={e => { setText(formatDMY(e.target.value)); setSeen(e.target.value); onCommit(e.target.value); }}
            style={{ position: 'absolute', left: 'calc(50% - 130px)', top: bare ? '100%' : 37, width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0 }} />
        </>
      )}
      {invalid && <span role="alert" style={{ display: 'block', ...hintStyle, color: ERR }}>⚠ তারিখ সঠিক নয় (dd-mm-yyyy)</span>}
    </span>
  );
}

// ─── Education / previous-job tables ────────────────────────────────────────

function ArrayTable<T extends { id: string }>({ entries, fields, blankEntry, onChange, addLabel }: {
  entries: T[];
  fields: { key: keyof T; label: string; placeholder: string; type?: string; width?: string }[];
  blankEntry: () => T;
  onChange: (entries: T[], initial?: boolean) => void;   // initial = the automatic first empty row (not a user edit)
  addLabel: string;
}) {
  // A table always has at least one empty row to type into.
  useEffect(() => { if (entries.length === 0) onChange([blankEntry()], true); }, [entries.length]);   // eslint-disable-line react-hooks/exhaustive-deps

  const update = (rowId: string, key: keyof T, value: string) => onChange(entries.map(row => {
    if (row.id !== rowId) return row;
    const next = { ...row, [key]: value } as unknown as Record<string, string>;
    if ((key === 'prevEndDate' || key === 'prevServiceYears') && 'prevEndDate' in next && 'prevServiceYears' in next) {
      const years = parseFloat(next.prevServiceYears);
      if (next.prevEndDate && !Number.isNaN(years) && years > 0) {
        const end = new Date(next.prevEndDate);
        end.setFullYear(end.getFullYear() - Math.floor(years));
        end.setMonth(end.getMonth() - Math.round((years % 1) * 12));
        next.prevStartDate = end.toISOString().split('T')[0];
      }
    }
    return next as unknown as T;
  }));
  const remove = (rowId: string) => { const next = entries.filter(r => r.id !== rowId); onChange(next.length ? next : [blankEntry()]); };
  const cellStyle: CSSProperties = { width: '100%', padding: '9px 10px', border: 'none', outline: 'none', fontSize: 13, fontFamily: font, boxSizing: 'border-box', background: 'transparent', color: C.text };

  const th: CSSProperties = { padding: '9px 10px', borderBottom: `1px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'left', whiteSpace: 'nowrap', background: '#eef2f7' };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.mute, fontFamily: font }}>{entries.length} টি সারি</span>
        <button type="button" className="ef-btn" onClick={() => onChange([blankEntry(), ...entries])}
          style={{ padding: '6px 14px', border: `1px solid ${ACCENT}`, background: '#eff6ff', color: ACCENT, borderRadius: 8, fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: 'pointer' }}>+ {addLabel}</button>
      </div>
      <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr><th style={{ ...th, textAlign: 'center', width: 36 }}>#</th>{fields.map(f => <th key={String(f.key)} style={{ ...th, width: f.width }}>{f.label}</th>)}<th style={{ ...th, width: 40 }} /></tr></thead>
          <tbody>
            {entries.map((row, i) => (
              <tr key={row.id} className="ef-row" style={{ background: i % 2 ? '#fafbfd' : '#fff' }}>
                <td style={{ padding: '4px 8px', textAlign: 'center', color: C.mute, fontSize: 12, borderBottom: `1px solid ${C.soft}` }}>{i + 1}</td>
                {fields.map(f => {
                  const auto = String(f.key) === 'prevStartDate';
                  return (
                    <td key={String(f.key)} style={{ padding: 0, borderBottom: `1px solid ${C.soft}`, borderLeft: `1px solid ${C.soft}` }}>
                      {f.type === 'date' || auto ? (
                        <DateInput className="ef-cell" value={String(row[f.key] ?? '')} readOnly={auto} bare label={`${f.label} — সারি ${i + 1}`} onCommit={iso => update(row.id, f.key, iso)}
                          style={{ ...cellStyle, background: auto ? '#f1f5f9' : 'transparent', color: auto ? C.mute : C.text }} />
                      ) : (
                        <input className="ef-cell" type="text" value={String(row[f.key] ?? '')} placeholder={f.placeholder}
                          aria-label={`${f.label} — সারি ${i + 1}`} onChange={e => update(row.id, f.key, e.target.value)} style={cellStyle} />
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: `1px solid ${C.soft}`, borderLeft: `1px solid ${C.soft}` }}>
                  <button type="button" onClick={() => remove(row.id)} aria-label={`${i + 1} নং সারি মুছুন`}
                    style={{ background: 'none', border: 'none', color: ERR, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── The form ────────────────────────────────────────────────────────────────

export default function EmployeeForm({ formData, handleInputChange, setFormData, onDirtyChange, onBulkImport }: Props) {
  const fd = formData as unknown as Record<string, string>;
  const v = (k: string): string => String(fd[k] ?? '');
  const [visited, setVisited]   = useState<Record<string, boolean>>({});   // fields the user has left once
  const [showAll, setShowAll]   = useState(false);                         // "ঘর খুঁজুন": every missing required field turns red
  const [closed, setClosed]     = useState<Record<string, boolean>>({});   // collapsed sections
  const [sameAddr, setSameAddr] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive]     = useState('personal');                      // section in view (scroll-spy)

  const touch = () => onDirtyChange?.(true);
  const onChange: Change = e => { handleInputChange(e); touch(); };
  const leave = (k: string) => setVisited(p => (p[k] ? p : { ...p, [k]: true }));
  const set = (patch: Record<string, string>) => { setFormData(prev => ({ ...prev, ...patch })); touch(); };

  // ── completion ──
  const missing = useMemo(() => REQUIRED_FIELDS.filter(f => String(fd[f.key] ?? '').trim() === ''), [formData]);   // eslint-disable-line react-hooks/exhaustive-deps

  const sectionStat = (id?: SectionId) => {
    if (!id) return null;
    const all = REQUIRED_FIELDS.filter(f => f.section === id), miss = all.filter(f => missing.includes(f));
    return { done: all.length - miss.length, total: all.length };
  };
  const total = REQUIRED_FIELDS.length, filled = total - missing.length, pct100 = missing.length === 0;
  const pct = total ? Math.round((filled / total) * 100) : 100;
  const bad = (k: string) => REQUIRED.has(k) && v(k).trim() === '' && (showAll || visited[k]);

  const findMissing = () => {
    setShowAll(true);
    const first = missing[0];
    if (!first) return;
    setClosed({});
    window.setTimeout(() => {
      const el = document.getElementById(`ef-${first.key}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    }, 60);
  };

  // scroll-spy: the section nearest the top of the viewport is "current" and gets highlighted
  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(`ef-sec-${s.id}`)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(es => {
      const hit = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) { const id = hit.target.id.replace('ef-sec-', ''); setActive(id); }
    }, { rootMargin: '-8% 0px -70% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  // ── one field (a plain function, not a component, so typing never remounts the input) ──
  interface FieldOpts { type?: string; placeholder?: string; options?: { value: string; label: string }[]; disabled?: boolean; readOnly?: boolean; value?: string; wide?: boolean; hint?: ReactNode; onChange?: Change; mobile?: boolean }
  const field = (k: string, label: string, o: FieldOpts = {}) => {
    const val = o.value ?? v(k), req = REQUIRED.has(k), err = bad(k);
    const style: CSSProperties = {
      ...inputBase, borderColor: err ? ERR : C.line, background: err ? '#fff8f8' : o.disabled || o.readOnly ? C.ro : '#fff',
      color: o.disabled || o.readOnly ? C.mute : C.text, cursor: o.disabled ? 'not-allowed' : undefined,
    };
    const common = { id: `ef-${k}`, name: k, value: val, disabled: o.disabled, 'aria-required': req || undefined, 'aria-invalid': err || undefined, onBlur: () => leave(k) };
    const badMobile = o.mobile && val.trim() !== '' && !mobileOk(val);
    return (
      <div key={k} style={o.wide ? { gridColumn: '1 / -1' } : undefined}>
        <label htmlFor={`ef-${k}`} style={labelStyle}>{label}{req && <span style={{ color: ERR, marginLeft: 3 }} aria-hidden="true">*</span>}</label>
        {o.options ? (
          <select {...common} className="ef-in" onChange={o.onChange ?? onChange} style={{ ...style, cursor: o.disabled ? 'not-allowed' : 'pointer' }}>
            <option value="">নির্বাচন করুন</option>
            {o.options.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        ) : o.type === 'date' ? (
          <DateInput id={`ef-${k}`} name={k} className="ef-in" value={val} disabled={o.disabled} readOnly={o.readOnly} onBlur={() => leave(k)} style={style}
            onCommit={iso => set({ [k]: iso })} />
        ) : (
          <input {...common} className="ef-in" type={o.type ?? 'text'} readOnly={o.readOnly} placeholder={o.placeholder ?? label} onChange={o.onChange ?? onChange} style={style} />
        )}
        {err && <div role="alert" style={{ ...hintStyle, color: ERR, fontWeight: 600 }}>⚠ আবশ্যক</div>}
        {!err && badMobile && <div style={{ ...hintStyle, color: '#b45309' }}>১১ ডিজিটের মোবাইল নম্বর দিন</div>}
        {!err && !badMobile && o.hint && <div style={{ ...hintStyle, color: C.mute }}>{o.hint}</div>}
      </div>
    );
  };

  // ── section shell ──
  const section = (id: string, children: ReactNode, right?: ReactNode) => {
    const meta = SECTIONS.find(s => s.id === id)!, st = sectionStat(meta.req), done = st ? st.done === st.total : false, shut = Boolean(closed[id]);
    const here = active === id;
    return (
      <section id={`ef-sec-${id}`} key={id} className="ef-sec"
        style={{ background: C.card, border: `1px solid ${here ? '#93c5fd' : C.line}`, borderRadius: 12, boxShadow: here ? '0 2px 10px rgba(37,99,235,.12)' : '0 1px 2px rgba(15,23,42,.05)', marginBottom: 14, scrollMarginTop: 70, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', background: here ? 'linear-gradient(180deg,#f3f8ff,#e6f0ff)' : 'linear-gradient(180deg,#f8fafc,#eef2f7)', boxShadow: here ? `inset 4px 0 0 ${ACCENT}` : undefined, borderBottom: shut ? 'none' : `1px solid ${C.soft}` }}>
          <span style={{ width: 28, height: 28, flex: '0 0 28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: done ? '#16a34a' : NAVY, color: '#fff', borderRadius: '50%', fontSize: 13, fontWeight: 700, fontFamily: font }}>{done ? '✓' : meta.no}</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: NAVY, fontFamily: font, lineHeight: 1.25 }}>{meta.title}</h3>
            <div style={{ fontSize: 11, color: C.mute, fontFamily: font }}>{meta.sub}</div>
          </div>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {right}
            {st && st.total > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontFamily: font, background: done ? '#dcfce7' : '#fef3c7', color: done ? '#166534' : '#92400e' }}>{done ? '✓ সম্পূর্ণ' : `${st.done}/${st.total} আবশ্যক`}</span>}
            <button type="button" onClick={() => setClosed(p => ({ ...p, [id]: !p[id] }))} aria-expanded={!shut} aria-label={`${meta.title} ${shut ? 'খুলুন' : 'বন্ধ করুন'}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mute, padding: '4px 6px', lineHeight: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ transform: shut ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><path d="M3 5l4 4 4-4" /></svg>
            </button>
          </span>
        </div>
        {st && st.total > 0 && <div style={{ height: 3, background: C.soft }}><div style={{ height: '100%', width: `${Math.round((st.done / st.total) * 100)}%`, background: done ? '#22c55e' : ACCENT, transition: 'width .25s' }} /></div>}
        {!shut && <div style={{ padding: 16 }}>{children}</div>}
      </section>
    );
  };
  const sub = (title: string, extra?: ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 11px', paddingBottom: 6, borderBottom: `1px dashed ${C.line}` }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, fontFamily: font }}>{title}</span>{extra}
    </div>
  );

  // ── derived values ──
  const age = v('dateOfBirth') ? ageYears(v('dateOfBirth'), new Date()) : null;
  const joinAge = v('dateOfBirth') && v('joiningDate') ? ageYears(v('dateOfBirth'), new Date(v('joiningDate'))) : null;
  const gross = parseFloat(v('grossSalary')) || 0, medical = parseFloat(v('medicalAllowance')) || 0, transport = parseFloat(v('transportAllowance')) || 0, food = parseFloat(v('foodAllowance')) || 0;
  const basic = gross > 0 ? (gross - medical - transport - food) / 1.5 : 0, house = basic / 2;
  const fmt = (x: number) => (x ? x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
  const sumOk = gross > 0 && Math.abs(basic + house + medical + transport + food - gross) < 0.05;

  // profile card
  const heroName = v('fullNameBengali') || v('fullName');
  const initials = (v('fullName') || v('fullNameBengali')).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
  const heroTags = [
    v('cardNo') && `কার্ড: ${v('cardNo')}`, v('designation'), v('department'),
    v('joiningDate') && `যোগদান: ${formatDMY(v('joiningDate'))}`, age !== null && age >= 0 && `বয়স: ${age} বছর`,
  ].filter((t): t is string => Boolean(t));

  // ── address handlers ──
  const addrKeys = ['HouseNo', 'Union', 'Village', 'PostOffice', 'Thana', 'District', 'Division'];
  const onPresent: Change = e => {
    const { name, value } = e.target;
    handleInputChange(e);
    if (sameAddr) set({ [name.replace('present', 'permanent')]: value });
    else touch();
  };
  const toggleSame = (on: boolean) => {
    setSameAddr(on);
    if (on) set(Object.fromEntries(addrKeys.map(k => [`permanent${k}`, v(`present${k}`)])));
  };
  const onNominee: Change = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value } as unknown as Record<string, string>;
      next.nomineeAddress = ['nomineeVillage', 'nomineePostOffice', 'nomineeThana', 'nomineeDistrict'].map(k => String(next[k] ?? '').trim()).filter(Boolean).join(', ');
      return next as unknown as EmployeeFormData;
    });
    touch();
  };

  const sel = (opts: string[]) => opts.map(x => ({ value: x, label: x }));
  const addrGrid = (kind: 'present' | 'permanent') => {
    const locked = kind === 'permanent' && sameAddr;
    const labels: [string, string][] = [['HouseNo', 'বাড়ি / বাড়ি নং / রাস্তা'], ['Union', 'ইউনিয়ন / পৌরসভা'], ['Village', 'গ্রাম'], ['PostOffice', 'ডাকঘর'], ['Thana', 'থানা'], ['District', 'জেলা'], ['Division', 'বিভাগ']];
    return <div style={grid}>{labels.map(([k, l]) => field(`${kind}${k}`, l, { disabled: locked, onChange: kind === 'present' ? onPresent : onChange }))}</div>;
  };

  const allShut = SECTIONS.every(sc => closed[sc.id]);
  const topBtn: CSSProperties = { height: 33, padding: '0 14px', border: `1px solid ${C.line}`, background: '#fff', color: '#1e293b', fontSize: 13, fontWeight: 600, letterSpacing: 0, fontFamily: font, cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' };

  return (
    <div ref={rootRef} className="ef-root" style={{ background: C.page, padding: 14, fontFamily: font }}>
      <style>{FORM_STYLE}</style>

      {/* ── fixed command bar: progress and tools stay in view while the form scrolls ── */}
      <div className="ef-bar" style={{ position: 'sticky', top: 0, zIndex: 30, margin: '-24px -14px 12px', background: '#fff', boxShadow: '0 2px 6px rgba(15,23,42,.10)' }}>
        <div style={{ background: '#fff', borderBottom: `2px solid ${NAVY}`, padding: '8px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 280px', minWidth: 230 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', fontFamily: font }}>আবশ্যক তথ্য</span>
              <span style={{ flex: 1, minWidth: 80, height: 9, background: C.soft, borderRadius: 99, overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .25s', background: pct100 ? '#22c55e' : `linear-gradient(90deg, #f59e0b, ${ACCENT})` }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: pct100 ? OK : NAVY, whiteSpace: 'nowrap', fontFamily: font, fontVariantNumeric: 'tabular-nums' }}>{filled}/{total} · {pct}%</span>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <button type="button" className="ef-btn" onClick={findMissing} disabled={missing.length === 0}
                style={{ ...topBtn, border: 'none', background: missing.length ? NAVY : '#dcfce7', color: missing.length ? '#fff' : '#166534', cursor: missing.length ? 'pointer' : 'default' }}>
                {missing.length ? `ঘর খুঁজুন (${missing.length})` : 'সব ঘর পূরণ ✓'}
              </button>
              {onBulkImport && <button type="button" className="ef-btn" onClick={onBulkImport} title="Excel ফাইল থেকে একসাথে অনেক কর্মী ইমপোর্ট করুন" style={{ ...topBtn, background: '#eff6ff', borderColor: ACCENT, color: ACCENT }}>⬆ Excel থেকে কর্মী ইমপোর্ট</button>}
              <button type="button" className="ef-btn" onClick={() => setClosed(allShut ? {} : Object.fromEntries(SECTIONS.map(sc => [sc.id, true])))} style={topBtn}>{allShut ? 'সব খুলুন' : 'সব বন্ধ করুন'}</button>
            </span>
          </div>
        </div>
      </div>

      {/* ── profile card (compact) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)', color: '#fff', borderRadius: 10, padding: '7px 14px', marginBottom: 12, boxShadow: '0 2px 8px rgba(30,58,95,.22)' }}>
        {fd.photo ? (
          <img src={fd.photo} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.65)', flex: 'none' }} />
        ) : (
          <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.16)', border: '2px solid rgba(255,255,255,.35)', fontSize: 14, fontWeight: 800 }}>{initials || '＋'}</span>
        )}
        <div style={{ minWidth: 0, flex: '1 1 260px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3px 10px' }}>
          <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3, fontFamily: font, wordBreak: 'break-word', opacity: heroName ? 1 : .6 }}>{heroName || 'নতুন কর্মী — নাম লিখুন'}</span>
          {heroTags.map(t => <span key={t} style={{ background: 'rgba(255,255,255,.16)', borderRadius: 99, padding: '1px 9px', fontSize: 11, fontFamily: font, whiteSpace: 'nowrap' }}>{t}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }} aria-label={`আবশ্যক তথ্য ${pct}% পূরণ`}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `conic-gradient(${pct100 ? '#4ade80' : '#fbbf24'} ${pct * 3.6}deg, rgba(255,255,255,.2) 0)` }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#254a77', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, fontFamily: font }}>{pct}%</span>
          </span>
          <span style={{ fontSize: 11.5, lineHeight: 1.35, fontFamily: font }}>{pct100 ? <b>সব আবশ্যক তথ্য পূরণ</b> : <><b>{missing.length} টি</b> আবশ্যক ঘর বাকি</>}</span>
        </div>
      </div>

      <div>
        <div style={{ minWidth: 0 }}>
        {/* 1 ── personal */}
        {section('personal', (
          <div style={grid}>
            <div className="ef-photo" style={{ gridColumn: 1, gridRow: '1 / span 4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: 220 }}>
                <PhotoUploadField value={fd.photo || undefined} label="কর্মীর ছবি" onChange={url => set({ photo: url ?? '' })} />
              </div>
              {bad('photo') && <div role="alert" style={{ ...hintStyle, color: ERR, textAlign: 'center' }}>ছবি আবশ্যক</div>}
            </div>
              {field('fullName', 'পূর্ণ নাম (ইংরেজি)', { placeholder: 'Full Name' })}
              {field('fullNameBengali', 'পূর্ণ নাম (বাংলা)', { placeholder: 'বাংলা নাম' })}
              {field('fatherName', 'পিতার নাম')}
              {field('motherName', 'মাতার নাম')}
              {field('dateOfBirth', 'জন্ম তারিখ', { type: 'date', hint: age === null || age < 0 ? undefined : age < 18
                ? <span style={{ color: ERR, fontWeight: 700 }}>বয়স: {age} বছর (অপ্রাপ্তবয়স্ক, সব ধরনের জন্ম নিবন্ধন সনদ যাচাই করুন।)</span>
                : `বয়স: ${age} বছর` })}
              {field('gender', 'লিঙ্গ', { options: [{ value: 'Male', label: 'পুরুষ' }, { value: 'Female', label: 'নারী' }, { value: 'Other', label: 'তৃতীয় লিঙ্গ' }] })}
              {field('bloodGroup', 'রক্তের গ্রুপ', { options: sel(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']) })}
              {field('maritalStatus', 'বৈবাহিক অবস্থা', { options: [{ value: 'Single', label: 'অবিবাহিত' }, { value: 'Married', label: 'বিবাহিত' }, { value: 'Divorced', label: 'তালাকপ্রাপ্ত' }] })}
              {field('nationality', 'জাতীয়তা', { placeholder: 'যেমন: বাংলাদেশি' })}
              {field('religion', 'ধর্ম', { placeholder: 'যেমন: ইসলাম' })}
              {field('height', 'উচ্চতা (ইঞ্চি/সে.মি.)', { placeholder: 'যেমন: 65' })}
              {field('weight', 'ওজন (কেজি)', { placeholder: 'যেমন: 60' })}
              {field('nid', 'জাতীয় পরিচয়পত্র নং', { placeholder: 'NID নম্বর', hint: v('nid') && ![10, 13, 17].includes(digitsOf(v('nid')).length) ? 'NID সাধারণত ১০, ১৩ বা ১৭ ডিজিটের হয়' : undefined })}
              {field('birthRegistrationNo', 'জন্ম নিবন্ধন নং')}
              {field('passportNumber', 'পাসপোর্ট নং')}
              {field('drivingLicense', 'ড্রাইভিং লাইসেন্স নং')}
              {field('identificationMark', 'সনাক্তকরণ চিহ্ন', { wide: true })}
          </div>
        ))}

        {/* 2 ── family */}
        {section('family', (
          <div style={grid}>
            {field('spouseName', 'স্বামী/স্ত্রীর নাম')}
            {field('spouseDob', 'স্বামী/স্ত্রীর জন্ম তারিখ', { type: 'date' })}
            {field('spouseBloodGroup', 'স্বামী/স্ত্রীর রক্তের গ্রুপ', { options: sel(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']) })}
            {field('spouseProfession', 'স্বামী/স্ত্রীর পেশা')}
            {field('spousePhone', 'স্বামী/স্ত্রীর মোবাইল', { type: 'tel', mobile: true })}
            {field('spouseEducation', 'স্বামী/স্ত্রীর শিক্ষা')}
            {field('numberOfSons', 'পুত্র সন্তান', { type: 'number', placeholder: 'সংখ্যা' })}
            {field('numberOfDaughters', 'কন্যা সন্তান', { type: 'number', placeholder: 'সংখ্যা' })}
          </div>
        ))}

        {/* 3 ── contact & address */}
        {section('contact', (
          <>
            <div style={grid}>
              {field('mobile', 'মোবাইল নম্বর', { type: 'tel', placeholder: '01700000000', mobile: true })}
              {field('email', 'ইমেইল ঠিকানা', { type: 'email', placeholder: 'email@example.com' })}
              {field('onnano', 'অন্যান্য যোগাযোগ')}
            </div>
            <div style={{ height: 14 }} />
            {sub('বর্তমান ঠিকানা')}
            {addrGrid('present')}
            <div style={{ height: 16 }} />
            {sub('স্থায়ী ঠিকানা', (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: font }}>
                <input type="checkbox" checked={sameAddr} onChange={e => toggleSame(e.target.checked)} style={{ width: 15, height: 15, accentColor: ACCENT }} />
                উভয় ঠিকানা একই
              </label>
            ))}
            {addrGrid('permanent')}
            <div style={{ height: 16 }} />
            {sub('জরুরি যোগাযোগ')}
            <div style={grid}>
              {field('emergencyName', 'নাম')}
              {field('emergencyRelation', 'সম্পর্ক')}
              {field('emergencyMobile', 'মোবাইল নম্বর', { type: 'tel', mobile: true })}
              {field('emergencyProfession', 'পেশা')}
            </div>
          </>
        ))}

        {/* 4 ── job */}
        {section('job', (
          <>
            <div style={grid}>
              {field('idNo', 'আইডি নং')}
              {field('cardNo', 'কার্ড নং', { placeholder: 'যেমন: EMP-0042' })}
              {field('proximityNumber', 'প্রক্সিমিটি নম্বর')}
              {field('grade', 'গ্রেড')}
              {field('otCategory', 'ওভারটাইম ক্যাটাগরি', { options: [{ value: 'Elegible', label: 'Elegible' }, { value: 'নন ওভারটাইম', label: 'নন ওভারটাইম' }] })}
              {field('wagesSchedule', 'মজুরি তফসিল', { options: sel(['তফসিল-ক', 'তফসিল-খ', 'তফসিল-বহির্ভূত']) })}
              {field('sectionLine', 'সেকশন / লাইন')}
              {field('designation', 'পদবি')}
              {field('department', 'বিভাগ')}
              {field('joiningDate', 'যোগদানের তারিখ', { type: 'date' })}
              {field('attendanceBonus', 'হাজিরা বোনাস (৳)', { type: 'number', disabled: true })}
              {field('jobSource', 'নিয়োগ সূত্র')}
            </div>
            {joinAge !== null && joinAge < 18 && (
              <div role="alert" aria-live="assertive" style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: `1px solid ${ERR}`, borderRadius: 8, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>🚫</span>
                <div>
                  <div style={{ fontWeight: 700, color: ERR, fontSize: 13 }}>অপ্রাপ্তবয়স্ক — যোগদানের অনুমতি নেই</div>
                  <div style={{ color: '#991b1b', fontSize: 12, marginTop: 2 }}>যোগদানের তারিখে বয়স ছিল {joinAge} বছর। বাংলাদেশ শ্রম আইন, ধারা ৩৪ অনুযায়ী ১৮ বছরের কম বয়সী কর্মী নিয়োগ নিষিদ্ধ।</div>
                </div>
              </div>
            )}
          </>
        ))}

        {/* 5 ── pay & bank */}
        {section('pay', (
          <>
            <div style={grid}>
              {field('grossSalary', 'মাসিক বেতন (মোট) (৳)', { type: 'number', placeholder: 'মোট মাসিক বেতন' })}
              {field('medicalAllowance', 'চিকিৎসা ভাতা (৳)', { type: 'number', disabled: true })}
              {field('transportAllowance', 'যাতায়াত ভাতা (৳)', { type: 'number', disabled: true })}
              {field('foodAllowance', 'খাদ্য ভাতা (৳)', { type: 'number', disabled: true })}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 4px' }}>
              {[['মূল বেতন', basic], ['বাড়ি ভাড়া (৫০%)', house], ['চিকিৎসা', medical], ['যাতায়াত', transport], ['খাদ্য', food]].map(([l, x]) => (
                <div key={String(l)} style={{ flex: '1 1 130px', border: `1px solid ${C.soft}`, borderTop: `3px solid ${NAVY}`, borderRadius: 8, background: '#f8fafc', padding: '7px 10px' }}>
                  <div style={{ fontSize: 11, color: C.mute, fontWeight: 600 }}>{String(l)}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmt(Number(x))}</div>
                </div>
              ))}
              <div style={{ flex: '1 1 130px', border: `1px solid ${sumOk ? '#86efac' : C.soft}`, borderTop: `3px solid ${sumOk ? '#22c55e' : NAVY}`, borderRadius: 8, background: sumOk ? '#f0fdf4' : '#f8fafc', padding: '7px 10px' }}>
                <div style={{ fontSize: 11, color: C.mute, fontWeight: 600 }}>মোট</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: sumOk ? OK : NAVY, fontVariantNumeric: 'tabular-nums' }}>{fmt(gross)}{sumOk ? ' ✓' : ''}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.mute, marginBottom: 14 }}>মূল বেতন = (মোট − চিকিৎসা − যাতায়াত − খাদ্য) ÷ ১.৫ · বাড়ি ভাড়া = মূল বেতনের ৫০%</div>
            {sub('ব্যাংক ও কর')}
            <div style={grid}>
              {field('tinNumber', 'টিন নম্বর')}
              {field('bankName', 'ব্যাংকের নাম')}
              {field('bankAccountNo', 'হিসাব নম্বর')}
              {field('bankBranch', 'শাখার নাম')}
            </div>
          </>
        ))}

        {/* 6 ── education */}
        {section('education', (
          <ArrayTable<EducationEntry>
            entries={formData.educationHistory} addLabel="নতুন যোগ্যতা যোগ করুন"
            onChange={(list, initial) => { setFormData(prev => ({ ...prev, educationHistory: list })); if (!initial) touch(); }}
            blankEntry={() => ({ id: generateEntryId(), education: '', institution: '', educationGroup: '', educationResult: '', educationBoard: '', passingYear: '' })}
            fields={[
              { key: 'education', label: 'শিক্ষাগত যোগ্যতা', placeholder: 'যেমন: এইচএসসি' },
              { key: 'institution', label: 'প্রতিষ্ঠানের নাম', placeholder: 'কলেজ/বিশ্ববিদ্যালয়' },
              { key: 'educationGroup', label: 'গ্রুপ / বিষয়', placeholder: 'যেমন: বিজ্ঞান' },
              { key: 'educationResult', label: 'ফলাফল / জিপিএ', placeholder: 'যেমন: GPA 4.50' },
              { key: 'educationBoard', label: 'বোর্ড / বিশ্ববিদ্যালয়', placeholder: 'যেমন: ঢাকা বোর্ড' },
              { key: 'passingYear', label: 'পাসের সন', placeholder: 'যেমন: ২০১৮', width: '90px' },
            ]}
          />
        ))}

        {/* 7 ── previous jobs */}
        {section('previous', (
          <ArrayTable<PreviousJobEntry>
            entries={formData.previousJobs} addLabel="নতুন অভিজ্ঞতা যোগ করুন"
            onChange={(list, initial) => { setFormData(prev => ({ ...prev, previousJobs: list })); if (!initial) touch(); }}
            blankEntry={() => ({ id: generateEntryId(), prevCompanyName: '', prevDesignation: '', prevSection: '', prevCompanyPhone: '', prevServiceYears: '', prevStartDate: '', prevEndDate: '', prevLeaveReason: '', prevRefDetails: '' })}
            fields={[
              { key: 'prevCompanyName', label: 'প্রতিষ্ঠানের নাম', placeholder: 'কোম্পানির নাম' },
              { key: 'prevDesignation', label: 'পদবি', placeholder: 'যেমন: অপারেটর' },
              { key: 'prevSection', label: 'সেকশন / বিভাগ', placeholder: 'যেমন: সুইং' },
              { key: 'prevServiceYears', label: 'চাকরির বছর', placeholder: 'যেমন: ২', width: '80px' },
              { key: 'prevEndDate', label: 'শেষ তারিখ', placeholder: 'তারিখ', type: 'date', width: '150px' },
              { key: 'prevStartDate', label: 'শুরুর তারিখ', placeholder: 'auto', width: '150px' },
              { key: 'prevCompanyPhone', label: 'প্রতিষ্ঠানের ফোন', placeholder: 'ফোন নম্বর' },
              { key: 'prevLeaveReason', label: 'ছাড়ার কারণ', placeholder: 'কারণ লিখুন' },
              { key: 'prevRefDetails', label: 'রেফারেন্স বিস্তারিত', placeholder: 'নাম, পদবি, ফোন' },
            ]}
          />
        ))}

        {/* 8 ── nominee */}
        {section('nominee', (
          <div style={grid}>
            {field('nomineeName', 'নমিনির নাম')}
            {field('nomineeRelation', 'কর্মীর সাথে সম্পর্ক')}
            {field('nomineeNid', 'নমিনির এনআইডি')}
            {field('nomineeDob', 'নমিনির জন্ম তারিখ', { type: 'date', hint: v('nomineeDob') && ageYears(v('nomineeDob'), new Date()) !== null ? `বয়স: ${ageYears(v('nomineeDob'), new Date())} বছর` : undefined })}
            {field('nomineePercentage', 'অংশের শতাংশ (%)', { type: 'number', placeholder: '%' })}
            {field('nomineeEducation', 'নমিনির শিক্ষা')}
            {field('nomineeProfession', 'নমিনির পেশা')}
            {field('nomineeBloodGroup', 'নমিনির রক্তের গ্রুপ', { options: sel(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']) })}
            {field('nomineePhone', 'নমিনির মোবাইল', { type: 'tel', mobile: true })}
            {field('nomineeVillage', 'নমিনির গ্রাম', { onChange: onNominee })}
            {field('nomineePostOffice', 'নমিনির ডাকঘর', { onChange: onNominee })}
            {field('nomineeThana', 'নমিনির থানা', { onChange: onNominee })}
            {field('nomineeDistrict', 'নমিনির জেলা', { onChange: onNominee })}
            {field('nomineeAddress', 'নমিনির সম্পূর্ণ ঠিকানা (স্বয়ংক্রিয়)', { readOnly: true, wide: true, placeholder: 'গ্রাম / ডাকঘর / থানা / জেলা পূরণ করলে এখানে আসবে' })}
          </div>
        ))}

        {/* 9 ── referee */}
        {section('referee', (
          <div style={grid}>
            {field('supervisorName', 'সুপারিশকারীর নাম')}
            {field('supervisorOrg', 'প্রতিষ্ঠানের নাম')}
            {field('supervisorDesignation', 'পদবি')}
            {field('supervisorProfession', 'পেশা')}
            {field('supervisorPhone', 'মোবাইল নম্বর', { type: 'tel', mobile: true })}
            {field('supervisorRelation', 'সম্পর্ক')}
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="ef-supervisorAddress" style={labelStyle}>ঠিকানা</label>
              <textarea className="ef-in" id="ef-supervisorAddress" name="supervisorAddress" rows={3} value={v('supervisorAddress')} onChange={onChange} placeholder="সম্পূর্ণ ঠিকানা লিখুন"
                style={{ ...inputBase, height: 'auto', padding: '8px 11px', resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}