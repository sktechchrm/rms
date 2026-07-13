// ─────────────────────────────────────────────────────────────────────────────
// WageGapReport.tsx — compares actual employee Gross Salary against the
// calculated/entered Living Wage. Both summary (factory-wide average) AND
// detailed per-employee breakdown, per explicit request.
// Path: src/components/modules/livingWage/WageGapReport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateWageGap } from './types';

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
  background: '#f8fafc', borderRadius: 8, padding: '14px 16px', flex: 1, minWidth: 160,
};

interface Props {
  employees: DbRecord[];
  livingWage: number;
  isLoading: boolean;
  onPrintFiltered: (filteredEmployees: DbRecord[], departmentFilter: string) => void;
}

export default function WageGapReport({ employees, livingWage, isLoading, onPrintFiltered }: Props) {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    return employees
      .filter(e => Number(e.grossSalary) > 0) // skip records with no wage data
      .map(e => {
        const actualWage = Number(e.grossSalary) || 0;
        const gap = calculateWageGap(actualWage, livingWage);
        return { emp: e, gap };
      });
  }, [employees, livingWage]);

  const departments = useMemo(() => {
    const set = new Set(rows.map(r => String(r.emp.department ?? '')).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(({ emp }) => {
      if (departmentFilter && String(emp.department ?? '') !== departmentFilter) return false;
      if (search) {
        const hay = [emp.fullName, emp.fullNameBengali, emp.designation].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, departmentFilter, search]);

  const belowCount = filtered.filter(r => !r.gap.meetsLivingWage).length;
  const avgActualWage = filtered.length > 0 ? filtered.reduce((s, r) => s + r.gap.actualWage, 0) / filtered.length : 0;
  const avgGapPercent  = filtered.length > 0 ? filtered.reduce((s, r) => s + r.gap.gapPercent, 0) / filtered.length : 0;

  if (isLoading) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8', fontFamily: font }}>
        Loading employee wage data...
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Living Wage (Tk/month)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{livingWage.toFixed(2)}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Average Actual Gross Salary</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{avgActualWage.toFixed(2)}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Average Gap</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: avgGapPercent > 0 ? '#b91c1c' : '#15803d' }}>{avgGapPercent.toFixed(1)}%</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Employees Below Living Wage</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: belowCount > 0 ? '#b91c1c' : '#15803d' }}>{belowCount} / {filtered.length}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Department</label>
          <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (Name / Designation)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{filtered.length} employee(s) with wage data · {employees.length} total loaded{departmentFilter ? ` · Department: ${departmentFilter}` : ''}</span>
        <button
          onClick={() => onPrintFiltered(filtered.map(r => r.emp), departmentFilter)}
          style={{ padding: '6px 12px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontFamily: font, cursor: 'pointer', fontWeight: 600 }}
        >
          🖨 Print This View
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>Name</th>
              <th style={thS}>Designation</th>
              <th style={thS}>Department</th>
              <th style={thS}>Gross Salary</th>
              <th style={thS}>Living Wage</th>
              <th style={thS}>Gap</th>
              <th style={thS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>No employee wage data available for comparison</td></tr>
            )}
            {filtered.map(({ emp, gap }, index) => (
              <tr key={String(emp.id ?? index)}>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                <td style={tdS}>{String(emp.fullName ?? emp.fullNameBengali ?? '—')}</td>
                <td style={tdS}>{String(emp.designation ?? '—')}</td>
                <td style={tdS}>{String(emp.department ?? '—')}</td>
                <td style={tdS}>{gap.actualWage.toFixed(2)}</td>
                <td style={tdS}>{gap.livingWage.toFixed(2)}</td>
                <td style={{ ...tdS, color: gap.gapAmount > 0 ? '#b91c1c' : '#15803d', fontWeight: 600 }}>
                  {gap.gapAmount > 0 ? '−' : '+'}{Math.abs(gap.gapAmount).toFixed(2)} ({gap.gapPercent.toFixed(1)}%)
                </td>
                <td style={tdS}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: gap.meetsLivingWage ? '#f0fdf4' : '#fee2e2',
                    color: gap.meetsLivingWage ? '#15803d' : '#b91c1c',
                  }}>
                    {gap.meetsLivingWage ? '✓ Meets' : '⚠ Below'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
