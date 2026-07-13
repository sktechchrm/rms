// ─────────────────────────────────────────────────────────────────────────────
// ComplianceAuditStatement.tsx — tracking dashboard, all saved audits,
// filterable by audit type/round, same pattern as Supplier Assessment/
// Legal Document's tracking views.
// Path: src/components/modules/complianceAudit/ComplianceAuditStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { AUDIT_CATEGORY_OPTIONS, AUDIT_ROUND_OPTIONS } from './types';

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

function ncCountFromRecord(rec: DbRecord): number {
  try {
    const items = JSON.parse(String(rec.correctiveActionsJson ?? '[]'));
    return Array.isArray(items) ? items.length : 0;
  } catch { return 0; }
}

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintFiltered: (filtered: DbRecord[]) => void;
}

export default function ComplianceAuditStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [typeFilter, setTypeFilter] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (typeFilter && String(r.auditType ?? '') !== typeFilter) return false;
      if (roundFilter && String(r.auditRound ?? '') !== roundFilter) return false;
      if (search) {
        const hay = [r.siteName, r.companyName, r.siteContactName].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, typeFilter, roundFilter, search]);

  const internalCount = filtered.filter(r => r.auditType === 'Internal').length;
  const externalCount = filtered.filter(r => r.auditType === 'External for Supplier').length;
  const totalNC = filtered.reduce((sum, r) => sum + ncCountFromRecord(r), 0);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট অডিট</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Internal</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{internalCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>External (Supplier)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{externalCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট Non-Compliance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: totalNC > 0 ? '#b91c1c' : '#15803d' }}>{totalNC}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>অডিট ধরন</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {AUDIT_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Audit Round</label>
          <select value={roundFilter} onChange={e => setRoundFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {AUDIT_ROUND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Site/Company/Contact)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(typeFilter || roundFilter || search) && (
          <button onClick={() => { setTypeFilter(''); setRoundFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} audit(s)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Site Name</th>
              <th style={thS}>Company</th>
              <th style={thS}>অডিট ধরন</th>
              <th style={thS}>Audit Round</th>
              <th style={thS}>Audit Date</th>
              <th style={thS}>Non-Compliances</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো অডিট পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const id = String(r.id ?? '');
              const isInternal = r.auditType === 'Internal';
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(r.siteName ?? '—')}</td>
                  <td style={tdS}>{String(r.companyName ?? '—')}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: isInternal ? '#dbeafe' : '#f3e8ff', color: isInternal ? '#1d4ed8' : '#7c3aed' }}>
                      {String(r.auditType ?? '—')}
                    </span>
                  </td>
                  <td style={tdS}>{String(r.auditRound ?? '—')}</td>
                  <td style={tdS}>{String(r.auditDate ?? '—')}</td>
                  <td style={tdS}>{ncCountFromRecord(r)}</td>
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
