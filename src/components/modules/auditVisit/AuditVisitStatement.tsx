// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitStatement.tsx — list of saved audit/visit records, exact column
// spec: SL, Audit/Certification, Standard/Buyer, Auditor/
// Organization, Visit Date, Validity Period, Valid Until (Auto), Status,
// Report/Certificate, Actions.
// Path: src/components/modules/auditVisit/AuditVisitStatement.tsx
//
// UPDATE (renewal outcome status): status is no longer computed per-record
// in isolation via plain getExpiryStatus(). It now comes from
// buildAuditRenewalChains() in types.ts, which groups records by
// auditCertification (normalized first word — see types.ts) and resolves
// each one's status against whichever record (if any) renewed it next —
// 'early' (renewed on/before deadline), 'delayed' (renewed after), or
// 'expired' (not renewed yet). Single source of truth shared with
// AuditVisitStatementPrintView.tsx, so screen and print can never
// disagree on a record's status.
//
// UPDATE (quantified delay/early amount): each entry from
// buildAuditRenewalChains() now also carries `delayLabel` ("13 days
// late", "2 months early") — rendered as a small line under the status
// badge so the SIZE of the gap is visible, not just its direction.
//
// UPDATE (DD-MM-YYYY display): Visit Date and Valid Until (Auto) columns
// now render through formatDMY() from types.ts — display only. Filtering
// (dateFrom/dateTo/search) and sorting all continue to compare against
// the raw ISO `rec.visitDate` / `validUntil` values, which are untouched.
// The Valid Until From/To filter inputs are native <input type="date">,
// whose displayed format is controlled by the browser/OS locale.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { buildAuditRenewalChains, formatDMY } from './types';
import { EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';

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

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintList: (filteredRecords: DbRecord[]) => void;
}

export default function AuditVisitStatement({ records, onEdit, onDelete, onPrintList }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,   setSearch]   = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const withValidUntil = useMemo(() => buildAuditRenewalChains(records), [records]);

  const filtered = useMemo(() => {
    return withValidUntil.filter(({ rec, validUntil, status }) => {
      if (dateFrom && validUntil < dateFrom) return false;
      if (dateTo   && validUntil > dateTo)   return false;
      if (statusFilter && status !== statusFilter) return false;
      if (search) {
        const hay = [rec.auditCertification, rec.standardBuyer, rec.auditorOrganization].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [withValidUntil, dateFrom, dateTo, statusFilter, search]);

  const expiredCount = filtered.filter(({ status }) => status === 'expired').length;
  const delayedCount = filtered.filter(({ status }) => status === 'delayed').length;
  const dueSoonCount = filtered.filter(({ status }) => status === 'due-soon').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      {(expiredCount > 0 || delayedCount > 0 || dueSoonCount > 0) && (
        <div style={{
          padding: '10px 16px',
          background: expiredCount > 0 ? '#fee2e2' : delayedCount > 0 ? '#ffedd5' : '#fef3c7',
          color: expiredCount > 0 ? '#b91c1c' : delayedCount > 0 ? '#c2410c' : '#92400e',
          fontSize: 12.5, fontWeight: 600, fontFamily: font,
          borderBottom: '1px solid #e2e8f0',
        }}>
          {expiredCount > 0 && `⚠ ${expiredCount} record(s) unresolved expired. `}
          {delayedCount > 0 && `🕒 ${delayedCount} record(s) renewed late (delayed). `}
          {dueSoonCount > 0 && `⏰ ${dueSoonCount} record(s) expiring within the next 2 months.`}
        </div>
      )}

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Valid Until From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Valid Until To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="due-soon">Due Soon</option>
            <option value="early">Early</option>
            <option value="delayed">Delayed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Audit / Standard / Auditor)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(dateFrom || dateTo || statusFilter || search) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setSearch(''); }}
            style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} records</span>
        <button
          onClick={() => onPrintList(filtered.map(({ rec }) => rec))}
          style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}
        >
          🖨 Print List
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Audit / Certification</th>
              <th style={thS}>Standard / Buyer</th>
              <th style={thS}>Auditor / Organization</th>
              <th style={thS}>Visit Date</th>
              <th style={thS}>Validity Period</th>
              <th style={thS}>Valid Until (Auto)</th>
              <th style={thS}>Status</th>
              <th style={thS}>Report / Certificate</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No records match the current filters</td></tr>
            )}
            {filtered.map(({ rec, validUntil, status, delayLabel }, index) => {
              const s  = EXPIRY_STATUS_STYLE[status];
              const id = String(rec.id ?? '');
              const periodText = `${rec.validityPeriodValue ?? '0'} ${rec.validityPeriodUnit === 'year' ? 'Yr' : 'Mo'}`;
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={tdS}>{String(rec.auditCertification ?? '—')}</td>
                  <td style={tdS}>{String(rec.standardBuyer ?? '—')}</td>
                  <td style={tdS}>{String(rec.auditorOrganization ?? '—')}</td>
                  <td style={tdS}>{formatDMY(String(rec.visitDate ?? '')) || '—'}</td>
                  <td style={tdS}>{periodText}</td>
                  <td style={tdS}>{formatDMY(validUntil) || '—'}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                    {delayLabel && (
                      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: s.color }}>
                        {delayLabel}
                      </div>
                    )}
                  </td>
                  <td style={tdS}>
                    {rec.reportCertificate ? (
                      <a href={String(rec.reportCertificate)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Link</a>
                    ) : '—'}
                  </td>
                  <td style={tdS}>
                    {confirmDeleteId === id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11 }}>Sure?</span>
                        <button onClick={() => { onDelete(id); setConfirmDeleteId(null); }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 4, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => onEdit(rec)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>
                        <button onClick={() => setConfirmDeleteId(id)} title="Delete" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                      </div>
                    )}
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