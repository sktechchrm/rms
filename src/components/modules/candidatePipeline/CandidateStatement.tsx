// ─────────────────────────────────────────────────────────────────────────────
// CandidateStatement.tsx — tracking dashboard, all saved candidates,
// filterable by stage/position/source, same pattern as Legal Document/
// Audit-Visit/Supplier Assessment's tracking views.
// Path: src/components/modules/candidatePipeline/CandidateStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { STAGE_OPTIONS, STAGE_STYLE, CLOSED_STAGES } from './types';
import type { CandidateStage } from './types';

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

export default function CandidateStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [stageFilter, setStageFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const positions = useMemo(() => {
    const set = new Set(records.map(r => String(r.positionAppliedFor ?? '')).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (stageFilter && String(r.stage ?? '') !== stageFilter) return false;
      if (positionFilter && String(r.positionAppliedFor ?? '') !== positionFilter) return false;
      if (search) {
        const hay = [r.candidateName, r.positionAppliedFor, r.phone, r.email].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, stageFilter, positionFilter, search]);

  const activeCount = filtered.filter(r => !CLOSED_STAGES.includes(String(r.stage ?? '') as CandidateStage)).length;
  const joinedCount = filtered.filter(r => r.stage === 'Joined').length;
  const rejectedCount = filtered.filter(r => r.stage === 'Rejected' || r.stage === 'Withdrawn').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট প্রার্থী</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>সক্রিয় (Pipeline-এ)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{activeCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>যোগদান করেছে</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{joinedCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>প্রত্যাখ্যাত/প্রত্যাহৃত</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{rejectedCount}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Stage</label>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>পদ</label>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (নাম / ফোন / ইমেইল)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(stageFilter || positionFilter || search) && (
          <button onClick={() => { setStageFilter(''); setPositionFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} candidate(s)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>প্রার্থীর নাম</th>
              <th style={thS}>পদ</th>
              <th style={thS}>বিভাগ</th>
              <th style={thS}>ফোন</th>
              <th style={thS}>Source</th>
              <th style={thS}>আবেদনের তারিখ</th>
              <th style={thS}>Stage</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো প্রার্থী পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const stage = (STAGE_OPTIONS.includes(r.stage as CandidateStage) ? r.stage : 'Applied') as CandidateStage;
              const s = STAGE_STYLE[stage];
              const id = String(r.id ?? '');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(r.candidateName ?? '—')}</td>
                  <td style={tdS}>{String(r.positionAppliedFor ?? '—')}</td>
                  <td style={tdS}>{String(r.department ?? '—')}</td>
                  <td style={tdS}>{String(r.phone ?? '—')}</td>
                  <td style={tdS}>{String(r.source ?? '—')}</td>
                  <td style={tdS}>{String(r.applicationDate ?? '—')}</td>
                  <td style={tdS}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{stage}</span>
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
