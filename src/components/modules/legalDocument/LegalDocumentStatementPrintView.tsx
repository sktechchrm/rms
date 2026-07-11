// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentStatementPrintView.tsx — print-friendly version of the
// Statement (list) view. Shows whatever records were passed in (the
// CURRENTLY FILTERED list from LegalDocumentStatement, not necessarily
// every saved record) as a table, no "Actions" column (buttons don't mean
// anything on paper), with the same factory header / authority signature
// block every other print view in this app uses.
// Path: src/components/modules/legalDocument/LegalDocumentStatementPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { getExpiryStatus, EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function LegalDocumentStatementPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const expiredCount = records.filter(r => getExpiryStatus(String(r.expiryDate ?? '')) === 'expired').length;
  const dueSoonCount  = records.filter(r => getExpiryStatus(String(r.expiryDate ?? '')) === 'due-soon').length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Legal Document / License / Certificate / Agreement Record</h2>
            <p className="text-xs text-gray-600 mt-1">
              As of {today} · {records.length} record(s)
              {expiredCount > 0 && ` · ${expiredCount} expired`}
              {dueSoonCount > 0 && ` · ${dueSoonCount} due soon`}
            </p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold" style={{ width: 32 }}>SL</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Document Title</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Category</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Document No.</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Issuing Authority</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Issue Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Expiry Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, index) => {
                const status = getExpiryStatus(String(r.expiryDate ?? ''));
                return (
                  <tr key={String(r.id)} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.documentTitle ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.category ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.documentNo ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.issuingAuthority ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.issueDate ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(r.expiryDate ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">{EXPIRY_STATUS_STYLE[status].label}</td>
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
