// ─────────────────────────────────────────────────────────────────────────────
// GradePrintView.tsx — print-friendly compliance report, prints whatever
// employee set is passed in (same "print what's visible" pattern as
// Living Wage/Legal Document/Supplier Assessment).
// Path: src/components/modules/wagesGrid/GradePrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateGrossFromGrade, calculateCompliance } from './types';
import type { GradeDefinitionData } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  employees: DbRecord[];
  gradeRecords: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
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

export default function GradePrintView({ employees, gradeRecords, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const grades = gradeRecords.map(recordToGrade);
  const gradeByName = new Map(grades.map(g => [g.gradeName.trim(), g.gross]));

  const rows = employees
    .filter(e => Number(e.grossSalary) > 0)
    .map(e => {
      const grade = String(e.grade ?? '').trim();
      const gridGross = gradeByName.has(grade) ? gradeByName.get(grade)! : null;
      return {
        emp: e,
        compliance: calculateCompliance(String(e.fullName ?? e.fullNameBengali ?? '—'), String(e.cardNo ?? ''), grade, Number(e.grossSalary) || 0, gridGross),
      };
    });
  const nonCompliant = rows.filter(r => r.compliance.gradeFound && !r.compliance.isCompliant).length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Wages Grid — Grade Definitions &amp; Compliance</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {grades.length} grade(s) defined · {rows.length} employee(s) checked · {nonCompliant} below grade</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table mb-6" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">Grade</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Schedule</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Basic</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">House Rent</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Medical</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Conveyance</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Food</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gross</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 font-semibold">{g.gradeName}</td>
                  <td className="border border-black px-2 py-1.5">{g.scheduleType}</td>
                  <td className="border border-black px-2 py-1.5">{g.basicWage}</td>
                  <td className="border border-black px-2 py-1.5">{g.houseRentAllowance}</td>
                  <td className="border border-black px-2 py-1.5">{g.medicalAllowance}</td>
                  <td className="border border-black px-2 py-1.5">{g.conveyanceAllowance}</td>
                  <td className="border border-black px-2 py-1.5">{g.foodAllowance}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{g.gross.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Grade</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Actual Gross</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Grid Minimum</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gap</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, compliance }, index) => (
                <tr key={String(emp.id ?? index)} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{compliance.employeeName}</td>
                  <td className="border border-black px-2 py-1.5">{compliance.grade || '—'}</td>
                  <td className="border border-black px-2 py-1.5">{compliance.actualGross.toFixed(2)}</td>
                  <td className="border border-black px-2 py-1.5">{compliance.gradeFound ? compliance.gridGross.toFixed(2) : '—'}</td>
                  <td className="border border-black px-2 py-1.5">{compliance.gradeFound ? `${compliance.gapAmount.toFixed(2)} (${compliance.gapPercent.toFixed(1)}%)` : '—'}</td>
                  <td className="border border-black px-2 py-1.5">{!compliance.gradeFound ? 'গ্রেড মেলেনি' : compliance.isCompliant ? 'Compliant' : 'Below'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * { visibility: visible !important; }
          #printable-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100%; background: white !important; }
          .print-content { font-size: 10pt !important; }
          .req-items-table thead { display: table-header-group; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
