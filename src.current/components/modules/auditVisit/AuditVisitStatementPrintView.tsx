// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitStatementPrintView.tsx — print-friendly version of the
// Statement (list) view. Same rationale as
// LegalDocumentStatementPrintView.tsx — the currently FILTERED list, no
// Actions column, factory header + authority signature block.
// Path: src/components/modules/auditVisit/AuditVisitStatementPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { calculateValidUntil } from './types';
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

export default function AuditVisitStatementPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const withValidUntil = records.map(r => ({
    rec: r,
    validUntil: calculateValidUntil(String(r.visitDate ?? ''), String(r.validityPeriodValue ?? ''), (r.validityPeriodUnit === 'year' ? 'year' : 'month')),
  }));
  const expiredCount = withValidUntil.filter(({ validUntil }) => getExpiryStatus(validUntil) === 'expired').length;
  const dueSoonCount  = withValidUntil.filter(({ validUntil }) => getExpiryStatus(validUntil) === 'due-soon').length;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Audit / Visit / Certification Validity Record</h2>
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
                <th className="border border-black px-2 py-1.5 text-left font-bold">Audit / Certification</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Standard / Buyer</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Auditor / Organization</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Visit Date</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Validity Period</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Valid Until</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {withValidUntil.map(({ rec, validUntil }, index) => {
                const status = getExpiryStatus(validUntil);
                const periodText = `${rec.validityPeriodValue ?? '0'} ${rec.validityPeriodUnit === 'year' ? 'Yr' : 'Mo'}`;
                return (
                  <tr key={String(rec.id)} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.auditCertification ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.standardBuyer ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.auditorOrganization ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.visitDate ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{periodText}</td>
                    <td className="border border-black px-2 py-1.5">{validUntil || '—'}</td>
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
