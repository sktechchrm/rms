// ─────────────────────────────────────────────────────────────────────────────
// GradeComplianceReport.tsx — compares actual employee Gross Salary
// against their assigned grade's OFFICIAL gazette minimum (from saved
// Grade Definitions). Same summary + detailed-breakdown pattern as
// Living Wage's Wage Gap Report, reusing that established structure —
// not duplicating its logic, just applied against grid minimums instead
// of a living-wage benchmark.
// Path: src/components/modules/wagesGrid/GradeComplianceReport.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateGrossFromGrade, calculateCompliance } from './types';
import type { GradeDefinitionData } from './types';

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
  gradeRecords: DbRecord[];
  isLoading: boolean;
}

function recordToGrade(rec: DbRecord): GradeDefinitionData & { gross: number } {
  const data: GradeDefinitionData = {
    gradeName: String(rec.gradeName ?? ''),
    scheduleType: (rec.scheduleType === 'তফসিল-খ (করণিক)' ? 'তফসিল-খ (করণিক)' : 'তফসিল-ক (শ্রমিক)'),
    basicWage: String(rec.basicWage ?? ''),
    houseRentAllowance: String(rec.houseRentAllowance ?? ''),
    medicalAllowance: String(rec.medicalAllowance ?? ''),
    conveyanceAllowance: String(rec.conveyanceAllowance ?? ''),
    foodAllowance: String(rec.foodAllowance ?? ''),
    effectiveDate: String(rec.effectiveDate ?? ''),
    gazetteReference: String(rec.gazetteReference ?? ''),
    remarks: '', date: '', factoryName: '', factoryAddress: '',
  };
  return { ...data, gross: calculateGrossFromGrade(data) };
}

export default function GradeComplianceReport({ employees, gradeRecords, isLoading }: Props) {
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [search, setSearch] = useState('');

  const grades = useMemo(() => gradeRecords.map(recordToGrade), [gradeRecords]);
  const gradeByName = useMemo(() => {
    const map = new Map<string, { gross: number; scheduleType: string }>();
    for (const g of grades) map.set(g.gradeName.trim(), { gross: g.gross, scheduleType: g.scheduleType });
    return map;
  }, [grades]);

  const rows = useMemo(() => {
    return employees
      .filter(e => Number(e.grossSalary) > 0)
      .map(e => {
        const grade = String(e.grade ?? '').trim();
        const gridEntry = gradeByName.get(grade);
        const compliance = calculateCompliance(
          String(e.fullName ?? e.fullNameBengali ?? '—'),
          String(e.cardNo ?? ''),
          grade,
          Number(e.grossSalary) || 0,
          gridEntry ? gridEntry.gross : null,
        );
        return { emp: e, compliance };
      });
  }, [employees, gradeByName]);

  const filtered = useMemo(() => {
    return rows.filter(({ emp, compliance }) => {
      if (scheduleFilter) {
        const gridEntry = gradeByName.get(compliance.grade);
        if (!gridEntry || gridEntry.scheduleType !== scheduleFilter) return false;
      }
      if (search) {
        const hay = [emp.fullName, emp.fullNameBengali, emp.designation, compliance.grade].map(v => String(v ?? '').toLowerCase()).join(' ');
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, scheduleFilter, search, gradeByName]);

  const noGradeMatch = filtered.filter(r => !r.compliance.gradeFound).length;
  const nonCompliant = filtered.filter(r => r.compliance.gradeFound && !r.compliance.isCompliant).length;
  const compliant = filtered.filter(r => r.compliance.gradeFound && r.compliance.isCompliant).length;

  if (isLoading) {
    return (
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', color: '#94a3b8', fontFamily: font }}>
        লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>মোট কর্মী</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{filtered.length}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Compliant</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{compliant}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Non-Compliant</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: nonCompliant > 0 ? '#b91c1c' : '#15803d' }}>{nonCompliant}</div>
        </div>
        <div style={metricCard}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>গ্রেড মেলেনি</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: noGradeMatch > 0 ? '#92400e' : '#15803d' }}>{noGradeMatch}</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>তফসিল</label>
          <select value={scheduleFilter} onChange={e => setScheduleFilter(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="তফসিল-ক (শ্রমিক)">তফসিল-ক (শ্রমিক)</option>
            <option value="তফসিল-খ (করণিক)">তফসিল-খ (করণিক)</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Search (নাম / পদবী / গ্রেড)</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
        </div>
      </div>

      {grades.length === 0 && (
        <div style={{ padding: '10px 16px', background: '#fef3c7', color: '#92400e', fontSize: 12.5, fontFamily: font }}>
          ⚠ কোনো গ্রেড সংজ্ঞা এখনো সংরক্ষণ করা হয়নি — আগে গ্রেড ফর্ম পূরণ করুন, তবেই compliance যাচাই করা যাবে।
        </div>
      )}

      <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontFamily: font }}>
        {filtered.length} employee(s) with wage data · {employees.length} total loaded · {grades.length} grade(s) defined
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={{ ...thS, width: 40 }}>SL</th>
              <th style={thS}>নাম</th>
              <th style={thS}>পদবী</th>
              <th style={thS}>গ্রেড</th>
              <th style={thS}>প্রকৃত মোট বেতন</th>
              <th style={thS}>গ্রেডের ন্যূনতম</th>
              <th style={thS}>পার্থক্য</th>
              <th style={thS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#94a3b8', padding: 24 }}>কোনো কর্মী পাওয়া যায়নি</td></tr>
            )}
            {filtered.map(({ emp, compliance }, index) => (
              <tr key={String(emp.id ?? index)}>
                <td style={{ ...tdS, textAlign: 'center', fontWeight: 600 }}>{index + 1}</td>
                <td style={{ ...tdS, fontWeight: 600 }}>{compliance.employeeName}</td>
                <td style={tdS}>{String(emp.designation ?? '—')}</td>
                <td style={tdS}>{compliance.grade || '—'}</td>
                <td style={tdS}>{compliance.actualGross.toFixed(2)}</td>
                <td style={tdS}>{compliance.gradeFound ? compliance.gridGross.toFixed(2) : '—'}</td>
                <td style={{ ...tdS, color: !compliance.gradeFound ? '#94a3b8' : compliance.gapAmount > 0 ? '#b91c1c' : '#15803d', fontWeight: 600 }}>
                  {compliance.gradeFound ? `${compliance.gapAmount > 0 ? '−' : '+'}${Math.abs(compliance.gapAmount).toFixed(2)} (${compliance.gapPercent.toFixed(1)}%)` : '—'}
                </td>
                <td style={tdS}>
                  {!compliance.gradeFound ? (
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>গ্রেড মেলেনি</span>
                  ) : (
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: compliance.isCompliant ? '#f0fdf4' : '#fee2e2',
                      color: compliance.isCompliant ? '#15803d' : '#b91c1c',
                    }}>
                      {compliance.isCompliant ? '✓ Compliant' : '⚠ Below'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
