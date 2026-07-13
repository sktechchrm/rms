// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentStatement.tsx — tracking dashboard, all saved risk
// entries, filterable, same pattern as Legal Document/Audit-Visit's
// tracking views.
// Path: src/components/modules/riskAssessment/RiskAssessmentStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { RISK_LEVEL_OPTIONS, RISK_LEVEL_STYLE } from './types';
import type { RiskLevel } from './types';

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

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintFiltered: (filtered: DbRecord[]) => void;
}

export default function RiskAssessmentStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [sectionFilter, setSectionFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const set = new Set(records.map(r => String(r.section ?? '')).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (sectionFilter && String(r.section ?? '') !== sectionFilter) return false;
      if (riskFilter && String(r.riskLevel ?? '') !== riskFilter) return false;
      if (search) {
        const hay = [r.section, r.source, r.riskIdentification].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, sectionFilter, riskFilter, search]);

  const highCount = filtered.filter(r => r.riskLevel === 'উচ্চ').length;
  const mediumCount = filtered.filter(r => r.riskLevel === 'মধ্যম').length;
  const lowCount = filtered.filter(r => r.riskLevel === 'নিম্ন').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট ঝুঁকি এন্ট্রি</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>উচ্চ</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: highCount > 0 ? '#b91c1c' : '#15803d' }}>{highCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মধ্যম</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e' }}>{mediumCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>নিম্ন</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{lowCount}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>সেকশন</label>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>ঝুঁকির মাত্রা</label>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {RISK_LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(sectionFilter || riskFilter || search) && (
          <button onClick={() => { setSectionFilter(''); setRiskFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>সেকশন</th>
              <th style={thS}>উৎস</th>
              <th style={thS}>ঝুঁকি সনাক্তকরণ</th>
              <th style={thS}>ঝুঁকির মাত্রা</th>
              <th style={thS}>দায়িত্বপ্রাপ্ত ব্যক্তি</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো এন্ট্রি পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const id = String(r.id ?? '');
              const level = (RISK_LEVEL_OPTIONS.includes(r.riskLevel as RiskLevel) ? r.riskLevel : '') as RiskLevel;
              const style = level ? RISK_LEVEL_STYLE[level] : null;
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(r.section ?? '—')}</td>
                  <td style={tdS}>{String(r.source ?? '—')}</td>
                  <td style={{ ...tdS, maxWidth: 260, whiteSpace: 'normal' }}>{String(r.riskIdentification ?? '—')}</td>
                  <td style={tdS}>
                    {style ? (
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: style.bg, color: style.color }}>{level}</span>
                    ) : '—'}
                  </td>
                  <td style={tdS}>{String(r.responsiblePersonName ?? '—')}</td>
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
