// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentPrintView.tsx — print-friendly register, columns match
// the reference image exactly.
// Path: src/components/modules/riskAssessment/RiskAssessmentPrintView.tsx
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

export default function RiskAssessmentPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
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
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">ঝুঁকি মূল্যায়ন (Risk Assessment)</h2>
            <p className="text-xs text-gray-600 mt-1">As of {today} · {records.length} entry(ies)</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 9 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">সেকশন</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">উৎস</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">ঝুঁকি সনাক্তকরণ</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">প্রভাব</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">প্রতিকার</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">ঝুঁকির কারণ অনুসন্ধান</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">ঝুঁকির মাত্রা</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">সংশোধনমূলক/প্রতিষেধক কার্য গ্রহণ করা</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">দায়িত্বপ্রাপ্ত ব্যক্তির নাম ও পদবী</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, index) => (
                <tr key={String(rec.id ?? index)} className="req-item-row">
                  <td className="border border-black px-2 py-1.5 font-semibold">{String(rec.section ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.source ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.riskIdentification ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.impact ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.remedy ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.causeInvestigation ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5 font-semibold">{String(rec.riskLevel ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.correctiveAction ?? '—')}</td>
                  <td className="border border-black px-2 py-1.5">{String(rec.responsiblePersonName ?? '—')}{rec.responsiblePersonDesignation ? `, ${rec.responsiblePersonDesignation}` : ''}</td>
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
          .print-content { font-size: 9pt !important; }
          .req-items-table thead { display: table-header-group; }
          .req-item-row { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
