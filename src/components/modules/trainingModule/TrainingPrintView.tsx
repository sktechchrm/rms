// ─────────────────────────────────────────────────────────────────────────────
// TrainingPrintView.tsx — print-friendly tracking dashboard, prints
// whatever's currently filtered.
// Path: src/components/modules/trainingModule/TrainingPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

function participantCountFromRecord(rec: DbRecord): { total: number; attended: number } {
  try {
    const items = JSON.parse(String(rec.participantsJson ?? '[]'));
    if (!Array.isArray(items)) return { total: 0, attended: 0 };
    return { total: items.length, attended: items.filter((p: { attended?: boolean }) => p.attended).length };
  } catch { return { total: 0, attended: 0 }; }
}

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function TrainingPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const conductedCount = records.filter(r => r.status === 'Conducted').length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Training Session Tracking</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {records.length} session(s) · {conductedCount} conducted</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Topic</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Month/Year</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Trainer</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Venue</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Scheduled Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Participants</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, index) => {
                const pc = participantCountFromRecord(rec);
                const topic = rec.trainingTopic === 'অন্যান্য (Other)' ? String(rec.customTopic ?? '') : String(rec.trainingTopic ?? '—');
                return (
                  <tr key={String(rec.id ?? index)} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">{topic}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.trainingMonth ?? '—')}/{String(rec.trainingYear ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.trainerName ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.venue ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.scheduledDate ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{pc.attended}/{pc.total}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.status ?? '—')}</td>
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
