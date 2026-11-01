// ─────────────────────────────────────────────────────────────────────────────
// SupplierForm.tsx — নতুন অ্যাসেসমেন্ট, three parts:
//   A. Supplier information   (+ Audit Certification List, Brand / Buyer List)
//   B. Assessment details     (Overall Compliance Score drives the ten "Assessment score" areas automatically)
//   C. Approval details       (Approved By · Date of Approval · Validity (Year) · Expire On (automatic) · Status)
// Path: src/components/modules/supplierAssessment/SupplierForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  BUSINESS_TYPE_OPTIONS, SUPPLIER_CATEGORIES, METHOD_OPTIONS, AREAS, MAX_TOTAL, STATUS_OPTIONS, STATUS_COLORS, APPROVAL_COLORS, SOON_DAYS,
  approvalLabel, areaScores, scoreFrom, suggestedStatus, expireOnOf, withStatus, daysFrom, formatDMY, todayIso,
} from './types';
import type { SupplierData, SupplierIssues, Prequal, Approval, AssessmentMethod, SupplierStatus } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, labelStyle, inputStyle, areaStyle, card, cardTitle, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: SupplierData;
  setData: (d: SupplierData) => void;
  issues: SupplierIssues;
}

const dateBox = { padding: '7px 10px', fontSize: 12.5 };
const hint = (t: string, color = '#64748b') => <div style={{ fontSize: 10.5, color, marginTop: 2, fontWeight: 600 }}>{t}</div>;
const readOnly: React.CSSProperties = { ...inputStyle, background: '#f8fafc', color: '#334155', fontWeight: 700 };
const sectionTitle: React.CSSProperties = { ...cardTitle, marginBottom: 10 };

/** Plain function (not a component) so the input keeps focus while typing. '' → null; clamped to 0..max. */
const numberField = (value: number | null, onChange: (n: number | null) => void, max: number, label: string, step = 0.5, placeholder = '—') => (
  <input type="number" inputMode="decimal" aria-label={label} value={value ?? ''} min={0} max={max} step={step} placeholder={placeholder}
    onChange={e => {
      const raw = e.target.value;
      if (raw === '') return onChange(null);
      const n = Number(raw);
      onChange(Number.isNaN(n) ? null : Math.min(Math.max(n, 0), max));
    }}
    style={inputStyle} />
);

export default function SupplierForm({ data, setData, issues }: Props) {
  const today = todayIso();
  const pq = data.prequal, ap = data.approval;
  const sc = scoreFrom(pq.overallScore);
  const areas = areaScores(pq.overallScore);
  const expireOn = expireOnOf(ap);
  const daysLeft = expireOn ? daysFrom(today, expireOn) : null;
  const rc = APPROVAL_COLORS[sc.result];
  const stc = STATUS_COLORS[ap.status];
  const suggested = suggestedStatus(pq.overallScore);

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

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      {(issues.errors.length > 0 || issues.warnings.length > 0) && (
        <div style={{ ...card, padding: 10, borderColor: issues.errors.length ? '#fecaca' : '#fde68a', background: issues.errors.length ? '#fff5f5' : '#fffbeb' }}>
          {issues.errors.map((m, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>✕ {m}</div>)}
          {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', fontFamily: font }}>⚠ {m}</div>)}
        </div>
      )}

      {/* ═════════ A. SUPPLIER INFORMATION ═════════ */}
      <div style={card}>
        <div style={sectionTitle}>A. Supplier information</div>
        <div className="lw-grid">
          <div><label style={labelStyle}>Supplier ID</label><input value={data.supplierCode || 'Assigned on save'} readOnly style={readOnly} /></div>
          <div className="s2"><label style={labelStyle}>Supplier / company name *</label><input value={data.supplierName} onChange={e => set('supplierName', e.target.value)} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Supplier category *</label>
            <select value={data.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
              <option value="">Select category</option>
              {SUPPLIER_CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Supplier type</label>
            <select value={data.businessType} onChange={e => set('businessType', e.target.value)} style={inputStyle}>
              {BUSINESS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="s2"><label style={labelStyle}>Product / service supplied</label><input value={data.productCategory} onChange={e => set('productCategory', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Contact person</label><input value={data.contactPerson} onChange={e => set('contactPerson', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Mobile number</label><input value={data.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} /></div>
          <div className="s2"><label style={labelStyle}>Email</label><input value={data.email} onChange={e => set('email', e.target.value)} style={inputStyle} /></div>
          <div className="s4"><label style={labelStyle}>Factory address</label><input value={data.address} onChange={e => set('address', e.target.value)} style={inputStyle} /></div>
          <div className="s2">
            <label style={labelStyle}>Audit Certification List</label>
            <textarea value={data.certificationList} onChange={e => set('certificationList', e.target.value)} placeholder={'One per line, e.g.\nISO 9001 — valid until 30-06-2027\nBSCI — Grade A'} style={{ ...areaStyle, minHeight: 90 }} />
          </div>
          <div className="s2">
            <label style={labelStyle}>Brand / Buyer List</label>
            <textarea value={data.buyerList} onChange={e => set('buyerList', e.target.value)} placeholder={'One per line, e.g.\nH&M — Sweden\nZara — Spain'} style={{ ...areaStyle, minHeight: 90 }} />
          </div>
        </div>
      </div>

      {/* ═════════ B. ASSESSMENT DETAILS ═════════ */}
      <div style={card}>
        <div style={sectionTitle}>B. Assessment details</div>
        <div className="lw-grid">
          <div>
            <label style={labelStyle}>Assessment date</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={pq.assessmentDate} onChange={v => setPq({ assessmentDate: v })} ariaLabel="Assessment date" clearable boxStyle={dateBox} /></div>
          </div>
          <div>
            <label style={labelStyle}>Method</label>
            <select value={pq.method} onChange={e => setPq({ method: e.target.value as AssessmentMethod })} style={inputStyle}>
              {METHOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Assessed by</label><input value={pq.assessedBy} onChange={e => setPq({ assessedBy: e.target.value })} style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>Overall Compliance Score (out of 100)</label>
            {numberField(pq.overallScore, onOverall, MAX_TOTAL, 'Overall Compliance Score', 0.5, 'e.g. 82')}
          </div>
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
          <div><label style={labelStyle}>Approved by</label><input value={ap.approvedBy} onChange={e => setAp({ approvedBy: e.target.value })} style={inputStyle} />
            {(ap.status === 'Approved' || ap.status === 'Conditional') && !ap.approvedBy.trim() && hint('Required for an approval', '#b45309')}</div>
          <div>
            <label style={labelStyle}>Date of approval</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={ap.approvalDate} onChange={v => setAp({ approvalDate: v })} ariaLabel="Date of approval" min={pq.assessmentDate || undefined} clearable boxStyle={dateBox} /></div>
          </div>
          <div>
            <label style={labelStyle}>Validity (Year)</label>
            {numberField(ap.validityYears, n => setAp({ validityYears: n }), 10, 'Validity in years', 0.5, 'e.g. 1')}
          </div>
          <div>
            <label style={labelStyle}>Expire on (automatic)</label>
            <input readOnly aria-label="Expire on" value={expireOn ? formatDMY(expireOn) : ''} placeholder="date + validity" style={readOnly} />
            {daysLeft !== null && hint(daysLeft < 0 ? `Expired ${-daysLeft} day(s) ago` : `${daysLeft} day(s) left`, daysLeft < 0 ? '#b91c1c' : daysLeft <= SOON_DAYS ? '#b45309' : '#15803d')}
          </div>
          <div className="s2">
            <label style={labelStyle}>Status</label>
            <select value={ap.status} onChange={e => onStatus(e.target.value as SupplierStatus)} style={{ ...inputStyle, background: stc.bg, color: stc.color, fontWeight: 700 }}>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {pq.overallScore !== null && ap.status !== suggested && hint(`Suggested by the score: ${suggested}`)}
          </div>
        </div>
      </div>
    </div>
  );
}