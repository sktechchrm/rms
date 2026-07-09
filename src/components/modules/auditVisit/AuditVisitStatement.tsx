// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitStatement.tsx — list of saved audit/visit records with filtering
// (date range, type, search) — statement-style, matching Reports' pattern,
// not a single-document print preview.
// Path: src/components/modules/auditVisit/AuditVisitStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateNextAuditDate, daysUntil } from './types';

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
  onSelect?: (rec: DbRecord) => void;
}

export default function AuditVisitStatement({ records, onSelect }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search,   setSearch]   = useState('');

  const filtered = useMemo(() => {
    return records.filter(r => {
      const date = String(r.date ?? '');
      if (dateFrom && date < dateFrom) return false;
      if (dateTo   && date > dateTo)   return false;
      if (typeFilter && String(r.type ?? '') !== typeFilter) return false;
      if (search) {
        const hay = [r.auditFirm, r.auditorName, r.certificationFor].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, dateFrom, dateTo, typeFilter, search]);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="Audit">Audit</option>
            <option value="Visit">Visit</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Firm / Auditor / Certification)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(dateFrom || dateTo || typeFilter || search) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter(''); setSearch(''); }}
            style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font }}>
        {filtered.length} of {records.length} records
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={thS}>Date</th>
              <th style={thS}>Type</th>
              <th style={thS}>Duration</th>
              <th style={thS}>Certification For</th>
              <th style={thS}>Audit Firm</th>
              <th style={thS}>Auditor</th>
              <th style={thS}>Mode</th>
              <th style={thS}>Results/Score</th>
              <th style={thS}>Next Audit Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No records match the current filters</td></tr>
            )}
            {filtered.map(r => {
              const nextDate = calculateNextAuditDate(String(r.date ?? ''), String(r.validityMonths ?? ''), String(r.validityYears ?? ''));
              const remaining = daysUntil(nextDate);
              const dueSoon = remaining !== null && remaining <= 60 && remaining >= 0;
              const overdue = remaining !== null && remaining < 0;
              return (
                <tr
                  key={String(r.id)}
                  onClick={() => onSelect?.(r)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (onSelect) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={tdS}>{String(r.date ?? '—')}</td>
                  <td style={tdS}>{String(r.type ?? '—')}</td>
                  <td style={tdS}>{String(r.duration ?? '—')}</td>
                  <td style={tdS}>{String(r.certificationFor ?? '—')}</td>
                  <td style={tdS}>{String(r.auditFirm ?? '—')}</td>
                  <td style={tdS}>{String(r.auditorName ?? '—')}</td>
                  <td style={tdS}>{String(r.auditMode ?? '—')}</td>
                  <td style={tdS}>{String(r.resultsScore ?? '—')}</td>
                  <td style={tdS}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: overdue ? '#fee2e2' : dueSoon ? '#fef3c7' : '#f0fdf4',
                      color:      overdue ? '#b91c1c' : dueSoon ? '#92400e' : '#15803d',
                    }}>
                      {overdue ? '⚠ ' : dueSoon ? '⏰ ' : ''}{nextDate || '—'}
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
