// ─────────────────────────────────────────────────────────────────────────────
// AuditVisitStatementPrintView.tsx — print-friendly version of the
// Statement (list) view. Same rationale as
// LegalDocumentStatementPrintView.tsx — the currently FILTERED list, no
// Actions column, factory header + authority signature block.
// Path: src/components/modules/auditVisit/AuditVisitStatementPrintView.tsx
//
// UPDATE (renewal outcome status): status comes from
// buildAuditRenewalChains() in types.ts — the same function
// AuditVisitStatement.tsx uses — so the printed record never shows a
// different status than the screen.
//
// UPDATE (quantified delay/early amount): the Status cell also prints the
// `delayLabel` ("13 days late", "2 months early") under the status word.
//
// UPDATE (DD-MM-YYYY display): Visit Date and Valid Until columns render
// through formatDMY() — display only.
//
// UPDATE (filtered print stays status-correct): a record's status depends
// on the NEXT visit in its chain, which a filter may have hidden. So
// chains are now built from `contextRecords` (the FULL register) and only
// THEN narrowed to the rows in `records` (the filtered list to print).
// Without this, filtering to e.g. "Delayed" could print a record as
// "Expired" because its renewing visit was filtered out of the input.
//
// UPDATE (filter summary): `filterSummary` (from describeAuditFilters() in
// types.ts) prints under the title when a filter is active, so a filtered
// printout is never mistaken for the full register.
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { buildAuditRenewalChains, formatDMY } from './types';
import { EXPIRY_STATUS_STYLE } from '../../../utils/expiryStatus';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  /** Rows to print (already filtered, in display order). */
  records: DbRecord[];
  /** FULL register, used only to resolve renewal chains/status correctly.
   *  Falls back to `records` if omitted. */
  contextRecords?: DbRecord[];
  /** e.g. "Status: Delayed". Empty/omitted = no filter line printed. */
  filterSummary?: string;
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

export default function AuditVisitStatementPrintView({
  records, contextRecords, filterSummary, factoryName, factoryAddress, authorization,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

  // Chains from the FULL register, then keep only the rows being printed
  // (preserving the order of `records`).
  const entryById = new Map(
    buildAuditRenewalChains(contextRecords ?? records).map(e => [String(e.rec.id), e]),
  );
  const withValidUntil = records
    .map(r => entryById.get(String(r.id)))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

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
              As of {formatDMY(today)} · {withValidUntil.length} record(s)
              {expiredCount > 0 && ` · ${expiredCount} expired`}
              {delayedCount > 0 && ` · ${delayedCount} delayed`}
              {dueSoonCount > 0 && ` · ${dueSoonCount} due soon`}
            </p>
            {filterSummary && (
              <p className="text-xs text-gray-600 mt-0.5">Filtered: {filterSummary}</p>
            )}
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
              {withValidUntil.length === 0 && (
                <tr>
                  <td colSpan={8} className="border border-black px-2 py-4 text-center text-gray-600">
                    No records match the selected filter
                  </td>
                </tr>
              )}
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