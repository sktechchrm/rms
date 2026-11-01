// ─────────────────────────────────────────────────────────────────────────────
// SupplierForm.tsx — নতুন অ্যাসেসমেন্ট, three parts:
//   A. Supplier information   — picked from the Compliance Audit sheet (External for Supplier audits):
//        Supplier name = siteName · Factory address = siteAddress · Contact person = siteContactName (siteContactJobTitle)
//        Mobile = sitePhone · Email = siteEmail      (read-only, filled automatically)
//   B. Assessment details     (Overall Compliance Score drives the ten "Assessment score" areas automatically)
//   C. Approval details       (Approved By · Date of Approval · Validity (Year) · Expire On (automatic) · Status)
//
// Validation: no banner. Each missing / wrong field gets a red border + a message right under it, shown after
// the user presses Save. The Manager then scrolls to and focuses the first invalid field (via data-field).
// Path: src/components/modules/supplierAssessment/SupplierForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  BUSINESS_TYPE_OPTIONS, SUPPLIER_CATEGORIES, METHOD_OPTIONS, AREAS, MAX_TOTAL, STATUS_OPTIONS, STATUS_COLORS, APPROVAL_COLORS, SOON_DAYS,
  approvalLabel, areaScores, scoreFrom, suggestedStatus, expireOnOf, withStatus, daysFrom, formatDMY, todayIso, contactOf,
} from './types';
import type { SupplierData, SupplierIssues, Prequal, Approval, AssessmentMethod, SupplierStatus, FieldKey, SiteSummary } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, labelStyle, inputStyle, areaStyle, card, cardTitle, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: SupplierData;
  setData: (d: SupplierData) => void;
  issues: SupplierIssues;
  showErrors: boolean;            // true after the first failed Save
  sites: SiteSummary[];           // audited sites from the Compliance Audit sheet
  loadingSites: boolean;
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

export default function SupplierForm({ data, setData, issues, showErrors, sites, loadingSites }: Props) {
  const today = todayIso();
  const pq = data.prequal, ap = data.approval;
  const sc = scoreFrom(pq.overallScore);
  const areas = areaScores(pq.overallScore);
  const expireOn = expireOnOf(ap);
  const daysLeft = expireOn ? daysFrom(today, expireOn) : null;
  const rc = APPROVAL_COLORS[sc.result];
  const stc = STATUS_COLORS[ap.status];
  const suggested = suggestedStatus(pq.overallScore);
  const live = ap.status === 'Approved' || ap.status === 'Conditional';

  const set = <K extends keyof SupplierData>(field: K, value: SupplierData[K]) => setData({ ...data, [field]: value });
  const setPq = (patch: Partial<Prequal>) => setData({ ...data, prequal: { ...pq, ...patch } });
  const setAp = (patch: Partial<Approval>) => setData({ ...data, approval: { ...ap, ...patch } });

  /** The score drives the areas; while the status is still Pending (or still equals the previous suggestion) it follows the score too. */
  const onOverall = (n: number | null) => {
    const before = suggestedStatus(pq.overallScore), after = suggestedStatus(n);
    const follow = ap.status === 'Pending' || ap.status === before;
    setData({ ...data, prequal: { ...pq, overallScore: n }, approval: follow ? withStatus(ap, after, today) : ap });
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
  const currentKey = sites.find(s => s.supplierName === data.supplierName || s.site === data.supplierName)?.key ?? (data.supplierName ? '__saved' : '');
  const picked = sites.find(s => s.key === currentKey) ?? null;

  /** Score taken from the audit → also moves the status suggestion, exactly like typing the score would. */
  const withScore = (n: number | null) => {
    const before = suggestedStatus(pq.overallScore), after = suggestedStatus(n);
    const follow = ap.status === 'Pending' || ap.status === before;
    return { overallScore: n, approval: follow ? withStatus(ap, after, today) : ap };
  };

  const onPick = (key: string) => {
    if (key === '__saved') return;
    if (key === '') {
      setData({ ...data, supplierName: '', address: '', contactPerson: '', phone: '', email: '', prequal: { ...pq, overallScore: null } });
      return;
    }
    const s = sites.find(x => x.key === key);
    if (!s) return;
    const a = s.latest, i = s.info;
    const sc2 = withScore(a.score);
    setData({
      ...data,
      supplierName: s.site, address: i.siteAddress, contactPerson: contactOf(i), phone: i.phone, email: i.email,
      // Score, date and assessor all come from the latest external audit (date falls back to today)
      prequal: { ...pq, overallScore: sc2.overallScore, assessmentDate: a.auditDate || today, assessedBy: i.auditorsInfo || a.auditors },
      approval: sc2.approval,
    });
  };

  const srcHint = picked ? 'Not entered in Compliance Audit' : data.supplierName ? '—' : 'Select a supplier above';
  const scoreLocked = !!picked;                                   // supplier comes from an audit → score comes from it too
  const auditScoreDiffers = !!picked && pq.overallScore !== picked.latest.score;

  /** Failed Save → list what is wrong; each item jumps to its field. */
  const FIELD_LABELS: Record<FieldKey, string> = {
    supplierName: 'Supplier', category: 'Category', email: 'Email', assessmentDate: 'Assessment date', assessedBy: 'Assessed by',
    overallScore: 'Overall Compliance Score', approvedBy: 'Approved by', approvalDate: 'Date of approval', validityYears: 'Validity', status: 'Status',
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
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#b91c1c', fontFamily: font }}>Not saved — {issues.errors.length} field{issues.errors.length > 1 ? 's' : ''} need attention:</span>
          {issues.errors.map(e => (
            <button key={e.field} type="button" onClick={() => jump(e.field)} title={e.message}
              style={{ background: '#fff', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 12, padding: '2px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              {FIELD_LABELS[e.field]}
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
          {field('overallScore', 'Overall Compliance Score (out of 100)', scoreLocked
            ? <input readOnly aria-label="Overall Compliance Score (from audit)" value={pq.overallScore ?? ''} style={fromAudit} />
            : numberField(pq.overallScore, onOverall, MAX_TOTAL, 'Overall Compliance Score', 0.5, 'e.g. 82', bad('overallScore')),
          {
            required: true,
            extra: scoreLocked && picked
              ? (auditScoreDiffers
                  ? <button type="button" onClick={() => setData({ ...data, prequal: { ...pq, overallScore: withScore(picked.latest.score).overallScore }, approval: withScore(picked.latest.score).approval })}
                      style={{ marginTop: 3, background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                      Audit score is now {picked.latest.score} — click to update
                    </button>
                  : hint(`From the latest external audit (${formatDMY(picked.latest.auditDate) || '—'}) · ${picked.latest.rating}`))
              : undefined,
          })}
        </div>

        <div style={{ ...cardTitle, margin: '14px 0 2px' }}>Assessment score — {MAX_TOTAL} points</div>
        <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, marginBottom: 6 }}>Filled automatically from the Overall Compliance Score (each area = overall × area maximum ÷ 100).</div>
        {AREAS.map(a => {
          const v = areas[a.key];
          const pct = v === null ? 0 : (v / a.max) * 100;
          return (
            <div key={a.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 110px minmax(0,1.2fr)', gap: 10, alignItems: 'start', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>{a.label}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font, marginTop: 1 }}>{a.guide}</div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 5 }}><div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: pct >= 85 ? '#16a34a' : pct >= 70 ? '#f59e0b' : '#dc2626' }} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input readOnly aria-label={`${a.label} score (automatic)`} value={v === null ? '' : v} placeholder="auto" style={readOnly} />
                <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, whiteSpace: 'nowrap' }}>/ {a.max}</span>
              </div>
              <input value={pq.remarks[a.key] ?? ''} onChange={e => setPq({ remarks: { ...pq.remarks, [a.key]: e.target.value } })} placeholder="Evidence / remark (optional)" aria-label={`${a.label} remark`} style={inputStyle} />
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 8, borderTop: '2px solid #1e3a5f', paddingTop: 8, marginTop: 4, fontFamily: font }}>
          <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>Total assessment score</span>
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