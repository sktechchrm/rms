// ─────────────────────────────────────────────────────────────────────────────
// PerformancePrintView.tsx — print-friendly tracking dashboard, prints
// whatever's currently filtered.
// Path: src/components/modules/employeePerformance/PerformancePrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateWeightedScore } from './types';
import type { KPIItem } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

function scoreFromRecord(rec: DbRecord): number {
  const override = Number(rec.overallScoreOverride);
  if (rec.overallScoreOverride && !isNaN(override)) return override;
  try {
    const items = JSON.parse(String(rec.kpiItemsJson ?? '[]')) as KPIItem[];
    if (!Array.isArray(items)) return 0;
    return calculateWeightedScore(items);
  } catch { return 0; }
}

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function PerformancePrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Employee Performance Review Tracking</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {records.length} review(s)</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Employee Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Department</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Designation</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Review Cycle</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Score</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Rating</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Recommended Increment</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, index) => (
                <tr key={String(rec.id ?? index)} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{String(rec.employeeName ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.department ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.designation ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.reviewCycle ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{scoreFromRecord(rec).toFixed(2)}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.ratingCategory ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{rec.recommendedIncrementPercent ? `${rec.recommendedIncrementPercent}%` : '—'}</td>
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
