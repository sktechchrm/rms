// ─────────────────────────────────────────────────────────────────────────────
// SupplierForm.tsx — নতুন অ্যাসেসমেন্ট, three parts:
//   A. Supplier information   — picked from the Compliance Audit sheet (External for Supplier audits):
//        Supplier name = siteName · Factory address = siteAddress · Contact person = siteContactName (siteContactJobTitle)
//        Mobile = sitePhone · Email = siteEmail      (read-only, filled automatically)
//   B. Assessment details     (GMFSA: Part 1 automatic from the audit, Parts 2 and 3 manual; final score = average of the 3 parts)
//   C. Approval details       (Approved By · Date of Approval · Validity (Year) · Expire On (automatic) · Status)
//
// Validation: Save is DISABLED while a required (*) field is empty. Missing fields get a red border + message once the user starts typing.
// the user presses Save. The Manager then scrolls to and focuses the first invalid field (via data-field).
// Path: src/components/modules/supplierAssessment/SupplierForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  BUSINESS_TYPE_OPTIONS, SUPPLIER_CATEGORIES, METHOD_OPTIONS, MAX_TOTAL, AREAS, STATUS_OPTIONS, STATUS_COLORS, APPROVAL_COLORS, SOON_DAYS,
  approvalLabel, partScores, areaScoresOf, overallOf, isManualArea, isLegacyPq, isNa, scoreFrom, suggestedStatus, expireOnOf, withStatus, daysFrom, formatDMY, todayIso, contactOf,
} from './types';
import type { SupplierData, SupplierIssues, Prequal, Approval, AssessmentMethod, SupplierStatus, FieldKey, SiteSummary } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { AuditEvidence } from './SupplierReport';
import { font, labelStyle, inputStyle, areaStyle, card, cardTitle, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: SupplierData;
  setData: (d: SupplierData) => void;
  issues: SupplierIssues;
  showErrors: boolean;            // true after the first failed Save
  sites: SiteSummary[];           // audited sites from the Compliance Audit sheet
  loadingSites: boolean;
  /** Print / PDF of the assessment being filled in (the header buttons are disabled by the shell on this page). */
  onPrint?: () => void;
  onPDF?: () => void;
}

const dateBox = { padding: '7px 10px', fontSize: 12.5 };
const hint = (t: string, color = '#64748b') => <div style={{ fontSize: 10.5, color, marginTop: 2, fontWeight: 600, fontFamily: font }}>{t}</div>;
const readOnly: React.CSSProperties = { ...inputStyle, background: '#f8fafc', color: '#334155', fontWeight: 700 };
const fromAudit: React.CSSProperties = { ...inputStyle, background: '#f0f9ff', color: '#0f172a', borderColor: '#bae6fd' };
const badStyle: React.CSSProperties = { borderColor: '#dc2626', background: '#fff5f5' };
const sectionTitle: React.CSSProperties = { ...cardTitle, marginBottom: 10 };

/** Plain function (not a component) so the input keeps focus while typing. '' → null; clamped to 0..max. */
const numberField = (value: number | null, onChange: (n: number | null) => void, max: number, label: string, step = 0.5, placeholder = '—', extra: React.CSSProperties = {}) => (
  <input type="number" inputMode="decimal" aria-label={label} value={value ?? ''} min={0} max={max} step={step} placeholder={placeholder}
    onChange={e => {
      const raw = e.target.value;
      if (raw === '') return onChange(null);
      const n = Number(raw);
      onChange(Number.isNaN(n) ? null : Math.min(Math.max(n, 0), max));
    }}
    style={{ ...inputStyle, ...extra }} />
);

export default function SupplierForm({ data, setData, issues, showErrors, sites, loadingSites, onPrint, onPDF }: Props) {
  const today = todayIso();
  const pq = data.prequal, ap = data.approval;
  const sc = scoreFrom(pq.overallScore);
  const areas = areaScoresOf(pq);
  const parts = partScores(pq);
  const legacy = isLegacyPq(pq);
  const expireOn = expireOnOf(ap);
  const daysLeft = expireOn ? daysFrom(today, expireOn) : null;
  const rc = APPROVAL_COLORS[sc.result];
  const stc = STATUS_COLORS[ap.status];
  const critNcs = (data.supplierName !== '' ? sites.find(s => s.supplierName === data.supplierName || s.site === data.supplierName)?.latest.critical : 0) ?? 0;
  const suggested = suggestedStatus(pq.overallScore, critNcs);
  const live = ap.status === 'Approved' || ap.status === 'Conditional';

  const set = <K extends keyof SupplierData>(field: K, value: SupplierData[K]) => setData({ ...data, [field]: value });
  const setPq = (patch: Partial<Prequal>) => setData({ ...data, prequal: { ...pq, ...patch } });
  const setAp = (patch: Partial<Approval>) => setData({ ...data, approval: { ...ap, ...patch } });

  /** Any score change: the Final score is recomputed ((Part 1 + Part 2 + Part 3) ÷ 3); while the status is Pending (or still equals the previous suggestion) it follows. */
  const commitPq = (patch: Partial<Prequal>, crit = critNcs) => {
    const next: Prequal = { ...pq, ...patch };
    next.overallScore = overallOf(next);
    const before = suggestedStatus(pq.overallScore, critNcs), after = suggestedStatus(next.overallScore, crit);
    const follow = ap.status === 'Pending' || ap.status === before;
    setData({ ...data, prequal: next, approval: follow ? withStatus(ap, after, today) : ap });
  };
  const onStatus = (s: SupplierStatus) => setAp(withStatus(ap, s, today));

  // ── validation display ──
  const errOf  = (f: FieldKey) => (showErrors ? issues.errors.find(e => e.field === f)?.message : undefined);
  const warnOf = (f: FieldKey) => issues.warnings.find(e => e.field === f)?.message;
  const bad    = (f: FieldKey): React.CSSProperties => (errOf(f) ? badStyle : {});

  /** One labelled field. data-field lets the Manager scroll to / focus the first invalid one. */
  const field = (f: FieldKey, label: string, control: React.ReactNode, o: { required?: boolean; cls?: string; extra?: React.ReactNode } = {}) => (
    <div className={o.cls} data-field={f}>
      <label style={labelStyle}>{label}{o.required && <span style={{ color: '#dc2626' }}> *</span>}</label>
      {control}
      {errOf(f)
        ? <div role="alert" style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 3, fontWeight: 600, fontFamily: font }}>{errOf(f)}</div>
        : warnOf(f) ? hint(warnOf(f)!, '#b45309') : null}
      {o.extra}
    </div>
  );

  // ── supplier picked from the Compliance Audit sheet ──
  // An empty name must match nothing (sites not yet in the supplier list have supplierName '' and would otherwise match it).
  const matchSite = (s: SiteSummary) => data.supplierName !== '' && (s.supplierName === data.supplierName || s.site === data.supplierName);
  const currentKey = sites.find(matchSite)?.key ?? (data.supplierName ? '__saved' : '');
  const picked = sites.find(s => s.key === currentKey) ?? null;

  const onPick = (key: string) => {
    if (key === '__saved') return;
    if (key === '') {
      const next: Prequal = { ...pq, auditScore: null }; next.overallScore = overallOf(next);
      setData({ ...data, supplierName: '', address: '', contactPerson: '', phone: '', email: '', prequal: next });
      return;
    }
    const s = sites.find(x => x.key === key);
    if (!s) return;
    const a = s.latest, i = s.info;
    // Audit score, date and assessor come from the latest external audit (date falls back to today); Part 1 follows it automatically.
    const next: Prequal = { ...pq, auditScore: a.score, assessmentDate: a.auditDate || today, assessedBy: i.auditorsInfo || a.auditors };
    next.overallScore = overallOf(next);
    const before = suggestedStatus(pq.overallScore, critNcs), after = suggestedStatus(next.overallScore, a.critical);
    const follow = ap.status === 'Pending' || ap.status === before;
    setData({
      ...data,
      supplierName: s.site, address: i.siteAddress, contactPerson: contactOf(i), phone: i.phone, email: i.email,
      prequal: next, approval: follow ? withStatus(ap, after, today) : ap,
    });
  };

  const srcHint = picked ? 'Not entered in Compliance Audit' : data.supplierName ? '—' : 'Select a supplier above';
  const auditScoreDiffers = !!picked && pq.auditScore !== picked.latest.score;

  /** Failed Save → list what is wrong; each item jumps to its field. */
  const FIELD_LABELS: Record<string, string> = {
    supplierName: 'Supplier', category: 'Category', email: 'Email', assessmentDate: 'Assessment date', assessedBy: 'Assessed by',
    overallScore: 'Final Compliance Score', approvedBy: 'Approved by', approvalDate: 'Date of approval', validityYears: 'Validity', status: 'Status',
    ...Object.fromEntries(AREAS.map(a => [`a_${a.key}`, `${a.no} ${a.label}`])),
  };
  const jump = (f: FieldKey) => {
    const box = document.querySelector<HTMLElement>(`[data-field="${f}"]`);
    box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (box?.querySelector<HTMLElement>('input, select, textarea, button') ?? box)?.focus({ preventScroll: true });
  };

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      {/* Only after a failed Save: says WHY it did not save; each item jumps to its field. */}
      {showErrors && issues.errors.length > 0 && (
        <div role="alert" style={{ ...card, padding: '8px 12px', borderColor: '#fecaca', background: '#fff5f5', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#b91c1c', fontFamily: font }}>{issues.errors.length} required field{issues.errors.length > 1 ? 's' : ''} missing — Save stays disabled until completed:</span>
          {issues.errors.map(e => (
            <button key={e.field} type="button" onClick={() => jump(e.field)} title={e.message}
              style={{ background: '#fff', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 12, padding: '2px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              {FIELD_LABELS[e.field]}
            </button>
          ))}
        </div>
      )}

      {(onPrint || onPDF) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
          {([['Print report', onPrint, 'ti-printer'], ['Download PDF', onPDF, 'ti-file-type-pdf']] as [string, (() => void) | undefined, string][]).filter(b => b[1]).map(([label, fn]) => (
            <button key={label} type="button" onClick={fn} disabled={!data.supplierName} title={data.supplierName ? label : 'Select a supplier first'}
              style={{ height: 32, padding: '0 14px', background: data.supplierName ? '#1e3a5f' : '#e2e8f0', color: data.supplierName ? '#fff' : '#94a3b8', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, fontFamily: font, cursor: data.supplierName ? 'pointer' : 'not-allowed' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ═════════ A. SUPPLIER INFORMATION ═════════ */}
      <div style={card}>
        <div style={sectionTitle}>A. Supplier information</div>

        {!loadingSites && sites.length === 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontSize: 12.5, color: '#92400e', fontFamily: font }}>
            No supplier audit found. Save an audit of type “External for Supplier” in the Compliance Audit module first — the supplier details are taken from it.
          </div>
        )}

        <div className="lw-grid">
          <div><label style={labelStyle}>Supplier ID</label><input value={data.supplierCode || 'Assigned on save'} readOnly style={readOnly} /></div>

          {field('supplierName', 'Supplier / company name', (
            <select value={currentKey} disabled={loadingSites} onChange={e => onPick(e.target.value)} style={{ ...inputStyle, ...bad('supplierName') }}>
              <option value="">{loadingSites ? 'Loading Compliance Audit data…' : 'Select supplier (from Compliance Audit)'}</option>
              {currentKey === '__saved' && <option value="__saved">{data.supplierName} (not in Compliance Audit)</option>}
              {sites.map(s => {
                const taken = s.inList === 'Yes' && s.supplierCode !== data.supplierCode;
                return <option key={s.key} value={s.key} disabled={taken}>{s.site}{taken ? ' — already added' : ''}</option>;
              })}
            </select>
          ), { required: true, cls: 's2', extra: picked && hint(`Latest external audit: ${formatDMY(picked.latest.auditDate) || '—'} · ${picked.latest.round || 'round —'} · score ${picked.latest.score} (${picked.latest.rating})`) })}

          {field('category', 'Supplier category', (
            <select value={data.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, ...bad('category') }}>
              <option value="">Select category</option>
              {SUPPLIER_CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ), { required: true })}

          <div>
            <label style={labelStyle}>Supplier type</label>
            <select value={data.businessType} onChange={e => set('businessType', e.target.value)} style={inputStyle}>
              {BUSINESS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="s2"><label style={labelStyle}>Product / service supplied</label><input value={data.productCategory} onChange={e => set('productCategory', e.target.value)} style={inputStyle} /></div>

          {/* The five fields below come from the Compliance Audit sheet */}
          <div><label style={labelStyle}>Contact person</label><input value={data.contactPerson} readOnly placeholder={srcHint} style={fromAudit} /></div>
          <div><label style={labelStyle}>Mobile number</label><input value={data.phone} readOnly placeholder={srcHint} style={fromAudit} /></div>
          {field('email', 'Email', <input value={data.email} readOnly placeholder={srcHint} style={fromAudit} />, { cls: 's2' })}
          <div className="s4"><label style={labelStyle}>Factory address</label><input value={data.address} readOnly placeholder={srcHint} style={fromAudit} /></div>

          <div className="s2">
            <label style={labelStyle}>Audit Certification List</label>
            <textarea value={data.certificationList} onChange={e => set('certificationList', e.target.value)} placeholder={'One per line, e.g.\nISO 9001 — valid until 30-06-2027\nBSCI — Grade A'} style={{ ...areaStyle, minHeight: 90 }} />
          </div>
          <div className="s2">
            <label style={labelStyle}>Brand / Buyer List</label>
            <textarea value={data.buyerList} onChange={e => set('buyerList', e.target.value)} placeholder={'One per line, e.g.\nH&M — Sweden\nZara — Spain'} style={{ ...areaStyle, minHeight: 90 }} />
          </div>
        </div>
        {hint('Name, address, contact, mobile and email are read from the Compliance Audit sheet. To change them, edit the audit there.')}
      </div>

      {/* ═════════ Audit evidence (only once a supplier with audits is picked) ═════════ */}
      {picked && (
        <div style={card}>
          <div style={sectionTitle}>Audit evidence — {picked.site}</div>
          <AuditEvidence site={picked} status={ap.status} parts={parts} overall={pq.overallScore} compact />
          <div style={{ marginTop: 8 }}>{hint('Read from every “External for Supplier” audit of this site in the Compliance Audit module. Open the supplier in the Approved Supplier List (or Dashboard) after saving to see the full Supplier Assessment Report.')}</div>
        </div>
      )}

      {/* ═════════ B. ASSESSMENT DETAILS ═════════ */}
      <div style={card}>
        <div style={sectionTitle}>B. Assessment details</div>
        <div className="lw-grid">
          {field('assessmentDate', 'Assessment date', (
            <div style={{ display: 'flex' }}>
              <DateFieldDMY value={pq.assessmentDate} onChange={v => setPq({ assessmentDate: v })} ariaLabel="Assessment date" clearable boxStyle={{ ...dateBox, ...bad('assessmentDate') }} />
            </div>
          ), { required: true })}
          <div>
            <label style={labelStyle}>Method</label>
            <select value={pq.method} onChange={e => setPq({ method: e.target.value as AssessmentMethod })} style={inputStyle}>
              {METHOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {field('assessedBy', 'Assessed by', <input value={pq.assessedBy} onChange={e => setPq({ assessedBy: e.target.value })} style={{ ...inputStyle, ...bad('assessedBy') }} />, { required: true })}
          {field('overallScore', 'Final Compliance Score (average of the 3 parts, out of 100)',
            <input readOnly aria-label="Final Compliance Score (automatic)" value={pq.overallScore ?? ''} placeholder="auto" style={{ ...readOnly, ...bad('overallScore') }} />,
          {
            required: true,
            extra: picked && auditScoreDiffers
              ? <>
                  {hint(pq.auditScore === null ? `The latest audit score is ${picked.latest.score}.` : `The latest audit score is now ${picked.latest.score} (this assessment used ${pq.auditScore}).`, '#b45309')}
                  <button type="button" onClick={() => commitPq({ auditScore: picked.latest.score }, picked.latest.critical)}
                    style={{ marginTop: 2, background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                    Use the audit score ({picked.latest.score})
                  </button>
                </>
              : pq.overallScore === null
                ? hint(picked ? 'Calculated once Part 2 and Part 3 are marked below.' : 'Select a supplier above (Part 1 is automatic), then mark Part 2 and Part 3.')
                : hint(legacy ? 'Saved with the earlier scoring scheme.' : `(Part 1 ${parts[0].score ?? '—'} + Part 2 ${parts[1].score ?? '—'} + Part 3 ${parts[2].score ?? '—'}) ÷ 3`),
          })}
        </div>

        <div style={{ ...cardTitle, margin: '14px 0 2px' }}>Assessment score — 3 parts × 100 marks</div>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, marginBottom: 6 }}>
          <strong>Part 1</strong> is <strong>automatic</strong>: it takes the latest Compliance Audit score and spreads it over the eight criteria by their marks.
          <strong> Part 2</strong> and <strong>Part 3</strong> are <strong>manual</strong>: mark every criterion from 0 to its maximum. <strong>N/A</strong> is allowed only with a written justification in the remark — the other criteria of that part are then scaled back to 100.
          Final score = (Part 1 + Part 2 + Part 3) ÷ 3. Support every mark with evidence (documents, records, photographs).
        </div>
        {legacy && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', margin: '6px 0', fontSize: 12.5, color: '#92400e', fontFamily: font }}>
            This assessment was saved with the earlier scoring scheme; its score ({pq.overallScore}) is kept and shown for every part.{' '}
            <button type="button" onClick={() => commitPq({ fw: 2, auditScore: picked?.latest.score ?? null, manual: {}, na: {}, overallScore: null }, picked?.latest.critical ?? 0)}
              style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontFamily: font, fontSize: 12.5 }}>Assess again with the 3-part framework</button>
          </div>
        )}
        {parts.map(part => (
          <div key={part.key} style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', background: '#f1f5f9', borderLeft: '4px solid #1e3a5f', borderRadius: 6, padding: '6px 10px' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e3a5f', fontFamily: font }}>{part.title} <span style={{ fontSize: 10, fontWeight: 700, color: part.auto ? '#0369a1' : '#b45309', background: part.auto ? '#f0f9ff' : '#fffbeb', borderRadius: 8, padding: '1px 6px' }}>{part.auto ? 'automatic' : 'manual'}</span></span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e3a5f', fontFamily: font }}>{part.label} score {part.score === null ? '—' : part.score} / {part.max}</span>
            </div>
            {part.naCount > 0 && !legacy && hint(`${part.naCount} criterion marked N/A — the applicable marks (${part.applicableMax}) are scaled to 100.`, '#b45309')}
            {part.extra && <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font, margin: '4px 2px 0' }}>Additional technical inspections where applicable: {part.extra.join(' · ')}.</div>}
            {part.defs.map(a => {
              const v = areas[a.key], manual = isManualArea(a.key) && !legacy, na = isNa(pq, a.key);
              const pct = v === null ? 0 : (v / a.max) * 100;
              const fk = `a_${a.key}` as FieldKey;
              return (
                <div key={a.key} data-field={manual ? fk : undefined} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 150px minmax(0,1.2fr)', gap: 10, alignItems: 'start', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>{a.no} {a.label}{manual && !na && <span style={{ color: '#dc2626' }}> *</span>}</div>
                    <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font, marginTop: 1 }}>{a.guide}</div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 5 }}><div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: pct >= 85 ? '#16a34a' : pct >= 70 ? '#f59e0b' : '#dc2626' }} /></div>
                    {errOf(fk) && <div role="alert" style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 3, fontWeight: 600, fontFamily: font }}>{errOf(fk)}</div>}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {manual
                        ? (na
                            ? <input readOnly aria-label={`${a.label} (N/A)`} value="N/A" style={readOnly} />
                            : numberField(pq.manual[a.key] ?? null, n => commitPq({ manual: { ...pq.manual, [a.key]: n } }), a.max, `${a.label} mark (manual)`, 0.5, '0', bad(fk)))
                        : <input readOnly aria-label={`${a.label} mark (automatic)`} value={v === null ? '' : v} placeholder="auto" style={readOnly} />}
                      <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, whiteSpace: 'nowrap' }}>/ {a.max}</span>
                    </div>
                    {manual && (
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#475569', fontFamily: font, cursor: 'pointer' }}>
                        <input type="checkbox" checked={na} onChange={e => commitPq({ na: { ...pq.na, [a.key]: e.target.checked }, manual: { ...pq.manual, [a.key]: e.target.checked ? null : pq.manual[a.key] ?? null } })} /> N/A
                      </label>
                    )}
                  </div>
                  <input value={pq.remarks[a.key] ?? ''} onChange={e => setPq({ remarks: { ...pq.remarks, [a.key]: e.target.value } })}
                    placeholder={na ? 'Justification for N/A (required)' : 'Evidence / remark (optional)'} aria-label={`${a.label} remark`} style={{ ...inputStyle, ...(na ? bad(fk) : {}) }} />
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', borderTop: '2px solid #1e3a5f', paddingTop: 8, marginTop: 8, fontFamily: font }}>
          <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginRight: 'auto' }}>{parts.map(p => `${p.label} ${p.score ?? '—'}/${p.max}`).join('  ·  ')}</span>
          <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>Final score (average)</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>{sc.total ?? '—'}<span style={{ fontSize: 13, color: '#64748b' }}>/{MAX_TOTAL}</span></span>
        </div>
        <div style={{ marginTop: 10, background: rc.bg, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, fontWeight: 600 }}>Score result (automatic)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: rc.color, fontFamily: font }}>{sc.result === 'Pending' ? 'Not yet determined' : approvalLabel(sc.result)}</span>
            {sc.total !== null && <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: font }}>grade {sc.grade}</span>}
          </div>
          <div style={{ fontSize: 11.5, color: '#475569', fontFamily: font }}>{sc.text}</div>
        </div>
      </div>

      {/* ═════════ C. APPROVAL DETAILS ═════════ */}
      <div style={card}>
        <div style={sectionTitle}>C. Approval details</div>
        <div className="lw-grid">
          {field('approvedBy', 'Approved by', <input value={ap.approvedBy} onChange={e => setAp({ approvedBy: e.target.value })} style={{ ...inputStyle, ...bad('approvedBy') }} />, { required: live })}
          {field('approvalDate', 'Date of approval', (
            <div style={{ display: 'flex' }}>
              <DateFieldDMY value={ap.approvalDate} onChange={v => setAp({ approvalDate: v })} ariaLabel="Date of approval" min={pq.assessmentDate || undefined} clearable boxStyle={{ ...dateBox, ...bad('approvalDate') }} />
            </div>
          ), { required: live })}
          {field('validityYears', 'Validity (Year)', numberField(ap.validityYears, n => setAp({ validityYears: n }), 10, 'Validity in years', 0.5, 'e.g. 1', bad('validityYears')), { required: live })}
          <div>
            <label style={labelStyle}>Expire on (automatic)</label>
            <input readOnly aria-label="Expire on" value={expireOn ? formatDMY(expireOn) : ''} placeholder="date + validity" style={readOnly} />
            {daysLeft !== null && hint(daysLeft < 0 ? `Expired ${-daysLeft} day(s) ago` : `${daysLeft} day(s) left`, daysLeft < 0 ? '#b91c1c' : daysLeft <= SOON_DAYS ? '#b45309' : '#15803d')}
          </div>
          {field('status', 'Status', (
            <select value={ap.status} onChange={e => onStatus(e.target.value as SupplierStatus)} style={{ ...inputStyle, background: stc.bg, color: stc.color, fontWeight: 700 }}>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ), { cls: 's2', extra: pq.overallScore !== null && ap.status !== suggested ? hint(`Suggested by the score: ${suggested}`) : null })}
        </div>
      </div>
    </div>
  );
}