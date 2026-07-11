// ─────────────────────────────────────────────────────────────────────────────
// WageGapPrintView.tsx — print-friendly version of the Wage Gap Report.
// UPDATE (explicit request): now includes the FULL calculation method
// breakdown (benchmark source OR full cost-component breakdown, whichever
// was used) so the printed report is self-contained/auditable — not just
// the comparison table. Also shows the department filter that was active
// when "Print This View" was clicked, if any.
// Path: src/components/modules/livingWage/WageGapPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import type { LivingWageData } from './types';
import {
  calculateWageGap, calculateNFNHTotal, calculateFamilyCostSubtotal,
  calculateContingencyMargin, calculateTotalFamilyCost, calculateNetLivingWage,
  calculateGrossLivingWage, getLivingWageAmount,
} from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  employees: DbRecord[];
  livingWageData: LivingWageData;
  authorization: AuthorizationState;
  departmentFilter?: string;
}

export default function WageGapPrintView({ employees, livingWageData, authorization, departmentFilter }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const livingWage = getLivingWageAmount(livingWageData);
  const rows = employees
    .filter(e => Number(e.grossSalary) > 0)
    .map(e => ({ emp: e, gap: calculateWageGap(Number(e.grossSalary) || 0, livingWage) }));
  const belowCount = rows.filter(r => !r.gap.meetsLivingWage).length;
  const avgActual = rows.length > 0 ? rows.reduce((s, r) => s + r.gap.actualWage, 0) / rows.length : 0;

  const isCalculator = livingWageData.method === 'calculator';

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{livingWageData.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{livingWageData.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Living Wage Gap Analysis (Anker Methodology)</h2>
            <p className="text-xs text-gray-600 mt-1">
              As of {today} · Living Wage: Tk {livingWage.toFixed(2)}/month · Avg Actual: Tk {avgActual.toFixed(2)} · {belowCount} of {rows.length} below
              {departmentFilter ? ` · Department: ${departmentFilter}` : ' · All Departments'}
            </p>
          </div>
        </header>

        {/* ── Calculation Method section — per explicit request, print shows HOW the figure was derived ── */}
        <section className="mb-4" style={{ pageBreakInside: 'avoid' }}>
          <table className="w-full border-collapse border border-black" style={{ fontSize: 10.5 }}>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white" style={{ width: '22%' }}>Method</td>
                <td className="border border-black px-2 py-1.5" colSpan={3}>
                  {isCalculator ? 'Full Calculator (cost components)' : 'Published Benchmark'}
                  {' — '}{livingWageData.location} ({livingWageData.studyYear})
                  {livingWageData.sourceReference ? ` — Source: ${livingWageData.sourceReference}` : ''}
                </td>
              </tr>
              {!isCalculator && (
                <tr>
                  <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Benchmark Amount</td>
                  <td className="border border-black px-2 py-1.5" colSpan={3}>Tk {(Number(livingWageData.benchmarkAmount) || 0).toFixed(2)}</td>
                </tr>
              )}
              {isCalculator && (
                <>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Food Cost</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.foodCost) || 0).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Housing Cost</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.housingCost) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Healthcare</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.healthcareCost) || 0).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Education</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.educationCost) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Transport</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.transportCost) || 0).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Clothing</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.clothingCost) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Communication</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.communicationCost) || 0).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Other Essentials</td>
                    <td className="border border-black px-2 py-1.5">{(Number(livingWageData.otherEssentialCost) || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">NFNH Subtotal</td>
                    <td className="border border-black px-2 py-1.5">{calculateNFNHTotal(livingWageData).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Food+Housing+NFNH</td>
                    <td className="border border-black px-2 py-1.5">{calculateFamilyCostSubtotal(livingWageData).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Contingency Margin ({livingWageData.contingencyMarginPercent}%)</td>
                    <td className="border border-black px-2 py-1.5">{calculateContingencyMargin(livingWageData).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Total Family Cost</td>
                    <td className="border border-black px-2 py-1.5">{calculateTotalFamilyCost(livingWageData).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Family Size / Workers per Family</td>
                    <td className="border border-black px-2 py-1.5">{livingWageData.familySize} / {livingWageData.workersPerFamily}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Payroll Deduction (%)</td>
                    <td className="border border-black px-2 py-1.5">{livingWageData.payrollDeductionPercent}%</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Net Living Wage / Worker</td>
                    <td className="border border-black px-2 py-1.5">{calculateNetLivingWage(livingWageData).toFixed(2)}</td>
                    <td className="border border-black px-2 py-1.5 font-bold bg-gray-50 print:bg-white">Gross Living Wage / Worker</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">{calculateGrossLivingWage(livingWageData).toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Designation</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Department</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gross Salary</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Living Wage</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gap</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ emp, gap }, index) => (
                <tr key={String(emp.id ?? index)} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1.5">{String(emp.fullName ?? emp.fullNameBengali ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(emp.designation ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(emp.department ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{gap.actualWage.toFixed(2)}</td>
                  <td className="border border-black px-2 py-1.5">{gap.livingWage.toFixed(2)}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{gap.gapAmount > 0 ? '−' : '+'}{Math.abs(gap.gapAmount).toFixed(2)} ({gap.gapPercent.toFixed(1)}%)</td>
                  <td className="border border-black px-2 py-1.5">{gap.meetsLivingWage ? 'Meets' : 'Below'}</td>
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
