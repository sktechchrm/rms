// ─────────────────────────────────────────────────────────────────────────────
// PerformanceStatement.tsx — tracking dashboard, all saved reviews,
// filterable, same pattern as Candidate Pipeline/Onboarding/Legal
// Document's tracking views.
// Path: src/components/modules/employeePerformance/PerformanceStatement.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { RATING_CATEGORY_OPTIONS, RATING_STYLE, calculateWeightedScore } from './types';
import type { RatingCategory, KPIItem } from './types';

/** Recomputes the overall score directly from a raw DB record — manual
   override wins if the record has one, otherwise recalculates the
   weighted average from the saved kpiItemsJson (same logic as
   getOverallScore(), just reading from the raw record shape instead of
   the live form's typed state — matching Onboarding's
   progressFromRecord() pattern for the same reason: the dashboard reads
   saved records, not live form state). */
function scoreFromRecord(rec: DbRecord): number {
  const override = Number(rec.overallScoreOverride);
  if (rec.overallScoreOverride && !isNaN(override)) return override;
  try {
    const items = JSON.parse(String(rec.kpiItemsJson ?? '[]')) as KPIItem[];
    if (!Array.isArray(items)) return 0;
    return calculateWeightedScore(items);
  } catch { return 0; }
}

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

export default function PerformanceStatement({ records, onEdit, onDelete, onPrintFiltered }: Props) {
  const [cycleFilter, setCycleFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cycles = useMemo(() => {
    const set = new Set(records.map(r => String(r.reviewCycle ?? '')).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (cycleFilter && String(r.reviewCycle ?? '') !== cycleFilter) return false;
      if (ratingFilter && String(r.ratingCategory ?? '') !== ratingFilter) return false;
      if (search) {
        const hay = [r.employeeName, r.department, r.designation].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [records, cycleFilter, ratingFilter, search]);

  const excellentCount = filtered.filter(r => r.ratingCategory === 'Excellent').length;
  const needsImprovementCount = filtered.filter(r => r.ratingCategory === 'Needs Improvement' || r.ratingCategory === 'Unsatisfactory').length;

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট পর্যালোচনা</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Excellent</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{excellentCount}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>উন্নতি প্রয়োজন</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: needsImprovementCount > 0 ? '#b91c1c' : '#15803d' }}>{needsImprovementCount}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>পর্যালোচনা চক্র</label>
          <select value={cycleFilter} onChange={e => setCycleFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {cycles.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>রেটিং</label>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {RATING_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (নাম / বিভাগ / পদবী)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {(cycleFilter || ratingFilter || search) && (
          <button onClick={() => { setCycleFilter(''); setRatingFilter(''); setSearch(''); }} style={{ padding: '7px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontFamily: font, cursor: 'pointer', color: '#475569' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} of {records.length} review(s)</span>
        <button onClick={() => onPrintFiltered(filtered)} style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}>
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
              <th style={thS}>পর্যালোচনা চক্র</th>
              <th style={thS}>স্কোর</th>
              <th style={thS}>রেটিং</th>
              <th style={{ ...thS, width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো রেকর্ড পাওয়া যায়নি</td></tr>
            )}
            {filtered.map((r, index) => {
              const id = String(r.id ?? '');
              const rating = (RATING_CATEGORY_OPTIONS.includes(r.ratingCategory as RatingCategory) ? r.ratingCategory : '') as RatingCategory;
              const style = rating ? RATING_STYLE[rating] : null;
              return (
                <tr key={id}>
                  <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{String(r.employeeName ?? '—')}</td>
                  <td style={tdS}>{String(r.department ?? '—')}</td>
                  <td style={tdS}>{String(r.designation ?? '—')}</td>
                  <td style={tdS}>{String(r.reviewCycle ?? '—')}</td>
                  <td style={tdS}>{scoreFromRecord(r).toFixed(2)}</td>
                  <td style={tdS}>
                    {rating ? (
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: style!.bg, color: style!.color }}>{rating}</span>
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
