// ─────────────────────────────────────────────────────────────────────────────
// CandidatePrintView.tsx — print-friendly version of the tracking
// dashboard, same pattern as Legal Document/Audit-Visit/Supplier
// Assessment — prints whatever's currently filtered, not every candidate.
// Path: src/components/modules/candidatePipeline/CandidatePrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function CandidatePrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const joinedCount = records.filter(r => r.stage === 'Joined').length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Candidate Pipeline</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {records.length} candidate(s) · {joinedCount} joined</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Candidate Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Position</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Department</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Phone</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Source</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Application Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Stage</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, index) => (
                <tr key={String(r.id ?? index)} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{String(r.candidateName ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.positionAppliedFor ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.department ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.phone ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.source ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.applicationDate ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(r.stage ?? '—')}</td>
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
