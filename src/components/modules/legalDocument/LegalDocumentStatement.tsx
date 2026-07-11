// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentStatement.tsx — list of saved document records, exact column
// spec: SL, Document Title, Category, Document No., Issuing
// Authority, Issue Date, Expiry Date, Status, Attachment, Actions.
// Path: src/components/modules/legalDocument/LegalDocumentStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';

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

export default function LegalDocumentStatement({ records, onEdit, onDelete, onPrintList }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search,   setSearch]   = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const expire = String(r.expiryDate ?? '');
      if (dateFrom && expire < dateFrom) return false;
      if (dateTo   && expire > dateTo)   return false;
      if (statusFilter && getExpiryStatus(expire) !== statusFilter) return false;
      if (categoryFilter && String(r.category ?? '') !== categoryFilter) return false;
      if (search) {
        const hay = [r.documentTitle, r.issuingAuthority, r.documentNo].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, dateFrom, dateTo, statusFilter, categoryFilter, search]);

  const expiredCount = filtered.filter(r => getExpiryStatus(String(r.expiryDate ?? '')) === 'expired').length;
  const dueSoonCount  = filtered.filter(r => getExpiryStatus(String(r.expiryDate ?? '')) === 'due-soon').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      {(expiredCount > 0 || dueSoonCount > 0) && (
        <div style={{
          padding: '10px 16px', background: expiredCount > 0 ? '#fee2e2' : '#fef3c7',
          color: expiredCount > 0 ? '#b91c1c' : '#92400e', fontSize: 12.5, fontWeight: 600, fontFamily: font,
          borderBottom: '1px solid #e2e8f0',
        }}>
          {expiredCount > 0 && `⚠ ${expiredCount} document(s) already expired. `}
          {dueSoonCount > 0 && `⏰ ${dueSoonCount} document(s) expiring within the next 2 months.`}
        </div>
      )}

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Expiry From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Expiry To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="due-soon">Due Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Category</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="License">License</option>
            <option value="Certificate">Certificate</option>
            <option value="Agreement">Agreement</option>
            <option value="Permit">Permit</option>
            <option value="Registration">Registration</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Title / Authority / Document No.)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(dateFrom || dateTo || statusFilter || categoryFilter || search) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setCategoryFilter(''); setSearch(''); }}
            style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} documents</span>
        <button
          onClick={() => onPrintList(filtered)}
          style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}
        >
          🖨 Print List
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Document Title</th>
              <th style={thS}>Category</th>
              <th style={thS}>Document No.</th>
              <th style={thS}>Issuing Authority</th>
              <th style={thS}>Issue Date</th>
              <th style={thS}>Expiry Date</th>
              <th style={thS}>Status</th>
              <th style={thS}>Attachment</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No documents match the current filters</td></tr>
            )}
            {filtered.map((r, index) => {
              const status = getExpiryStatus(String(r.expiryDate ?? ''));
              const s      = EXPIRY_STATUS_STYLE[status];
              const id     = String(r.id ?? '');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={tdS}>{String(r.documentTitle ?? '—')}</td>
                  <td style={tdS}>{String(r.category ?? '—')}</td>
                  <td style={tdS}>{String(r.documentNo ?? '—')}</td>
                  <td style={tdS}>{String(r.issuingAuthority ?? '—')}</td>
                  <td style={tdS}>{String(r.issueDate ?? '—')}</td>
                  <td style={tdS}>{String(r.expiryDate ?? '—')}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={tdS}>
                    {r.attachment ? (
                      <a href={String(r.attachment)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Link</a>
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
                        <button onClick={() => onEdit(r)} title="Edit" style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>✎</button>
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
