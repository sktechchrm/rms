// ─────────────────────────────────────────────────────────────────────────────
// SupplierStatement.tsx — tracking dashboard. Each saved supplier record
// can contain multiple assessments (one per standard) — this flattens
// ALL suppliers' assessments into one filterable list, so "which
// suppliers are due for re-assessment" or "which are Sedex-approved" can
// be answered across the whole supplier base, not one supplier at a time.
// Path: src/components/modules/supplierAssessment/SupplierStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { STANDARD_OPTIONS, APPROVAL_STATUS_OPTIONS } from './types';
import type { SupplierAssessmentEntry } from './types';

const font = "'Noto Sans Bengali', Arial, sans-serif";

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 7,
  fontSize: 12.5, fontFamily: font, background: '#fff', color: '#1e293b', outline: 'none',
};
const thS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 11, fontWeight: 700, fontFamily: font,
  color: '#374151', background: '#f8fafc', textTransform: 'uppercase',
  borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap',
};
const tdS: React.CSSProperties = {
  padding: '8px 10px', fontSize: 12.5, fontFamily: font, color: '#1e293b',
  borderBottom: '1px solid #e2e8f0',
};

const APPROVAL_COLORS: Record<string, { bg: string; color: string }> = {
  Pending:     { bg: '#f1f5f9', color: '#64748b' },
  Approved:    { bg: '#f0fdf4', color: '#15803d' },
  Conditional: { bg: '#fef3c7', color: '#92400e' },
  Rejected:    { bg: '#fee2e2', color: '#b91c1c' },
};

export interface FlatRow {
  supplierId: string;
  supplierName: string;
  businessType: string;
  assessment: SupplierAssessmentEntry;
}

interface Props {
  records: DbRecord[];
  onEditSupplier: (rec: DbRecord) => void;
  onPrintFiltered: (rows: FlatRow[]) => void;
}

export default function SupplierStatement({ records, onEditSupplier, onPrintFiltered }: Props) {
  const [standardFilter, setStandardFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const flatRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = [];
    for (const rec of records) {
      let assessments: SupplierAssessmentEntry[] = [];
      try {
        const parsed = JSON.parse(String(rec.assessmentsJson ?? '[]'));
        if (Array.isArray(parsed)) assessments = parsed;
      } catch { /* skip malformed record */ }
      for (const a of assessments) {
        rows.push({
          supplierId: String(rec.id ?? ''),
          supplierName: String(rec.supplierName ?? '—'),
          businessType: String(rec.businessType ?? '—'),
          assessment: a,
        });
      }
    }
    return rows;
  }, [records]);

  const filtered = useMemo(() => {
    return flatRows.filter(row => {
      if (standardFilter && row.assessment.standard !== standardFilter) return false;
      if (approvalFilter && row.assessment.approvalStatus !== approvalFilter) return false;
      if (certStatusFilter && getExpiryStatus(row.assessment.certificateValidUntil) !== certStatusFilter) return false;
      if (search) {
        const hay = [row.supplierName, row.assessment.auditorBody, row.assessment.score].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [flatRows, standardFilter, approvalFilter, certStatusFilter, search]);

  const expiredCount = filtered.filter(r => getExpiryStatus(r.assessment.certificateValidUntil) === 'expired').length;
  const dueSoonCount  = filtered.filter(r => getExpiryStatus(r.assessment.certificateValidUntil) === 'due-soon').length;
  const rejectedCount = filtered.filter(r => r.assessment.approvalStatus === 'Rejected').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      {(expiredCount > 0 || dueSoonCount > 0 || rejectedCount > 0) && (
        <div style={{ padding: '10px 16px', background: expiredCount > 0 || rejectedCount > 0 ? '#fee2e2' : '#fef3c7', color: expiredCount > 0 || rejectedCount > 0 ? '#b91c1c' : '#92400e', fontSize: 12.5, fontWeight: 600, fontFamily: font, borderBottom: '1px solid #e2e8f0' }}>
          {expiredCount > 0 && `⚠ ${expiredCount} certificate(s) expired. `}
          {dueSoonCount > 0 && `⏰ ${dueSoonCount} due for renewal within 2 months. `}
          {rejectedCount > 0 && `✕ ${rejectedCount} assessment(s) rejected.`}
        </div>
      )}

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Standard</label>
          <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {STANDARD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Approval</label>
          <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {APPROVAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Cert. Status</label>
          <select value={certStatusFilter} onChange={e => setCertStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="due-soon">Due Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Supplier / Auditor / Score)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(standardFilter || approvalFilter || certStatusFilter || search) && (
          <button onClick={() => { setStandardFilter(''); setApprovalFilter(''); setCertStatusFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {flatRows.length} assessment(s) across {records.length} supplier(s)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={thS}>Supplier</th>
              <th style={thS}>Business Type</th>
              <th style={thS}>Standard</th>
              <th style={thS}>Audit Type</th>
              <th style={thS}>Audit Date</th>
              <th style={thS}>Score</th>
              <th style={thS}>Cert. Valid Until</th>
              <th style={thS}>Cert. Status</th>
              <th style={thS}>Approval</th>
              <th style={thS}>Next Review</th>
              <th style={{ ...thS, width: 60 }}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={11} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No assessments match the current filters</td></tr>
            )}
            {filtered.map((row, index) => {
              const certStatus = getExpiryStatus(row.assessment.certificateValidUntil);
              const cs = EXPIRY_STATUS_STYLE[certStatus];
              const ac = APPROVAL_COLORS[row.assessment.approvalStatus];
              return (
                <tr key={`${row.supplierId}-${row.assessment.slNo}-${index}`}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{row.supplierName}</td>
                  <td style={tdS}>{row.businessType}</td>
                  <td style={tdS}>{row.assessment.standard}</td>
                  <td style={tdS}>{row.assessment.auditType || '—'}</td>
                  <td style={tdS}>{row.assessment.auditDate || '—'}</td>
                  <td style={tdS}>{row.assessment.score || '—'}</td>
                  <td style={tdS}>{row.assessment.certificateValidUntil || '—'}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: cs.bg, color: cs.color }}>{cs.label}</span>
                  </td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: ac.bg, color: ac.color }}>{row.assessment.approvalStatus}</span>
                  </td>
                  <td style={tdS}>{row.assessment.nextReviewDate || '—'}</td>
                  <td style={tdS}>
                    {(() => {
                      const rec = records.find(r => String(r.id ?? '') === row.supplierId);
                      return rec ? (
                        <button onClick={() => onEditSupplier(rec)} title="Edit supplier" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>
                      ) : null;
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
