// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitStatementPrintView.tsx — print-friendly version of the
// Statement (list) view. Same rationale as
// LegalDocumentStatementPrintView.tsx — the currently FILTERED list, no
// Actions column, factory header + authority signature block.
// Path: src/components/modules/auditVisit/AuditVisitStatementPrintView.tsx
//
// UPDATE (renewal outcome status): status now comes from
// buildAuditRenewalChains() in types.ts — the same function
// AuditVisitStatement.tsx uses — instead of a separate plain
// getExpiryStatus() computation. This guarantees the printed record never
// shows a different status than what the user was looking at when they
// clicked Print List.
//
// UPDATE (quantified delay/early amount): the Status cell now also prints
// the `delayLabel` ("13 days late", "2 months early") on a second line
// under the status word, so a printed record shows the size of the gap,
// not just its direction — matching the on-screen statement view.
//
// UPDATE (DD-MM-YYYY display): Visit Date and Valid Until columns now
// render through formatDMY() from types.ts — display only, the "As of"
// date in the header and all underlying values stay ISO for computation.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { buildAuditRenewalChains, formatDMY } from './types';
import { EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
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
  const withValidUntil = buildAuditRenewalChains(records);
  const expiredCount = withValidUntil.filter(({ status }) => status === 'expired').length;
  const delayedCount = withValidUntil.filter(({ status }) => status === 'delayed').length;
  const dueSoonCount = withValidUntil.filter(({ status }) => status === 'due-soon').length;

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
              As of {formatDMY(today)} · {records.length} record(s)
              {expiredCount > 0 && ` · ${expiredCount} expired`}
              {delayedCount > 0 && ` · ${delayedCount} delayed`}
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
              {withValidUntil.map(({ rec, validUntil, status, delayLabel }, index) => {
                const periodText = `${rec.validityPeriodValue ?? '0'} ${rec.validityPeriodUnit === 'year' ? 'Yr' : 'Mo'}`;
                return (
                  <tr key={String(rec.id)} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.auditCertification ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.standardBuyer ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{String(rec.auditorOrganization ?? '—')}</td>
                    <td className="border border-black px-2 py-1.5">{formatDMY(String(rec.visitDate ?? '')) || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{periodText}</td>
                    <td className="border border-black px-2 py-1.5">{formatDMY(validUntil) || '—'}</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">
                      {EXPIRY_STATUS_STYLE[status].label}
                      {delayLabel && (
                        <div className="font-normal" style={{ fontSize: 9 }}>{delayLabel}</div>
                      )}
                    </td>
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