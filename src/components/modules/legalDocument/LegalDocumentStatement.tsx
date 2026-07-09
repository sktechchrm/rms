// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentStatement.tsx — list of saved document records with filtering.
// Path: src/components/modules/legalDocument/LegalDocumentStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, daysUntilExpiry } from './types';

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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  expired:    { bg: '#fee2e2', color: '#b91c1c', label: '⚠ Expired' },
  'due-soon': { bg: '#fef3c7', color: '#92400e', label: '⏰ Due Soon' },
  valid:      { bg: '#f0fdf4', color: '#15803d', label: '✓ Valid' },
  unknown:    { bg: '#f1f5f9', color: '#64748b', label: '—' },
};

interface Props {
  records: DbRecord[];
  onSelect?: (rec: DbRecord) => void;
}

export default function LegalDocumentStatement({ records, onSelect }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search,   setSearch]   = useState('');

  const filtered = useMemo(() => {
    return records.filter(r => {
      const expire = String(r.dateExpire ?? '');
      if (dateFrom && expire < dateFrom) return false;
      if (dateTo   && expire > dateTo)   return false;
      if (statusFilter && getExpiryStatus(expire) !== statusFilter) return false;
      if (search) {
        const hay = [r.documentDetails, r.authorityBody, r.mentionedCapacity].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, dateFrom, dateTo, statusFilter, search]);

  const expiredCount = filtered.filter(r => getExpiryStatus(String(r.dateExpire ?? '')) === 'expired').length;
  const dueSoonCount  = filtered.filter(r => getExpiryStatus(String(r.dateExpire ?? '')) === 'due-soon').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      {(expiredCount > 0 || dueSoonCount > 0) && (
        <div style={{
          padding: '10px 16px', background: expiredCount > 0 ? '#fee2e2' : '#fef3c7',
          color: expiredCount > 0 ? '#b91c1c' : '#92400e', fontSize: 12.5, fontWeight: 600, fontFamily: font,
          borderBottom: '1px solid #e2e8f0',
        }}>
          {expiredCount > 0 && `⚠ ${expiredCount}টি দলিলের মেয়াদ ইতিমধ্যে শেষ হয়ে গেছে। `}
          {dueSoonCount > 0 && `⏰ ${dueSoonCount}টি দলিলের মেয়াদ আগামী ২ মাসের মধ্যে শেষ হবে।`}
        </div>
      )}

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Expire From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Expire To</label>
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
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Document / Authority / Capacity)</label>
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

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font }}>
        {filtered.length} of {records.length} documents
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <th style={thS}>Details of Documents</th>
              <th style={thS}>Mentioned Capacity/Category</th>
              <th style={thS}>Date Received</th>
              <th style={thS}>Date of Expire</th>
              <th style={thS}>Authority Body</th>
              <th style={thS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No documents match the current filters</td></tr>
            )}
            {filtered.map(r => {
              const status = getExpiryStatus(String(r.dateExpire ?? ''));
              const days   = daysUntilExpiry(String(r.dateExpire ?? ''));
              const s      = STATUS_STYLE[status];
              return (
                <tr
                  key={String(r.id)}
                  onClick={() => onSelect?.(r)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (onSelect) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={tdS}>{String(r.documentDetails ?? '—')}</td>
                  <td style={tdS}>{String(r.mentionedCapacity ?? '—')}</td>
                  <td style={tdS}>{String(r.dateReceived ?? '—')}</td>
                  <td style={tdS}>{String(r.dateExpire ?? '—')}</td>
                  <td style={tdS}>{String(r.authorityBody ?? '—')}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                      {s.label}{status !== 'unknown' && days !== null ? ` (${days}d)` : ''}
                    </span>
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
