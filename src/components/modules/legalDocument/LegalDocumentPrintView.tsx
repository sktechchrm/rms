// ─────────────────────────────────────────────────────────────────────────────
// LegalDocumentPrintView.tsx
// Path: src/components/modules/legalDocument/LegalDocumentPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { LegalDocumentData } from './types';
import { getExpiryStatus } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

const STATUS_LABEL: Record<string, string> = {
  expired: 'Expired', 'due-soon': 'Due Soon', valid: 'Valid', unknown: '—',
};

export default function LegalDocumentPrintView({ data, authorization }: { data: LegalDocumentData; authorization: AuthorizationState }) {
  const status = getExpiryStatus(data.dateExpire);

  const rows: [string, string][] = [
    ['Details of Documents', data.documentDetails || '—'],
    ['Mentioned Capacity/Category', data.mentionedCapacity || '—'],
    ['Date of Received', data.dateReceived || '—'],
    ['Date of Expire', data.dateExpire || '—'],
    ['Document Authority Body', data.authorityBody || '—'],
    ['Status', STATUS_LABEL[status]],
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
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Legal Document Validity Status</h2>
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
