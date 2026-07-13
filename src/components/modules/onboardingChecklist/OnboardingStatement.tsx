// ─────────────────────────────────────────────────────────────────────────────
// OnboardingStatement.tsx — tracking dashboard, all saved onboarding
// records, filterable, with progress %, same pattern as Candidate
// Pipeline/Legal Document's tracking views.
// Path: src/components/modules/onboardingChecklist/OnboardingStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { CHECKLIST_ITEM_KEYS, PROBATION_STATUS_OPTIONS } from './types';

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

/** Recomputes progress directly from a raw DB record's checklist-item
   fields (stored as JSON strings per item, matching buildRecord()'s shape). */
function progressFromRecord(rec: DbRecord): { done: number; total: number; percent: number } {
  const total = CHECKLIST_ITEM_KEYS.length;
  let done = 0;
  for (const key of CHECKLIST_ITEM_KEYS) {
    try {
      const item = JSON.parse(String(rec[`${key}Json`] ?? '{}'));
      if (item.completed) done++;
    } catch { /* not completed */ }
  }
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

interface Props {
  records: DbRecord[];
  onEdit: (rec: DbRecord) => void;
  onDelete: (id: string) => void;
  onPrintFiltered: (filtered: DbRecord[]) => void;
}

export default function OnboardingStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rows = useMemo(() => records.map(rec => ({ rec, progress: progressFromRecord(rec) })), [records]);

  const filtered = useMemo(() => {
    return rows.filter(({ rec }) => {
      if (statusFilter && String(rec.probationStatus ?? '') !== statusFilter) return false;
      if (search) {
        const hay = [rec.employeeName, rec.department, rec.designation].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, statusFilter, search]);

  const completeCount = filtered.filter(r => r.progress.percent === 100).length;
  const inProgressCount = filtered.filter(r => r.progress.percent > 0 && r.progress.percent < 100).length;
  const notStartedCount = filtered.filter(r => r.progress.percent === 0).length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট নতুন কর্মী</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>সম্পন্ন</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{completeCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>চলমান</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1d4ed8' }}>{inProgressCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>শুরু হয়নি</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>{notStartedCount}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>প্রবেশনকাল অবস্থা</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {PROBATION_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (নাম / বিভাগ / পদবী)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(statusFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} record(s)</span>
        <button onClick={() => onPrintFiltered(filtered.map(r => r.rec))} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>কর্মীর নাম</th>
              <th style={thS}>বিভাগ</th>
              <th style={thS}>পদবী</th>
              <th style={thS}>যোগদানের তারিখ</th>
              <th style={thS}>মেন্টর</th>
              <th style={{ ...thS, width: 160 }}>অগ্রগতি</th>
              <th style={thS}>প্রবেশনকাল</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো রেকর্ড পাওয়া যায়নি</td></tr>
            )}
            {filtered.map(({ rec, progress }, index) => {
              const id = String(rec.id ?? '');
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(rec.employeeName ?? '—')}</td>
                  <td style={tdS}>{String(rec.department ?? '—')}</td>
                  <td style={tdS}>{String(rec.designation ?? '—')}</td>
                  <td style={tdS}>{String(rec.joiningDate ?? '—')}</td>
                  <td style={tdS}>{String(rec.mentorName ?? '—')}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${progress.percent}%`, background: progress.percent === 100 ? '#16a34a' : '#1d4ed8' }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: progress.percent === 100 ? '#15803d' : '#475569', whiteSpace: 'nowrap' }}>{progress.done}/{progress.total}</span>
                    </div>
                  </td>
                  <td style={tdS}>{String(rec.probationStatus ?? '—')}</td>
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
