// ─────────────────────────────────────────────────────────────────────────────
// CompactTemplate.tsx — Point 1 (Global Standard Templates)
//
// Fewer fields than Standard: no factory address, no requisition-type
// sub-label, Remarks column dropped from the table, no per-line "= ৳ X"
// sub-total under unit price, tighter spacing throughout. Meant for
// quick, low-ink printing where the full detail isn't needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { RequisitionData } from '../types';
import { calculateRequisitionTotal } from '../types';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../../utils/printCSS';
import { PrintSignatureRow } from '../../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../../common/AuthorizationBlock';
import { formatDate, formatTaka } from './formatHelpers';

export default function CompactTemplate({
  requisition, authorization,
}: { requisition: RequisitionData; authorization: AuthorizationState }) {

  const isTaka = requisition.quantityType === 'taka';
  const total  = calculateRequisitionTotal(requisition);

  return (
    <div className="bg-white max-w-7xl mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        {/* ==================== HEADER (compact — name only, no address) ==================== */}
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">
              {requisition.factoryName || 'FACTORY NAME'}
            </h1>
          </div>

          <div className="flex justify-between items-baseline text-sm mt-3 mb-3">
            <p>
              <span className="font-bold">Requisition:</span> {requisition.subject || '_______________'}
            </p>
            <p>
              <span className="font-bold">Date:</span> {formatDate(requisition.date)}
            </p>
          </div>
        </header>

        {/* ==================== BODY (no Remarks column) ==================== */}
        <main className="print-body mt-3">
          <table className="w-full border-collapse border border-black req-items-table">
            <thead>
              {!isTaka ? (
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border border-black px-2 py-1.5 text-left font-bold text-xs w-12">Sl</th>
                  <th className="border border-black px-2 py-1.5 text-left font-bold text-xs">Particulars</th>
                  <th className="border border-black px-2 py-1.5 text-center font-bold text-xs w-24">Qty</th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold text-xs w-28">Unit Price (৳)</th>
                </tr>
              ) : (
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border border-black px-2 py-1.5 text-left font-bold text-xs w-12">Sl</th>
                  <th className="border border-black px-2 py-1.5 text-left font-bold text-xs">Particulars / Purpose</th>
                  <th className="border border-black px-2 py-1.5 text-right font-bold text-xs w-28">Amount (৳)</th>
                  <th className="border border-black px-2 py-1.5 text-left font-bold text-xs w-36">Payment To</th>
                </tr>
              )}
            </thead>
            <tbody>
              {requisition.items && requisition.items.length > 0 ? (
                requisition.items.map((item, index) => {
                  if (!isTaka) {
                    return (
                      <tr key={index} className="req-item-row">
                        <td className="border border-black px-2 py-1.5 text-center text-xs align-top">{item.slNo}</td>
                        <td className="border border-black px-2 py-1.5 text-xs align-top">
                          <p className="whitespace-pre-wrap leading-relaxed">{item.particulars}</p>
                        </td>
                        <td className="border border-black px-2 py-1.5 text-xs align-top text-center">{item.quantity || '—'}</td>
                        <td className="border border-black px-2 py-1.5 text-xs align-top text-right">
                          {item.unitPrice ? `৳ ${formatTaka(parseFloat(item.unitPrice))}` : '—'}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={index} className="req-item-row">
                      <td className="border border-black px-2 py-1.5 text-center text-xs align-top">{item.slNo}</td>
                      <td className="border border-black px-2 py-1.5 text-xs align-top">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.particulars}</p>
                      </td>
                      <td className="border border-black px-2 py-1.5 text-xs align-top text-right font-medium">
                        {item.amount ? `৳ ${formatTaka(parseFloat(item.amount))}` : '—'}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-xs align-top">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.paymentTo || '—'}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="border border-black px-2 py-6 text-center text-xs text-gray-400">
                    No items added
                  </td>
                </tr>
              )}

              {isTaka && requisition.items.length > 0 && (
                <tr className="req-total-row">
                  <td colSpan={2} className="border border-black px-2 py-2 text-right font-bold text-xs">Total:</td>
                  <td className="border border-black px-2 py-2 text-right font-bold text-xs">৳ {formatTaka(total)}</td>
                  <td className="border border-black px-2 py-2 text-xs" />
                </tr>
              )}
              {/* AUDIT FIX: same Gross Total addition as Standard/Detailed —
                 Materials mode previously showed no total in this template either. */}
              {!isTaka && requisition.items.length > 0 && (
                <tr className="req-total-row">
                  <td colSpan={2} className="border border-black px-2 py-2 text-right font-bold text-xs">Gross Total:</td>
                  <td className="border border-black px-2 py-2 text-right font-bold text-xs">৳ {formatTaka(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </main>

        {/* ==================== FOOTER — single-line signature ==================== */}
        <footer className="print-footer mt-8 req-signature-block">
          <PrintSignatureRow value={authorization} lang="en" />
        </footer>

      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_PORTRAIT}
        @media print {
          body * { visibility: hidden !important; }
          #printable-area, #printable-area *, .print-content, .print-content * {
            visibility: visible !important;
          }
          #printable-area { position: absolute !important; left: 0 !important;
            top: 0 !important; width: 100%; background: white !important;
            box-shadow: none !important; }
          .print-content { font-size: 9pt !important; }

          .req-items-table thead { display: table-header-group; }
          .req-items-table tfoot { display: table-row-group; }
          .req-item-row, .req-total-row { break-inside: avoid; page-break-inside: avoid; }
          .req-signature-block { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
