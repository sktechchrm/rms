// ─────────────────────────────────────────────────────────────────────────────
// LeftNoticeImportPage.tsx — "Excel থেকে অনুপস্থিত কর্মী ইমপোর্ট": creates MANY notice records at once (a page inside the module).
// Path: src/components/modules/LeftEmployeeNotice/LeftNoticeImportPage.tsx
//
//   ১. কলাম নির্বাচন — tick the columns you have and put them in order (▲ ▼ ✕). নাম, কার্ড নং, পদবী ও অনুপস্থিতির শুরুর তারিখ always stay.
//   ২. ডেটা দিন      — paste the cells copied from Excel, or upload the filled .xlsx / .csv (columns are found by their header names).
//   ৩. যাচাই ও ইমপোর্ট — every row is checked and shows its calculated পত্র-১ / ২ / ৩ dates; only valid rows are saved.
//                      A worker with the same কার্ড নং and the same অনুপস্থিতির শুরুর তারিখ is never saved twice (already saved, or repeated in the file).
// Reading / cleaning the cells is in Leftnoticeexcel.ts; saving is done by the manager (EmployeeNoticeView.tsx).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { NOTICE_FIELDS, NOTICE_REQUIRED, downloadNoticeTemplate, parseNoticePasted, readNoticeFile } from './Leftnoticeexcel';
import type { ImportedNotice } from './Leftnoticeexcel';
import { NOTICE_RULES, addWorkingDays, formatDMY } from './leftNoticeModel';
import { font } from '../livingWage/ui';

export interface ImportOutcome { saved: number; failed: number }
interface Props {
  existing: { cardNo: string; absence: string }[];
  onImport: (items: ImportedNotice[]) => Promise<ImportOutcome>;
  onClose: () => void;
}

const NAVY = '#1e3a5f', ACCENT = '#2563eb', ERR = '#dc2626', OK = '#15803d', LINE = '#cbd5e1', SOFT = '#e2e8f0', MUTE = '#64748b';
const LOCKED = NOTICE_REQUIRED;                                             // always part of the table
const DEFAULT_COLS = [...LOCKED, 'section', 'gender', 'fatherName', 'joiningDate', 'presentVillage', 'presentDistrict'];
const REQ = new Set(NOTICE_REQUIRED);
const DEF = new Map(NOTICE_FIELDS.map(d => [d.key, d]));
const SECTIONS = [...new Set(NOTICE_FIELDS.map(d => d.section))];

const card: CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, marginBottom: 14, overflow: 'hidden' };
const btn: CSSProperties = { height: 34, padding: '0 14px', borderRadius: 7, border: `1px solid ${LINE}`, background: '#fff', color: '#334155', fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' };
const primary: CSSProperties = { ...btn, border: 'none', background: ACCENT, color: '#fff' };
const mini: CSSProperties = { width: 22, height: 22, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontSize: 11, color: '#334155' };

type Kind = 'ok' | 'invalid' | 'exists' | 'dupfile';
const KIND: Record<Kind, { label: string; bg: string; color: string }> = {
  ok:      { label: 'ঠিক আছে',          bg: '#dcfce7', color: '#166534' },
  invalid: { label: 'তথ্য অসম্পূর্ণ',   bg: '#fee2e2', color: '#991b1b' },
  exists:  { label: 'আগে থেকেই আছে',   bg: '#f1f5f9', color: '#475569' },
  dupfile: { label: 'ফাইলে ডুপ্লিকেট', bg: '#fef3c7', color: '#92400e' },
};
const GENDER_BN: Record<string, string> = { male: 'পুরুষ', female: 'মহিলা', third: 'তৃতীয় লিঙ্গ' };

function Head({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(180deg,#f8fafc,#eef2f7)', borderBottom: `1px solid ${SOFT}` }}>
      <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: '50%', background: NAVY, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{no}</span>
      <div><div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{title}</div><div style={{ fontSize: 12, color: MUTE }}>{sub}</div></div>
    </div>
  );
}

export default function LeftNoticeImportPage({ existing, onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [cols, setCols]     = useState<string[]>(DEFAULT_COLS);
  const [q, setQ]           = useState('');
  const [pasted, setPasted] = useState('');
  const [rows, setRows]     = useState<ImportedNotice[]>([]);
  const [source, setSource] = useState('');
  const [err, setErr]       = useState('');
  const [busy, setBusy]     = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone]     = useState<ImportOutcome | null>(null);

  // ── step 1 ──
  const toggle = (k: string) => { if (!LOCKED.includes(k)) setCols(c => (c.includes(k) ? c.filter(x => x !== k) : [...c, k])); };
  const addAll = (keys: string[]) => setCols(c => [...c, ...keys.filter(k => !c.includes(k))]);
  const move = (i: number, d: -1 | 1) => setCols(c => { const n = [...c], j = i + d; if (j < 0 || j >= n.length) return c; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const labels = cols.map(k => DEF.get(k)?.bn ?? k);
  const copyHeader = async () => { try { await navigator.clipboard.writeText(labels.join('\t')); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setErr('কপি করা যায়নি — ব্রাউজারের অনুমতি দিন।'); } };
  const needle = q.trim().toLowerCase();
  const shown = (sec: string) => NOTICE_FIELDS.filter(d => d.section === sec && (!needle || d.bn.toLowerCase().includes(needle) || d.en.toLowerCase().includes(needle) || d.key.toLowerCase().includes(needle)));

  // ── step 2 ──
  const fromPaste = () => {
    setErr('');
    if (!pasted.trim()) { setErr('আগে Excel থেকে ডেটা কপি করে এখানে পেস্ট করুন।'); return; }
    const r = parseNoticePasted(pasted, cols);
    if (!r.rows.length) { setErr('কোনো সারি পাওয়া যায়নি।'); return; }
    setRows(r.rows); setSource(`পেস্ট করা ডেটা${r.headerSkipped ? ' (হেডার সারি বাদ)' : ''}`); setStep(3);
  };
  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setErr('');
    try { const r = await readNoticeFile(f); setRows(r.rows); setSource(`${f.name} · শিট ${r.sheet}${r.unknown.length ? ` · চেনা যায়নি: ${r.unknown.join(', ')}` : ''}`); setStep(3); }
    catch (e) { setErr(e instanceof Error ? e.message : 'ফাইলটি পড়া যায়নি।'); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  // ── step 3: check every row ──
  const plan = useMemo(() => {
    const taken = new Set(existing.map(e => `${e.cardNo.trim().toLowerCase()}|${e.absence}`));
    const inFile = new Set<string>();
    return rows.map(row => {
      const v = row.values, why: string[] = [];
      NOTICE_REQUIRED.forEach(k => { if (!v[k]) why.push(`${DEF.get(k)?.bn} নেই`); });
      if (v.joiningDate && v.absenceStartDate && v.absenceStartDate < v.joiningDate) why.push('অনুপস্থিতির তারিখ যোগদানের আগে');
      const key = `${(v.cardNo ?? '').trim().toLowerCase()}|${v.absenceStartDate ?? ''}`;
      let kind: Kind = 'ok';
      if (why.length) kind = 'invalid';
      else if (taken.has(key)) { kind = 'exists'; why.push('এই কার্ড নং ও অনুপস্থিতির তারিখে রেকর্ড আগেই আছে'); }
      else if (inFile.has(key)) { kind = 'dupfile'; why.push('ফাইলের আগের সারিতে একই কার্ড নং ও তারিখ'); }
      if (kind === 'ok') inFile.add(key);
      const n1 = v.absenceStartDate ? addWorkingDays(v.absenceStartDate, NOTICE_RULES.first) : '';
      const n2 = n1 ? addWorkingDays(n1, NOTICE_RULES.second) : '';
      const n3 = n2 ? addWorkingDays(n2, NOTICE_RULES.third) : '';
      return { row, kind, why, n1, n2, n3 };
    });
  }, [rows, existing]);
  const good = plan.filter(p => p.kind === 'ok');
  const count = (k: Kind) => plan.filter(p => p.kind === k).length;
  const run = async () => { setBusy(true); try { setDone(await onImport(good.map(p => p.row))); } finally { setBusy(false); } };

  const tab = (n: 1 | 2 | 3, label: string) => (
    <button type="button" onClick={() => !done && (n < step || (n === 2 && step === 1)) && setStep(n)} disabled={busy}
      style={{ padding: '5px 14px', borderRadius: 14, border: 'none', fontSize: 12, fontWeight: 700, fontFamily: font, cursor: n < step ? 'pointer' : 'default', background: n === step ? '#fff' : '#ffffff26', color: n === step ? NAVY : '#fff' }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: font, background: '#f1f5f9', padding: 14 }}>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, #274c77)`, borderRadius: 12, padding: '16px 20px', color: '#fff', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, flex: 1 }}>Excel থেকে অনুপস্থিত কর্মী ইমপোর্ট</h2>
          <button type="button" onClick={onClose} disabled={busy} style={{ ...btn, background: '#ffffff1f', color: '#fff', border: '1px solid #ffffff55' }}>← তালিকায় ফিরুন</button>
        </div>
        <p style={{ margin: '6px 0 10px', fontSize: 12.5, opacity: 0.92, lineHeight: 1.6 }}>
          Excel শিটের কলাম বেছে নিন, ডেটা পেস্ট করুন বা ফাইল দিন — সিস্টেম প্রতিটি সারি যাচাই করে পত্র-১/২/৩ এর তারিখ নিজে হিসাব করবে এবং শুধু ঠিক সারিগুলো সংরক্ষণ করবে। একই কার্ড নং ও অনুপস্থিতির তারিখ দ্বিতীয়বার ঢুকবে না।
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tab(1, '১. কলাম নির্বাচন')}{tab(2, '২. ডেটা দিন')}{tab(3, '৩. যাচাই ও ইমপোর্ট')}</div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { void fromFile(e.target.files?.[0]); }} />

      {step === 1 && (
        <div style={card}>
          <Head no="১" title="কলাম নির্বাচন" sub="নাম, কার্ড নং, পদবী ও অনুপস্থিতির শুরুর তারিখ সবসময় থাকবে।" />
          <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 270px', gap: 18, alignItems: 'start' }} className="ln-grid">
            <style>{`@media (max-width:900px){.ln-grid{grid-template-columns:minmax(0,1fr) !important}.ln-cols{grid-template-columns:repeat(2,minmax(0,1fr)) !important}}`}</style>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="ফিল্ড খুঁজুন…" aria-label="ফিল্ড খুঁজুন"
                  style={{ flex: '1 1 200px', maxWidth: 300, height: 34, padding: '0 10px', border: `1px solid ${LINE}`, borderRadius: 7, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }} />
                <span style={{ flex: 1 }} />
                <button type="button" style={btn} onClick={() => setCols([...LOCKED])}>শুধু আবশ্যক (*)</button>
                <button type="button" style={btn} onClick={() => setCols([...LOCKED, ...NOTICE_FIELDS.map(d => d.key).filter(k => !LOCKED.includes(k))])}>সব ফিল্ড</button>
                <button type="button" style={btn} onClick={() => setCols(DEFAULT_COLS)}>ডিফল্ট</button>
              </div>
              {SECTIONS.map(sec => {
                const all = NOTICE_FIELDS.filter(d => d.section === sec), list = shown(sec);
                if (!list.length) return null;
                return (
                  <div key={sec} style={{ border: `1px solid ${SOFT}`, borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${SOFT}`, background: '#f8fafc' }}>
                      <b style={{ fontSize: 13, color: NAVY }}>{sec}</b><span style={{ fontSize: 11, color: MUTE }}>{all.filter(d => cols.includes(d.key)).length}/{all.length}</span>
                      <span style={{ flex: 1 }} /><button type="button" onClick={() => addAll(all.map(d => d.key))} style={{ ...btn, height: 26, fontSize: 11.5 }}>সব নিন</button>
                    </div>
                    <div className="ln-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px 12px', padding: 12 }}>
                      {list.map(d => {
                        const on = cols.includes(d.key), lock = LOCKED.includes(d.key);
                        return (
                          <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#334155', cursor: lock ? 'default' : 'pointer', minWidth: 0 }}>
                            <input type="checkbox" checked={on} disabled={lock} onChange={() => toggle(d.key)} style={{ accentColor: ACCENT, flex: '0 0 auto' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.bn}>{d.bn}{REQ.has(d.key) && <span style={{ color: ERR }}> *</span>}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ position: 'sticky', top: 8, border: `1px solid ${LINE}`, borderRadius: 10, background: '#f8fbff', padding: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, marginBottom: 8 }}>আপনার টেবিল — {cols.length} টি কলাম</div>
              <div style={{ display: 'grid', gap: 5, maxHeight: '52vh', overflow: 'auto', marginBottom: 10 }}>
                {cols.map((k, i) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: `1px solid ${SOFT}`, borderRadius: 6, padding: '4px 6px', fontSize: 12.5 }}>
                    <span style={{ width: 18, color: MUTE, fontSize: 11 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{DEF.get(k)?.bn ?? k}</span>
                    <button type="button" style={{ ...mini, opacity: i === 0 ? 0.3 : 1 }} disabled={i === 0} onClick={() => move(i, -1)} aria-label="ওপরে">▲</button>
                    <button type="button" style={{ ...mini, opacity: i === cols.length - 1 ? 0.3 : 1 }} disabled={i === cols.length - 1} onClick={() => move(i, 1)} aria-label="নিচে">▼</button>
                    {!LOCKED.includes(k) ? <button type="button" style={mini} onClick={() => toggle(k)} aria-label="বাদ দিন">✕</button> : <span style={{ width: 22 }} />}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => { void copyHeader(); }} style={{ ...btn, width: '100%', marginBottom: 6, color: copied ? OK : '#334155' }}>{copied ? '✓ কপি হয়েছে' : 'হেডার সারি কপি করুন'}</button>
              <button type="button" onClick={() => downloadNoticeTemplate(cols)} style={{ ...btn, width: '100%' }}>Excel টেমপ্লেট ডাউনলোড (.xlsx)</button>
            </div>
          </div>
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${SOFT}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={primary} onClick={() => { setErr(''); setStep(2); }}>পরের ধাপ: ডেটা দিন →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={card}>
          <Head no="২" title="ডেটা দিন" sub="নিচের কলামের ক্রমে তথ্য সাজিয়ে কপি করে পেস্ট করুন, অথবা পূরণ করা ফাইল আপলোড করুন।" />
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 8, lineHeight: 1.7 }}>
              কলামের ক্রম: {labels.map((l, i) => <span key={i} style={{ display: 'inline-block', margin: '0 4px 4px 0', padding: '1px 8px', background: '#eef2f7', borderRadius: 10, fontSize: 11.5 }}>{i + 1}. {l}</span>)}
            </div>
            <textarea value={pasted} onChange={e => setPasted(e.target.value)} rows={10} spellCheck={false} aria-label="Excel থেকে কপি করা ডেটা"
              placeholder={'Excel-এর ঘরগুলো সিলেক্ট করে কপি (Ctrl+C) করুন এবং এখানে পেস্ট (Ctrl+V) করুন।\nহেডার সারিসহ বা ছাড়া — দুটোই চলবে। তারিখ dd-mm-yyyy।'}
              style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 12.5, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', resize: 'vertical' }} />
            {err && <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: ERR }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
              <button type="button" style={btn} onClick={() => setStep(1)}>← কলাম নির্বাচন</button>
              <span style={{ flex: 1 }} />
              <button type="button" style={btn} onClick={() => downloadNoticeTemplate(cols)} title="নির্বাচিত কলামের হেডারসহ ফাঁকা Excel ফাইল">⬇ Excel ফাইল ডাউনলোড (হেডারসহ)</button>
              <button type="button" style={btn} disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'পড়া হচ্ছে…' : '⬆ Excel ফাইল আপলোড (হেডারসহ)'}</button>
              <button type="button" style={primary} onClick={fromPaste}>যাচাই করুন →</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={card}>
          <Head no="৩" title="যাচাই ও ইমপোর্ট" sub={`${source} · ${plan.length}টি সারি`} />
          <div style={{ padding: 18 }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '26px 10px' }}>
                <div style={{ fontSize: 34 }}>{done.failed ? '⚠️' : '✅'}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: done.failed ? '#92400e' : OK, marginTop: 6 }}>{done.saved}টি রেকর্ড সংরক্ষিত হয়েছে{done.failed ? ` · ${done.failed}টি ব্যর্থ` : ''}</div>
                <div style={{ fontSize: 12.5, color: MUTE, margin: '4px 0 14px' }}>বাদ পড়েছে {plan.length - good.length}টি সারি।</div>
                <button type="button" style={primary} onClick={onClose}>তালিকায় ফিরুন</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {(['ok', 'invalid', 'exists', 'dupfile'] as Kind[]).filter(k => count(k) > 0).map(k => (
                    <span key={k} style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: KIND[k].bg, color: KIND[k].color }}>{KIND[k].label} {count(k)}</span>
                  ))}
                </div>
                <div style={{ border: `1px solid ${SOFT}`, borderRadius: 8, overflow: 'auto', maxHeight: '52vh' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['#', 'নাম', 'কার্ড নং', 'পদবী', 'লিঙ্গ', 'অনুপস্থিত শুরু', 'পত্র-১', 'পত্র-২', 'পত্র-৩', 'অবস্থা'].map(h => <th key={h} style={{ position: 'sticky', top: 0, padding: '7px 10px', background: '#f8fafc', borderBottom: `1px solid ${SOFT}`, textAlign: 'left', fontSize: 11, color: MUTE }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {plan.map((p, i) => {
                        const v = p.row.values, c: CSSProperties = { padding: '6px 10px', borderBottom: `1px solid ${SOFT}`, fontSize: 12.5, whiteSpace: 'nowrap' };
                        const notes = [...p.why, ...p.row.issues.map(x => `${DEF.get(x.key)?.bn ?? x.key}: ${x.text}`)];
                        return (
                          <tr key={i} style={{ opacity: p.kind === 'ok' ? 1 : 0.7 }}>
                            <td style={{ ...c, color: MUTE }}>{i + 1}</td>
                            <td style={{ ...c, fontWeight: 600 }}>{v.name || '—'}</td>
                            <td style={c}>{v.cardNo || '—'}</td><td style={c}>{v.designation || '—'}</td>
                            <td style={c}>{GENDER_BN[v.gender] ?? (v.gender || '—')}</td>
                            <td style={c}>{v.absenceStartDate ? formatDMY(v.absenceStartDate) : '—'}</td>
                            <td style={c}>{p.n1 ? formatDMY(p.n1) : '—'}</td><td style={c}>{p.n2 ? formatDMY(p.n2) : '—'}</td><td style={c}>{p.n3 ? formatDMY(p.n3) : '—'}</td>
                            <td style={c}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: KIND[p.kind].bg, color: KIND[p.kind].color }}>{KIND[p.kind].label}</span>
                              {notes.length > 0 && <span style={{ marginLeft: 8, fontSize: 11.5, color: p.kind === 'ok' ? '#b45309' : '#991b1b' }}>{notes.join(' · ')}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button type="button" style={btn} disabled={busy} onClick={() => setStep(2)}>← ডেটা বদলান</button>
                  <span style={{ flex: 1 }} />
                  <button type="button" style={{ ...primary, background: good.length ? ACCENT : '#cbd5e1', cursor: good.length ? 'pointer' : 'default' }} disabled={busy || good.length === 0} onClick={() => { void run(); }}>
                    {busy ? 'সংরক্ষণ হচ্ছে…' : `${good.length}টি ঠিক সারি ইমপোর্ট করুন`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}