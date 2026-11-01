// ─────────────────────────────────────────────────────────────────────────────
// SupplierForm.tsx — নতুন অ্যাসেসমেন্ট (one page, four sections):
//   Supplier information · Assessment details · Assessment score (100 points) · Additional (certificates, buyers)
// The result (Approved / Conditional / Not Approved) is automatic — it comes from the score.
// Path: src/components/modules/supplierAssessment/SupplierForm.tsx
// ─────────────────────────────────────────────────────────────────────────────

import {
  BUSINESS_TYPE_OPTIONS, SUPPLIER_CATEGORIES, METHOD_OPTIONS, AREAS, MAX_TOTAL, CERTIFICATE_SUGGESTIONS, APPROVAL_COLORS, STATUS_COLORS,
  approvalLabel, scorePrequal, statusOf, blankCertificate, blankBuyer,
} from './types';
import type { SupplierData, SupplierIssues, Prequal, AssessmentMethod, SupplierCertificate, SupplierBuyer } from './types';
import { DateFieldDMY } from '../correctiveAction/CorrectiveActionForm';
import { font, labelStyle, inputStyle, areaStyle, card, cardTitle, btn, FORM_CSS } from '../livingWage/ui';

interface Props {
  data: SupplierData;
  setData: (d: SupplierData) => void;
  issues: SupplierIssues;
}

const dateBox = { padding: '7px 10px', fontSize: 12.5 };
const hint = (t: string, color = '#64748b') => <div style={{ fontSize: 10.5, color, marginTop: 2, fontWeight: 600 }}>{t}</div>;
const removeBtn = (onClick: () => void, label: string) => (
  <button type="button" onClick={onClick} aria-label={label} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12.5, fontFamily: font }}>🗑 Remove</button>
);

/** Plain function (not a component) so the input keeps focus while typing. '' → null; clamped to 0..max. */
const scoreField = (value: number | null, onChange: (n: number | null) => void, max: number, label: string) => (
  <input type="number" inputMode="decimal" aria-label={label} value={value ?? ''} min={0} max={max} step={0.5} placeholder="—"
    onChange={e => {
      const raw = e.target.value;
      if (raw === '') return onChange(null);
      const n = Number(raw);
      onChange(Number.isNaN(n) ? null : Math.min(Math.max(n, 0), max));
    }}
    style={inputStyle} />
);

export default function SupplierForm({ data, setData, issues }: Props) {
  const pq = scorePrequal(data.prequal);
  const status = statusOf(pq);
  const sc = STATUS_COLORS[status];
  const rc = APPROVAL_COLORS[pq.result];

  const set = <K extends keyof SupplierData>(field: K, value: SupplierData[K]) => setData({ ...data, [field]: value });
  const setPq = (patch: Partial<Prequal>) => setData({ ...data, prequal: { ...data.prequal, ...patch } });
  const setCert = (i: number, patch: Partial<SupplierCertificate>) => set('certificates', data.certificates.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const setBuyer = (i: number, patch: Partial<SupplierBuyer>) => set('buyers', data.buyers.map((b, k) => (k === i ? { ...b, ...patch } : b)));

  return (
    <div className="lw-form" style={{ width: '100%', maxWidth: '100%' }}>
      <style>{FORM_CSS}</style>

      {(issues.errors.length > 0 || issues.warnings.length > 0) && (
        <div style={{ ...card, padding: 10, borderColor: issues.errors.length ? '#fecaca' : '#fde68a', background: issues.errors.length ? '#fff5f5' : '#fffbeb' }}>
          {issues.errors.map((m, k) => <div key={`e${k}`} style={{ fontSize: 12.5, color: '#b91c1c', fontFamily: font, fontWeight: 600 }}>✕ {m}</div>)}
          {issues.warnings.map((m, k) => <div key={`w${k}`} style={{ fontSize: 12.5, color: '#92400e', fontFamily: font }}>⚠ {m}</div>)}
        </div>
      )}

      {/* ───────── Supplier information ───────── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>Supplier information</div>
        <div className="lw-grid">
          <div><label style={labelStyle}>Supplier ID</label><input value={data.supplierCode || 'Assigned on save'} readOnly style={{ ...inputStyle, background: '#f8fafc', fontWeight: 700 }} /></div>
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
          <div className="s2"><label style={labelStyle}>Factory address</label><input value={data.address} onChange={e => set('address', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Trade license no.</label><input value={data.tradeLicenseNo} onChange={e => set('tradeLicenseNo', e.target.value)} style={inputStyle} /></div>
        </div>
      </div>

      {/* ───────── Assessment details ───────── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>Assessment details</div>
        <div className="lw-grid">
          <div>
            <label style={labelStyle}>Assessment date</label>
            <div style={{ display: 'flex' }}><DateFieldDMY value={data.prequal.assessmentDate} onChange={v => setPq({ assessmentDate: v })} ariaLabel="Assessment date" clearable boxStyle={dateBox} /></div>
          </div>
          <div>
            <label style={labelStyle}>Method</label>
            <select value={data.prequal.method} onChange={e => setPq({ method: e.target.value as AssessmentMethod })} style={inputStyle}>
              {METHOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="s2"><label style={labelStyle}>Assessed by</label><input value={data.prequal.assessedBy} onChange={e => setPq({ assessedBy: e.target.value })} style={inputStyle} /></div>
          <div className="s4"><label style={labelStyle}>Assessment remarks / findings</label><textarea value={data.prequal.findings} onChange={e => setPq({ findings: e.target.value })} style={areaStyle} /></div>
        </div>
      </div>

      {/* ───────── Assessment score ───────── */}
      <div style={card}>
        <div style={{ ...cardTitle, marginBottom: 8 }}>Assessment score — {MAX_TOTAL} points</div>
        {AREAS.map(a => {
          const v = data.prequal.scores[a.key] ?? null;
          const pct = v === null ? 0 : (v / a.max) * 100;
          const low = v !== null && a.keyArea && v < a.max * 0.5;
          return (
            <div key={a.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) 96px minmax(0,1.2fr)', gap: 10, alignItems: 'start', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e3a5f', fontFamily: font }}>{a.label}{a.keyArea && <span style={{ color: '#b45309', fontWeight: 600 }}> · key area</span>}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: font, marginTop: 1 }}>{a.guide}</div>
                <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, marginTop: 5 }}><div style={{ width: `${pct}%`, height: 4, borderRadius: 2, background: low ? '#dc2626' : pct >= 80 ? '#16a34a' : '#f59e0b' }} /></div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {scoreField(v, n => setPq({ scores: { ...data.prequal.scores, [a.key]: n } }), a.max, a.label)}
                  <span style={{ fontSize: 11.5, color: '#64748b', fontFamily: font, whiteSpace: 'nowrap' }}>/ {a.max}</span>
                </div>
                {low && hint('Below 50%', '#b91c1c')}
              </div>
              <input value={data.prequal.remarks[a.key] ?? ''} onChange={e => setPq({ remarks: { ...data.prequal.remarks, [a.key]: e.target.value } })} placeholder="Evidence / remark" aria-label={`${a.label} remark`} style={inputStyle} />
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 8, borderTop: '2px solid #1e3a5f', paddingTop: 8, marginTop: 4, fontFamily: font }}>
          <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>Total assessment score</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>{pq.total}<span style={{ fontSize: 13, color: '#64748b' }}>/{MAX_TOTAL}</span></span>
        </div>
        <div style={{ marginTop: 10, background: rc.bg, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: font, fontWeight: 600 }}>Assessment result (automatic)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: rc.color, fontFamily: font }}>{pq.result === 'Pending' ? 'Not yet determined' : approvalLabel(pq.result)}</span>
            <span style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{status}</span>
            {pq.scored > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: font }}>grade {pq.grade}</span>}
          </div>
          {pq.reasons.map((m, k) => <div key={k} style={{ fontSize: 11.5, color: '#475569', fontFamily: font }}>• {m}</div>)}
        </div>
      </div>

      {/* ───────── Additional: certificates + buyers ───────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={cardTitle}>Additional — list of certificates ({data.certificates.length})</div>
          <button type="button" onClick={() => set('certificates', [...data.certificates, blankCertificate()])} style={{ ...btn('#16a34a'), marginLeft: 'auto' }}>+ Add certificate</button>
        </div>
        <datalist id="sup-cert-list">{CERTIFICATE_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
        {data.certificates.length === 0 && <div style={{ fontSize: 12.5, color: '#64748b', fontFamily: font }}>No certificate added yet (ISO, OEKO-TEX, GOTS, BSCI, WRAP …).</div>}
        {data.certificates.map((c, i) => (
          <div key={i} style={{ borderTop: i ? '1px solid #f1f5f9' : undefined, paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
            <div className="lw-grid">
              <div className="s2"><label style={labelStyle}>Certificate {i + 1}</label><input list="sup-cert-list" value={c.name} onChange={e => setCert(i, { name: e.target.value })} placeholder="e.g., ISO 9001, OEKO-TEX" style={inputStyle} /></div>
              <div><label style={labelStyle}>Certificate no.</label><input value={c.number} onChange={e => setCert(i, { number: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Issued by</label><input value={c.issuedBy} onChange={e => setCert(i, { issuedBy: e.target.value })} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Valid until</label>
                <div style={{ display: 'flex' }}><DateFieldDMY value={c.validUntil} onChange={v => setCert(i, { validUntil: v })} ariaLabel="Certificate valid until" clearable boxStyle={dateBox} /></div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>{removeBtn(() => set('certificates', data.certificates.filter((_, k) => k !== i)), 'Remove certificate')}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={cardTitle}>Additional — list of buyers ({data.buyers.length})</div>
          <button type="button" onClick={() => set('buyers', [...data.buyers, blankBuyer()])} style={{ ...btn('#16a34a'), marginLeft: 'auto' }}>+ Add buyer</button>
        </div>
        {data.buyers.length === 0 && <div style={{ fontSize: 12.5, color: '#64748b', fontFamily: font }}>No buyer added yet — the buyers this supplier already works with are a useful reference check.</div>}
        {data.buyers.map((b, i) => (
          <div key={i} style={{ borderTop: i ? '1px solid #f1f5f9' : undefined, paddingTop: i ? 8 : 0, marginTop: i ? 8 : 0 }}>
            <div className="lw-grid">
              <div className="s2"><label style={labelStyle}>Buyer {i + 1}</label><input value={b.name} onChange={e => setBuyer(i, { name: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Country</label><input value={b.country} onChange={e => setBuyer(i, { country: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Products / items supplied</label><input value={b.products} onChange={e => setBuyer(i, { products: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ textAlign: 'right' }}>{removeBtn(() => set('buyers', data.buyers.filter((_, k) => k !== i)), 'Remove buyer')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}