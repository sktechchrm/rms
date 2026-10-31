// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditForm.tsx — audit details, the Auditing Areas (A–D of the 100-point
// checklist + E Better Work Cluster), auditors table and NC cards (NC Ref → NC ID + suggested timeline).
// Path: src/components/modules/complianceAudit/ComplianceAuditForm.tsx
//
// - Screen-fit layout (wide screens): details + areas on top, auditors + ONE non-compliance at a
//   time below (pick it from the NC chips) — no page scroll. Narrow screens stack normally.
// - NEW auditors / NCs are shown at the TOP (data order stays chronological, so NC IDs
//   such as A-5-1, A-5-2 never change because of the display order).
// - Timeline is a date field; each NC shows a dynamic suggested date/days for its NC Ref.
//   (The report prints it as "Date | Days".)
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS, AUDIT_AREAS, CHECKLIST_POINTS, areaCodeOf, ncRefText, findPointByRef,
  assignNcIds, suggestNc, suggestSeverity, computeAuditScore, SEVERITY_OPTIONS, resizeAuditors, resizeCorrectiveActions, suggestedDays, timelineIso, addDaysIso, daysBetween, formatDMY, todayIso,
} from './types';
import type { ComplianceAuditData, AuditorItem, CorrectiveActionItem } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const HEAD = '#1f2937', ACCENT = '#111827', BORDER = '#e5e7eb', MUTED = '#6b7280', INK = '#1f2937';

const FORM_CSS = `
  .cx { container-type: inline-size; font-family: ${font}; color: ${INK}; }
  .cx * { box-sizing: border-box; }
  .cx-card { background: #fff; border: 1px solid ${BORDER}; border-radius: 12px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
  .cx-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid ${BORDER}; flex-wrap: wrap; }
  .cx-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: ${HEAD}; }
  .cx-title i { width: 4px; height: 16px; border-radius: 2px; background: ${ACCENT}; display: inline-block; }
  .cx-badge { font-size: 11px; font-weight: 700; color: ${ACCENT}; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 999px; padding: 1px 9px; }
  .cx-body { padding: 14px; }
  .cx-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px 14px; align-items: start; }
  .cx-grid > .s2 { grid-column: span 2; }
  .cx-grid > .s4 { grid-column: span 4; }
  @container (max-width: 760px) { .cx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cx-grid > .s4 { grid-column: span 2; } }
  @container (max-width: 480px) { .cx-grid { grid-template-columns: minmax(0, 1fr); } .cx-grid > .s2, .cx-grid > .s4 { grid-column: span 1; } }
  .cx-lbl { display: block; font-size: 11.5px; font-weight: 600; color: #4b5563; margin-bottom: 4px; letter-spacing: .01em; }
  .cx-in { width: 100%; height: 34px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 12.5px; font-family: inherit; background: #fff; color: ${INK}; outline: none; transition: border-color .15s, box-shadow .15s; }
  textarea.cx-in { height: auto; min-height: 64px; padding: 8px 10px; resize: vertical; line-height: 1.45; }
  .cx-in:hover { border-color: #9ca3af; }
  .cx-in:focus { border-color: ${ACCENT}; box-shadow: 0 0 0 3px rgba(17,24,39,.15); }
  .cx-in[readonly] { background: #f3f4f6; color: ${HEAD}; font-weight: 700; cursor: default; }
  .cx-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; border: 1px solid transparent; transition: background .15s, border-color .15s, box-shadow .15s; white-space: nowrap; }
  .cx-btn-primary { background: ${ACCENT}; color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
  .cx-btn-primary:hover { background: #000000; }
  .cx-btn-ghost { background: #fff; color: #374151; border-color: #d1d5db; height: 28px; padding: 0 10px; font-size: 12px; }
  .cx-btn-ghost:hover { background: #f3f4f6; border-color: #6b7280; }
  .cx-btn:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; }
  .cx-btn:disabled { opacity: .45; cursor: not-allowed; }
  .cx-area { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid ${BORDER}; border-radius: 10px; background: #fff; cursor: pointer; font-size: 12.5px; transition: border-color .15s, background .15s; }
  .cx-area:hover { border-color: #9ca3af; }
  .cx-area.on { border-color: ${ACCENT}; background: #f3f4f6; }
  .cx-area .code { flex: none; width: 26px; height: 26px; border-radius: 7px; background: #e5e7eb; color: #374151; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .cx-area.on .code { background: ${ACCENT}; color: #fff; }
  .cx-table { width: 100%; border-collapse: collapse; min-width: 560px; }
  .cx-table th { padding: 8px; font-size: 11px; font-weight: 700; color: #4b5563; background: #f9fafb; text-align: left; border-bottom: 1px solid ${BORDER}; text-transform: uppercase; letter-spacing: .03em; }
  .cx-table td { padding: 6px; border-bottom: 1px solid #f3f4f6; }
  .cx-nc { border: 1px solid ${BORDER}; border-radius: 10px; margin-bottom: 12px; overflow: hidden; background: #fff; }
  .cx-nc-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid ${BORDER}; }
  .cx-pill { font-size: 12px; font-weight: 800; color: #fff; background: ${HEAD}; border-radius: 6px; padding: 2px 9px; letter-spacing: .02em; }
  .cx-ref { margin-top: 6px; padding: 7px 10px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; font-size: 11.5px; line-height: 1.5; color: #374151; }
  .cx-link { background: none; border: 0; padding: 0; font: inherit; font-weight: 700; color: ${ACCENT}; cursor: pointer; text-decoration: underline; }
  .cx-iconbtn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #1f2937; cursor: pointer; padding: 0; }
  .cx-iconbtn:hover { background: #f3f4f6; border-color: #6b7280; }
  .cx-iconbtn:focus-visible { outline: 2px solid #111827; outline-offset: 2px; }
  .cx-sug { display: flex; gap: 8px; align-items: flex-start; margin-top: 4px; font-size: 11px; line-height: 1.35; color: #6b7280; }
  .cx-sug > span { flex: 1; min-width: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cx-seg { display: inline-flex; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; flex: none; }
  .cx-seg button { height: 28px; padding: 0 12px; border: 0; background: #fff; font: inherit; font-size: 12px; font-weight: 700; color: #6b7280; cursor: pointer; }
  .cx-seg button + button { border-left: 1px solid #d1d5db; }
  .cx-seg button:hover { background: #f3f4f6; }
  .cx-seg button.on { background: #111827; color: #fff; }
  .cx-hint { margin-top: 4px; font-size: 11px; color: ${MUTED}; }

  .cx-wrap { container-type: inline-size; width: 100%; max-width: 100%; }
  .cx { --cx-offset: 230px; }
  .cx-top, .cx-bottom { display: grid; gap: 12px; margin-bottom: 12px; }
  .cx-card { margin-bottom: 0; display: flex; flex-direction: column; min-height: 0; }
  .cx-scroll { overflow: auto; min-height: 0; flex: 1; }
  .cx-body { padding: 10px 12px; }
  .cx-head { padding: 7px 12px; }
  .cx-grid { gap: 8px 12px; }
  .cx-lbl { margin-bottom: 3px; }
  .cx-in { height: 32px; }
  textarea.cx-in { min-height: 0; height: 48px; }
  .cx-areas { display: flex; flex-direction: column; gap: 4px; }
  .cx-area { padding: 3px 8px; align-items: center; gap: 8px; }
  .cx-area .code { width: 20px; height: 20px; font-size: 11px; }
  .cx-chips { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 12px; border-bottom: 1px solid ${BORDER}; }
  .cx-chip { height: 28px; padding: 0 11px; border-radius: 999px; border: 1px solid #d1d5db; background: #fff; color: #374151; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
  .cx-chip:hover { border-color: #6b7280; }
  .cx-chip.on { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
  @container (min-width: 1100px) {
    .cx { height: calc(100dvh - var(--cx-offset)); min-height: 540px; display: flex; flex-direction: column; }
    .cx-top { grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); flex: none; }
    .cx-bottom { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); flex: 1; min-height: 0; margin-bottom: 0; }
    .cx-bottom > .cx-card { min-height: 0; }
  }
  @container (max-width: 1099px) {
    .cx-top, .cx-bottom { grid-template-columns: minmax(0, 1fr); }
    .cx-card { margin-bottom: 0; }
  }
`;

// ─── Timeline: date field + dynamic suggestion ───────────────────────────────

interface TimelineProps { value: string; suggested: number | null; auditDate: string; onChange: (iso: string) => void; }

function TimelineField({ value, suggested, auditDate, onChange }: TimelineProps) {
  const base = auditDate || todayIso();
  const iso = timelineIso(value, auditDate);
  const days = iso ? daysBetween(base, iso) : null;
  const sugIso = suggested ? addDaysIso(base, suggested) : '';

  return (
    <div>
      <div style={{ display: 'flex', minWidth: 0 }}>
        <DateFieldDMY value={iso} onChange={onChange} ariaLabel="Timeline date" clearable boxStyle={{ padding: '6px 10px', fontSize: 12.5 }} />
      </div>
      {(days !== null || suggested) && (
        <div className="cx-hint">
          {days !== null && <><b>{days} days</b> {auditDate ? 'from audit date' : 'from today'}</>}
          {days !== null && suggested ? ' · ' : ''}
          {suggested && (sugIso === iso
            ? <>✓ matches suggested {suggested} days</>
            : <>Suggested {suggested} days ({formatDMY(sugIso)}) <button type="button" className="cx-link" onClick={() => onChange(sugIso)}>Use</button></>)}
        </div>
      )}
    </div>
  );
}

// ─── Suggestion line (shown under Details / Recommendation) ──────────────────

function SuggestLine({ text, current, onUse }: { text: string; current: string; onUse: (v: string) => void }) {
  const used = current.includes(text);
  return (
    <div className="cx-sug">
      <span title={text}><b>Suggested:</b> {text}</span>
      {used
        ? <span style={{ flex: 'none', fontWeight: 700 }}>✓ used</span>
        : <button type="button" className="cx-link" style={{ flex: 'none' }} onClick={() => onUse(current.trim() ? `${current.trim()}\n${text}` : text)}>Use</button>}
    </div>
  );
}

// ─── Print one checklist area (opens the browser print dialog) ───────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function printArea(code: string) {
  const area = AUDIT_AREAS.find(a => a.code === code);
  if (!area) return;
  let last = '';
  const rows = CHECKLIST_POINTS.filter(p => p.area === code).map(p => {
    const g = p.group && p.group !== last ? `<tr><td colspan="4" class="g">${esc(p.group)}</td></tr>` : '';
    last = p.group ?? last;
    return `${g}<tr><td class="c">${p.sl}</td><td>${esc(p.point)}</td><td>${esc(p.principle)}</td><td class="s">${suggestSeverity(p)}</td></tr>`;
  }).join('');
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Checklist ${esc(area.code)}</title><style>
    @page{size:A4 landscape;margin:12mm}body{font-family:'Noto Sans Bengali',Arial,sans-serif;font-size:11px;color:#000;margin:0}
    h1{font-size:15px;margin:0 0 2px}p{margin:0 0 8px;color:#444}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #000;padding:4px 6px;text-align:left;vertical-align:top}th{background:#e5e7eb}
    td.c{text-align:center;width:36px}td.s{width:64px;font-weight:700}td.g{background:#f3f4f6;font-weight:700}tr{break-inside:avoid}thead{display:table-header-group}
  </style></head><body><h1>Code of Conduct Checklist — ${esc(area.code)}. ${esc(area.name)}</h1><p>${area.count} points</p>
  <table><thead><tr><th>SL</th><th>Code of Conduct Point</th><th>Principle No. of Standard</th><th>Severity</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  doc.close();
  const win = iframe.contentWindow!;
  win.addEventListener('afterprint', () => { if (iframe.parentNode) document.body.removeChild(iframe); });
  setTimeout(() => { win.focus(); win.print(); }, 250);
}

// Severity tag: black = Critical, dark outline = Major, light = Minor (black/white/gray only)
function SevTag({ s }: { s: 'Minor' | 'Major' | 'Critical' }) {
  const st = s === 'Critical' ? { background: '#111827', color: '#fff', border: '1px solid #111827' }
    : s === 'Major' ? { background: '#fff', color: '#111827', border: '1px solid #111827' }
    : { background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db' };
  return <span style={{ ...st, borderRadius: 999, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{s}</span>;
}

// ─── Checklist viewer (read-only popup) ──────────────────────────────────────

function ChecklistViewer({ selected, onClose }: { selected: string[]; onClose: () => void }) {
  const [tab, setTab] = useState(AUDIT_AREAS[0].code);
  const [q, setQ] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const area = AUDIT_AREAS.find(a => a.code === tab)!;
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const rows = CHECKLIST_POINTS.filter(p => p.area === tab && words.every(w => `${p.sl} ${p.point} ${p.principle} ${p.group ?? ''} ${suggestSeverity(p)}`.toLowerCase().includes(w)));

  return (
    <div role="dialog" aria-modal="true" aria-label="Checklist" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 'min(1000px, 100%)', height: 'min(80vh, 720px)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,.3)', fontFamily: font, color: INK }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Code of Conduct Checklist</div>
          <input className="cx-in" style={{ flex: 1, minWidth: 160, maxWidth: 320, marginLeft: 'auto' }} placeholder="Search point, standard, ID…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          <button type="button" className="cx-btn cx-btn-ghost" style={{ color: '#1f2937', borderColor: '#d1d5db' }} title={`Print ${area.code}. ${area.name}`} onClick={() => printArea(area.code)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>Print
          </button>
          <button type="button" className="cx-iconbtn" aria-label="Close" title="Close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
          {AUDIT_AREAS.map(a => (
            <button key={a.code} type="button" className={`cx-chip${a.code === tab ? ' on' : ''}`} onClick={() => setTab(a.code)} title={a.name}>
              {a.code}. {a.name.length > 26 ? a.name.slice(0, 24) + '…' : a.name} · {a.count}{selected.includes(a.label) ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <div style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: MUTED }}>{area.code}. {area.name} — {rows.length} of {area.count} points · Severity shown is the suggested default for an NC on that point</div>
        <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
          <table className="cx-table" style={{ minWidth: 0 }}>
            <thead style={{ position: 'sticky', top: 0 }}><tr><th style={{ width: 52, textAlign: 'center' }}>SL</th><th>Code of Conduct Point</th><th style={{ width: '32%' }}>Principle No. of Standard</th><th style={{ width: 84 }}>Severity</th></tr></thead>
            <tbody>
              {rows.map((p, i) => (
                <Fragment key={p.sl}>
                  {p.group && p.group !== rows[i - 1]?.group && (
                    <tr key={`g${p.sl}`}><td colSpan={4} style={{ background: '#f3f4f6', fontWeight: 700, fontSize: 12, padding: '6px 10px' }}>{p.group}</td></tr>
                  )}
                  <tr>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.sl}</td>
                    <td style={{ fontSize: 12.5, padding: '6px 10px' }}>{p.point}</td>
                    <td style={{ fontSize: 12, color: '#4b5563', padding: '6px 10px' }}>{p.principle}</td>
                    <td style={{ padding: '6px 10px' }}><SevTag s={suggestSeverity(p)} /></td>
                  </tr>
                </Fragment>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: MUTED, padding: 24 }}>No matching points</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

interface Props { data: ComplianceAuditData; setData: (data: ComplianceAuditData) => void; }

export default function ComplianceAuditForm({ data, setData }: Props) {
  const set = <K extends keyof ComplianceAuditData>(field: K, value: ComplianceAuditData[K]) => setData({ ...data, [field]: value });

  const toggleArea = (v: string) =>
    set('auditingAreas', data.auditingAreas.includes(v) ? data.auditingAreas.filter(a => a !== v) : [...data.auditingAreas, v]);

  // NC Ref choices: the points of the ticked Auditing Areas (all 100 points while none is ticked).
  const ncRefPoints = useMemo(() => {
    const codes = data.auditingAreas.map(areaCodeOf).filter(Boolean);
    return CHECKLIST_POINTS.filter(p => !codes.length || codes.includes(p.area));
  }, [data.auditingAreas]);

  // Auditors (newest shown first)
  const setAuditor = (i: number, f: keyof AuditorItem, v: string) => {
    const next = [...data.auditors]; next[i] = { ...next[i], [f]: v }; setData({ ...data, auditors: next });
  };
  const addAuditor = () => setData({ ...data, auditors: resizeAuditors(data.auditors, data.auditors.length + 1) });
  const removeAuditor = (i: number) => {
    if (data.auditors.length <= 1) return;
    setData({ ...data, auditors: data.auditors.filter((_, k) => k !== i).map((a, k) => ({ ...a, slNo: k + 1 })) });
  };

  // NC items (newest shown first)
  const setNc = (i: number, f: keyof CorrectiveActionItem, v: string) => {
    const next = [...data.correctiveActions];
    const prev = next[i];
    next[i] = { ...prev, [f]: v } as CorrectiveActionItem;
    if (f === 'ncRef') {
      // Suggest the severity of the chosen point unless the user already picked a different one.
      const oldP = findPointByRef(prev.ncRef), newP = findPointByRef(v);
      if (newP && (!prev.severity || (oldP && prev.severity === suggestSeverity(oldP)))) next[i].severity = suggestSeverity(newP);
    }
    setData({ ...data, correctiveActions: assignNcIds(next) });
  };
  const addNc = () => setData({ ...data, correctiveActions: resizeCorrectiveActions(data.correctiveActions, data.correctiveActions.length + 1) });
  const removeNc = (i: number) => {
    if (data.correctiveActions.length <= 1) return;
    setData({ ...data, correctiveActions: assignNcIds(data.correctiveActions.filter((_, k) => k !== i).map((c, k) => ({ ...c, slNo: k + 1 }))) });
  };

  const auditorRows = data.auditors.map((a, i) => ({ a, i })).reverse();
  const ncRows = data.correctiveActions.map((c, i) => ({ c, i })).reverse();

  const [activeNc, setActiveNc] = useState(0);
  const cur = Math.min(activeNc, data.correctiveActions.length - 1);
  const c = data.correctiveActions[cur];
  const p = findPointByRef(c.ncRef);
  const sug = p ? suggestNc(p) : null;
  const audit = computeAuditScore(data.correctiveActions);
  const [viewOpen, setViewOpen] = useState(false);

  const addNcActive = () => { addNc(); setActiveNc(data.correctiveActions.length); };
  const removeNcActive = () => { removeNc(cur); setActiveNc(Math.max(0, cur - 1)); };

  return (
    <div className="cx-wrap">
      <style>{FORM_CSS}</style>
      {viewOpen && <ChecklistViewer selected={data.auditingAreas} onClose={() => setViewOpen(false)} />}
      <div className="cx" style={{ overflowWrap: 'anywhere' }}>

        <div className="cx-top">
          {/* Audit details */}
          <section className="cx-card">
            <div className="cx-head"><div className="cx-title"><i />Audit Details</div></div>
            <div className="cx-body">
              <div className="cx-grid">
                <div>
                  <label className="cx-lbl">অডিটের ধরন</label>
                  <select className="cx-in" value={data.auditType} onChange={e => set('auditType', e.target.value as ComplianceAuditData['auditType'])}>
                    {AUDIT_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="cx-lbl">Company Name *</label>
                  <input className="cx-in" value={data.companyName} onChange={e => set('companyName', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Site Name *</label>
                  <input className="cx-in" value={data.siteName} onChange={e => set('siteName', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Audit Round</label>
                  <select className="cx-in" value={data.auditRound} onChange={e => set('auditRound', e.target.value as ComplianceAuditData['auditRound'])}>
                    {AUDIT_ROUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="s2">
                  <label className="cx-lbl">Site Address</label>
                  <input className="cx-in" value={data.siteAddress} onChange={e => set('siteAddress', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Site Contact Name</label>
                  <input className="cx-in" value={data.siteContactName} onChange={e => set('siteContactName', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Job Title</label>
                  <input className="cx-in" value={data.siteContactJobTitle} onChange={e => set('siteContactJobTitle', e.target.value)} />
                </div>

                <div>
                  <label className="cx-lbl">Site Phone</label>
                  <input className="cx-in" value={data.sitePhone} onChange={e => set('sitePhone', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Site Email</label>
                  <input className="cx-in" value={data.siteEmail} onChange={e => set('siteEmail', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Date of Audit</label>
                  <div style={{ display: 'flex', minWidth: 0 }}>
                    <DateFieldDMY value={data.auditDate} onChange={v => set('auditDate', v)} ariaLabel="Date of audit" clearable boxStyle={{ padding: '6px 10px', fontSize: 12.5 }} />
                  </div>
                </div>
                <div>
                  <label className="cx-lbl">মন্তব্য</label>
                  <input className="cx-in" value={data.remarks} onChange={e => set('remarks', e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {/* Auditing areas — the 4 sections of the Complete 100-point checklist */}
          <section className="cx-card">
            <div className="cx-head">
              <div className="cx-title"><i />Auditing Areas <span className="cx-badge">{data.auditingAreas.length} selected</span></div>
              <button type="button" className="cx-iconbtn" title="View checklist" aria-label="View checklist" onClick={() => setViewOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </div>
            <div className="cx-body">
              <div className="cx-areas">
                {AUDIT_AREAS.map(a => {
                  const on = data.auditingAreas.includes(a.label);
                  return (
                    <label key={a.code} className={`cx-area${on ? ' on' : ''}`} title={`${a.code}. ${a.name} — ${a.count} points`}>
                      <input type="checkbox" checked={on} onChange={() => toggleArea(a.label)} style={{ display: 'none' }} />
                      <span className="code">{a.code}</span>
                      <span style={{ fontWeight: 600, fontSize: 12, minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: MUTED, flex: 'none' }}>{a.count}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        <div className="cx-bottom">
          {/* Auditors */}
          <section className="cx-card">
            <div className="cx-head">
              <div className="cx-title"><i />Auditors <span className="cx-badge">{data.auditors.length}</span></div>
              <button type="button" className="cx-btn cx-btn-primary" onClick={addAuditor}>＋ Add Auditor</button>
            </div>
            <div className="cx-scroll">
              <table className="cx-table" style={{ minWidth: 0 }}>
                <thead><tr><th style={{ width: 34, textAlign: 'center' }}>SL</th><th>নাম / পদবী / প্রতিষ্ঠান</th><th style={{ width: 40 }} /></tr></thead>
                <tbody>
                  {auditorRows.map(({ a, i }) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: HEAD }}>{a.slNo}</td>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <input className="cx-in" placeholder="নাম" aria-label="Name" value={a.name} onChange={e => setAuditor(i, 'name', e.target.value)} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                            <input className="cx-in" placeholder="পদবী" aria-label="Designation" value={a.designation} onChange={e => setAuditor(i, 'designation', e.target.value)} />
                            <input className="cx-in" placeholder="প্রতিষ্ঠান" aria-label="Organization" value={a.organization} onChange={e => setAuditor(i, 'organization', e.target.value)} />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="cx-btn cx-btn-ghost" aria-label="Remove auditor" title="Remove" disabled={data.auditors.length <= 1} onClick={() => removeAuditor(i)} style={{ padding: '0 8px' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Non-compliances — one at a time, picked from the chips (newest first) */}
          <section className="cx-card">
            <div className="cx-head">
              <div className="cx-title"><i />Non-Compliances <span className="cx-badge">{data.correctiveActions.length}</span>
                <span className="cx-badge" title="Audit score = 100 − (Critical×10 + Major×5 + Minor×2)">Score {audit.score}/100 · {audit.rating}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>Critical {audit.critical} · Major {audit.major} · Minor {audit.minor}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="cx-btn cx-btn-ghost" onClick={removeNcActive} disabled={data.correctiveActions.length <= 1}>🗑 Remove this NC</button>
                <button type="button" className="cx-btn cx-btn-primary" onClick={addNcActive}>＋ Add Non-Compliance</button>
              </div>
            </div>
            <div className="cx-chips" role="tablist" aria-label="Non-compliances">
              {ncRows.map(({ c: nc, i }) => (
                <button key={i} type="button" role="tab" aria-selected={i === cur} className={`cx-chip${i === cur ? ' on' : ''}`} onClick={() => setActiveNc(i)}>
                  {nc.ncId || `#${nc.slNo}`}
                </button>
              ))}
            </div>
            <div className="cx-scroll cx-body">
              <div className="cx-grid">
                <div>
                  <label className="cx-lbl">NC ID (Sl No. {c.slNo})</label>
                  <input className="cx-in" value={c.ncId} readOnly title="Generated from the NC Ref: Area-Point SL-No." placeholder="A-5-1" />
                </div>
                <div className="s2">
                  <label className="cx-lbl">NC Ref (standard point)</label>
                  <select className="cx-in" value={c.ncRef} onChange={e => setNc(cur, 'ncRef', e.target.value)}>
                    <option value="">— Select Code of Conduct point —</option>
                    {c.ncRef && !ncRefPoints.some(x => ncRefText(x) === c.ncRef) && <option value={c.ncRef}>{c.ncRef}</option>}
                    {AUDIT_AREAS.flatMap(a => {
                      const pts = ncRefPoints.filter(x => x.area === a.code);
                      const groups = Array.from(new Set(pts.map(x => x.group ?? '')));
                      return groups.map(g => (
                        <optgroup key={`${a.code}|${g}`} label={g ? `${a.code}. ${a.name} — ${g}` : `${a.code}. ${a.name}`}>
                          {pts.filter(x => (x.group ?? '') === g).map(x => <option key={x.sl} value={ncRefText(x)}>{x.sl}. {x.point}</option>)}
                        </optgroup>
                      ));
                    })}
                  </select>
                </div>
                <div>
                  <label className="cx-lbl">TimeLine</label>
                  <TimelineField value={c.timeline} suggested={p ? suggestedDays(p) : null} auditDate={data.auditDate} onChange={v => setNc(cur, 'timeline', v)} />
                </div>

                <div className="s4" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {p && (
                    <div className="cx-ref" style={{ marginTop: 0, flex: 1, minWidth: 240 }}>
                      <b>Code of Conduct Point:</b> {p.point} &nbsp;·&nbsp; <b>Principle No. of Standard:</b> {p.principle}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: p ? 0 : 'auto' }}>
                    <span className="cx-lbl" style={{ margin: 0 }}>Severity</span>
                    <div className="cx-seg" role="radiogroup" aria-label="Severity">
                      {SEVERITY_OPTIONS.map(s => (
                        <button key={s} type="button" role="radio" aria-checked={c.severity === s} className={c.severity === s ? 'on' : ''}
                          title={p && suggestSeverity(p) === s ? 'Suggested for this point' : undefined} onClick={() => setNc(cur, 'severity', s)}>
                          {s}{p && suggestSeverity(p) === s ? ' •' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="s2">
                  <label className="cx-lbl">Details of Non-Compliance</label>
                  <textarea className="cx-in" value={c.detailsOfNonCompliance} onChange={e => setNc(cur, 'detailsOfNonCompliance', e.target.value)} />
                  {sug && <SuggestLine text={sug.description} current={c.detailsOfNonCompliance} onUse={v => setNc(cur, 'detailsOfNonCompliance', v)} />}
                </div>
                <div className="s2">
                  <label className="cx-lbl">Recommendation</label>
                  <textarea className="cx-in" value={c.preventiveCorrectiveActions} onChange={e => setNc(cur, 'preventiveCorrectiveActions', e.target.value)} />
                  {sug && <SuggestLine text={sug.recommendation} current={c.preventiveCorrectiveActions} onUse={v => setNc(cur, 'preventiveCorrectiveActions', v)} />}
                </div>

                <div className="s2">
                  <label className="cx-lbl">Non-Compliance Picture (link)</label>
                  <input className="cx-in" value={c.nonCompliancePictureLink} onChange={e => setNc(cur, 'nonCompliancePictureLink', e.target.value)} placeholder="Google Drive link" />
                </div>
                <div>
                  <label className="cx-lbl">Agreed By Management</label>
                  <input className="cx-in" value={c.agreedByManagement} onChange={e => setNc(cur, 'agreedByManagement', e.target.value)} />
                </div>
                <div>
                  <label className="cx-lbl">Responsible Person</label>
                  <input className="cx-in" value={c.responsiblePersonName} onChange={e => setNc(cur, 'responsiblePersonName', e.target.value)} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}