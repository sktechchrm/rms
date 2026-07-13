// ─────────────────────────────────────────────────────────────────────────────
// OnboardingPrintView.tsx — print-friendly tracking dashboard, prints
// whatever's currently filtered (same pattern as Candidate Pipeline/
// Legal Document/Supplier Assessment).
// Path: src/components/modules/onboardingChecklist/OnboardingPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { CHECKLIST_ITEM_KEYS } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

function progressFromRecord(rec: DbRecord): { done: number; total: number } {
  const total = CHECKLIST_ITEM_KEYS.length;
  let done = 0;
  for (const key of CHECKLIST_ITEM_KEYS) {
    try {
      const item = JSON.parse(String(rec[`${key}Json`] ?? '{}'));
      if (item.completed) done++;
    } catch { /* not completed */ }
  }
  return { done, total };
}

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function OnboardingPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const completeCount = records.filter(r => {
    const p = progressFromRecord(r);
    return p.done === p.total;
  }).length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Onboarding Checklist Tracking</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {records.length} employee(s) · {completeCount} fully onboarded</p>
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
                <th className="border border-black px-2 py-1.5 text-left font-bold">Joining Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Mentor</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Progress</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Probation Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, index) => {
                const p = progressFromRecord(rec);
                return (
                  <tr key={String(rec.id ?? index)} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">{String(rec.employeeName ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.department ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.designation ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.joiningDate ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.mentorName ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{p.done}/{p.total}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.probationStatus ?? '—')}</td>
                  </tr>
                );
              })}
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
