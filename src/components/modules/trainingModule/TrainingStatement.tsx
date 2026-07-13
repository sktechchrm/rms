// ─────────────────────────────────────────────────────────────────────────────
// TrainingStatement.tsx — tracking dashboard, all saved training
// sessions, filterable, same pattern as Onboarding/Candidate Pipeline's
// tracking views.
// Path: src/components/modules/trainingModule/TrainingStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { TRAINING_STATUS_OPTIONS } from './types';

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

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Planned:       { bg: '#f1f5f9', color: '#64748b' },
  'Notice Sent': { bg: '#fef3c7', color: '#92400e' },
  Conducted:     { bg: '#f0fdf4', color: '#15803d' },
  Cancelled:     { bg: '#fee2e2', color: '#b91c1c' },
};

function participantCountFromRecord(rec: DbRecord): { total: number; attended: number } {
  try {
    const items = JSON.parse(String(rec.participantsJson ?? '[]'));
    if (!Array.isArray(items)) return { total: 0, attended: 0 };
    return { total: items.length, attended: items.filter((p: { attended?: boolean }) => p.attended).length };
  } catch { return { total: 0, attended: 0 }; }
}

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintFiltered: (filtered: DbRecord[]) => void;
}

export default function TrainingStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (statusFilter && String(r.status ?? '') !== statusFilter) return false;
      if (monthFilter && String(r.trainingMonth ?? '') !== monthFilter) return false;
      if (search) {
        const hay = [r.trainingTopic, r.customTopic, r.trainerName, r.venue].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, statusFilter, monthFilter, search]);

  const conductedCount = filtered.filter(r => r.status === 'Conducted').length;
  const plannedCount = filtered.filter(r => r.status === 'Planned' || r.status === 'Notice Sent').length;
  const totalParticipants = filtered.reduce((sum, r) => sum + participantCountFromRecord(r).attended, 0);

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট সেশন</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>পরিচালিত</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{conductedCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>পরিকল্পিত/নোটিশপ্রাপ্ত</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{plannedCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট উপস্থিতি</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{totalParticipants}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>স্ট্যাটাস</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {TRAINING_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (বিষয় / প্রশিক্ষক / স্থান)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(statusFilter || monthFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setMonthFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} session(s)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>বিষয়</th>
              <th style={thS}>মাস/বছর</th>
              <th style={thS}>প্রশিক্ষক</th>
              <th style={thS}>স্থান</th>
              <th style={thS}>অংশগ্রহণকারী</th>
              <th style={thS}>স্ট্যাটাস</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো সেশন পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const id = String(r.id ?? '');
              const status = String(r.status ?? '');
              const style = STATUS_STYLE[status];
              const pc = participantCountFromRecord(r);
              const topic = r.trainingTopic === 'অন্যান্য (Other)' ? String(r.customTopic ?? '') : String(r.trainingTopic ?? '—');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{topic}</td>
                  <td style={tdS}>{r.trainingMonth}/{r.trainingYear}</td>
                  <td style={tdS}>{String(r.trainerName ?? '—')}</td>
                  <td style={tdS}>{String(r.venue ?? '—')}</td>
                  <td style={tdS}>{pc.attended}/{pc.total}</td>
                  <td style={tdS}>
                    {style ? (
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{status}</span>
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
