// ─────────────────────────────────────────────────────────────────────────────
// EmergencyLogStatement.tsx — tracking dashboard, all saved logs,
// filterable by type/severity/status, same pattern as this app's other
// tracking dashboards.
// Path: src/components/modules/emergencyLog/EmergencyLogStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { LOG_TYPE_OPTIONS } from './types';

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
const metricCard: React.CSSProperties = {
  background: '#f8fafc', borderRadius: 8, padding: '14px 16px', flex: 1, minWidth: 140,
};

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  Minor: { bg: '#f1f5f9', color: '#64748b' },
  Moderate: { bg: '#fef3c7', color: '#92400e' },
  Severe: { bg: '#fee2e2', color: '#b91c1c' },
  Fatal: { bg: '#7f1d1d', color: '#fff' },
};

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintFiltered: (filtered: DbRecord[]) => void;
}

export default function EmergencyLogStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (typeFilter && String(r.logType ?? '') !== typeFilter) return false;
      if (search) {
        const hay = [r.employeeName, r.department, r.incidentDescription, r.natureOfGrievance].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, typeFilter, search]);

  const injuryCount = filtered.filter(r => r.logType === 'Injury and Accident Log').length;
  const grievanceCount = filtered.filter(r => r.logType === 'Grievance Log').length;
  const severeCount = filtered.filter(r => r.severity === 'Severe' || r.severity === 'Fatal').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট এন্ট্রি</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Injury/Accident</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{injuryCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Grievance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{grievanceCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>তীব্র/মারাত্মক</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: severeCount > 0 ? '#b91c1c' : '#15803d' }}>{severeCount}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Log Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {LOG_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(typeFilter || search) && (
          <button onClick={() => { setTypeFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} entry(ies)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Type</th>
              <th style={thS}>কর্মীর নাম</th>
              <th style={thS}>বিভাগ</th>
              <th style={thS}>তারিখ</th>
              <th style={thS}>বিবরণ</th>
              <th style={thS}>তীব্রতা/ক্যাটাগরি</th>
              <th style={thS}>অবস্থা</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো এন্ট্রি পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const id = String(r.id ?? '');
              const isInjury = r.logType === 'Injury and Accident Log';
              const sevStyle = isInjury ? SEVERITY_COLORS[String(r.severity ?? '')] : null;
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: isInjury ? '#fee2e2' : '#dbeafe', color: isInjury ? '#b91c1c' : '#1d4ed8' }}>
                      {isInjury ? 'Injury/Accident' : 'Grievance'}
                    </span>
                  </td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(r.employeeName ?? '—')}</td>
                  <td style={tdS}>{String(r.department ?? '—')}</td>
                  <td style={tdS}>{String(r.date ?? '—')}</td>
                  <td style={{ ...tdS, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String((isInjury ? r.incidentDescription : r.natureOfGrievance) ?? '—')}
                  </td>
                  <td style={tdS}>
                    {isInjury ? (
                      r.severity ? <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: sevStyle?.bg, color: sevStyle?.color }}>{String(r.severity)}</span> : '—'
                    ) : (String(r.grievanceCategory ?? '—'))}
                  </td>
                  <td style={tdS}>{String((isInjury ? r.investigationStatus : r.resolutionStatus) ?? '—')}</td>
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
