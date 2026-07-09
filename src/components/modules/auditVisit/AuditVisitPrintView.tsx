// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitPrintView.tsx — single-record print output, matches Requisition's
// print-view pattern including the full authority signature block.
// Path: src/components/modules/auditVisit/AuditVisitPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { AuditVisitData } from './types';
import { calculateNextAuditDate } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

export default function AuditVisitPrintView({ data, authorization }: { data: AuditVisitData; authorization: AuthorizationState }) {
  const nextDate = calculateNextAuditDate(data.date, data.validityMonths, data.validityYears);
  const validityText = [
    data.validityYears && Number(data.validityYears) > 0 ? `${data.validityYears} Year(s)` : '',
    data.validityMonths && Number(data.validityMonths) > 0 ? `${data.validityMonths} Month(s)` : '',
  ].filter(Boolean).join(' ') || '—';

  const rows: [string, string][] = [
    ['Date', data.date || '—'],
    ['Types', data.type],
    ['Duration', data.duration],
    ['Certification For', data.certificationFor || '—'],
    ['Audit Firm', data.auditFirm || '—'],
    ['Name of Auditor', data.auditorName || '—'],
    ['Audit Mode', data.auditMode],
    ['Results/Score', data.resultsScore || '—'],
    ['Validity Time of Certificate', validityText],
    ['Next Audit Date', nextDate || '—'],
  ];

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{data.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{data.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-4">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Audit / Visit Record</h2>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black" style={{ fontSize: 12.5 }}>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="border border-black px-3 py-2 font-bold bg-gray-50 print:bg-white" style={{ width: '38%' }}>{label}</td>
                  <td className="border border-black px-3 py-2">{value}</td>
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
        ${PAGE_A4_PORTRAIT}
      `}</style>
    </div>
  );
}
