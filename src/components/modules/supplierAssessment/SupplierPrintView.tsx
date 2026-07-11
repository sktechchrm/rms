// ─────────────────────────────────────────────────────────────────────────────
// SupplierPrintView.tsx — print-friendly version of the tracking dashboard.
// Shows whatever rows were passed in (the CURRENTLY FILTERED list from
// SupplierStatement, same pattern already established for Legal
// Document/Audit-Visit/Living Wage).
// Path: src/components/modules/supplierAssessment/SupplierPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { FlatRow } from './SupplierStatement';
import { getExpiryStatus, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  rows: FlatRow[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function SupplierPrintView({ rows, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const expiredCount  = rows.filter(r => getExpiryStatus(r.assessment.certificateValidUntil) === 'expired').length;
  const rejectedCount = rows.filter(r => r.assessment.approvalStatus === 'Rejected').length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Supplier Assessment, Approval &amp; Tracking</h2>
            <p className="text-xs text-gray-600 mt-1">
              As of {today} · {rows.length} assessment(s)
              {expiredCount > 0 && ` · ${expiredCount} certificate(s) expired`}
              {rejectedCount > 0 && ` · ${rejectedCount} rejected`}
            </p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 9.5 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">Supplier</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Business Type</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Standard</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Audit Type</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Audit Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Score</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Cert. Valid Until</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Cert. Status</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Approval</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const certStatus = getExpiryStatus(row.assessment.certificateValidUntil);
                return (
                  <tr key={index} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 font-semibold">{row.supplierName}</td>
                    <td className="border border-black px-2 py-1.5">{row.businessType}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.standard}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.auditType || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.auditDate || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.score || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.certificateValidUntil || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{EXPIRY_STATUS_STYLE[certStatus].label}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.approvalStatus}</td>
                    <td className="border border-black px-2 py-1.5">{row.assessment.nextReviewDate || '—'}</td>
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
