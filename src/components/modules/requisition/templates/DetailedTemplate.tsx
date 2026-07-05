// ─────────────────────────────────────────────────────────────────────────────
// DetailedTemplate.tsx — Point 1 (Global Standard Templates)
//
// More fields than Standard: adds an explicit "Line Total" column for
// Type A (Item/Material) instead of Standard's small sub-text, plus a
// summary box above the signature block recapping total line items and
// grand total. Meant for requisitions that need a fuller paper trail.
// ─────────────────────────────────────────────────────────────────────────────

import type { RequisitionData } from '../types';
import { calculateRequisitionTotal } from '../types';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../../utils/printCSS';
import { PrintSignatureRow } from '../../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../../common/AuthorizationBlock';
import { formatDate, formatTaka } from './formatHelpers';

export default function DetailedTemplate({
  requisition, authorization,
}: { requisition: RequisitionData; authorization: AuthorizationState }) {

  const isTaka = requisition.quantityType === 'taka';
  const total  = calculateRequisitionTotal(requisition);
  const itemCount = requisition.items?.length ?? 0;

  return (
    <div className="bg-white max-w-7xl mx-auto" id="printable-area">
      <div className="print-content p-12 print:p-0">

        {/* ==================== HEADER ==================== */}
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-2xl font-bold text-black mb-1 uppercase tracking-wide company-name">
              {requisition.factoryName || 'FACTORY NAME'}
            </h1>
            <p className="text-xs text-black company-address">
              {requisition.factoryAddress || 'Factory Address'}
            </p>
          </div>

          <div className="text-center mt-4 mb-4">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">
              Official Requisition
            </h2>
            <p className="text-xs text-gray-600 mt-1 req-type-label">
              {isTaka ? 'Direct Money / Fee Requisition' : 'Item / Material Requisition'}
            </p>
          </div>

          <div className="flex justify-between items-start text-sm border-gray-300 pb-3">
            <div className="flex-1">
              <p>
                <span className="font-bold">Sub: Requisition for</span> {requisition.subject || '_______________'}
              </p>
            </div>
            <div className="text-right ml-8 min-w-[150px]">
              <p>
                <span className="font-bold">Date:</span> {formatDate(requisition.date)}
              </p>
            </div>
          </div>
        </header>

        {/* ==================== BODY (with explicit Line Total column) ==================== */}
        <main className="print-body mt-6">
          <table className="w-full border-collapse border-2 border-black req-items-table">
            <thead>
              {!isTaka ? (
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm w-14">Sl No</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm">Particulars</th>
                  <th className="border-2 border-black px-3 py-2 text-center font-bold text-sm w-24">Quantity</th>
                  <th className="border-2 border-black px-3 py-2 text-right font-bold text-sm w-28">Unit Price (৳)</th>
                  <th className="border-2 border-black px-3 py-2 text-right font-bold text-sm w-28">Line Total (৳)</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm w-40">Remarks</th>
                </tr>
              ) : (
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm w-14">Sl No</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm">Particulars / Purpose</th>
                  <th className="border-2 border-black px-3 py-2 text-right font-bold text-sm w-32">Amount (৳)</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm w-40">Payment To</th>
                  <th className="border-2 border-black px-3 py-2 text-left font-bold text-sm w-40">Remarks</th>
                </tr>
              )}
            </thead>
            <tbody>
              {requisition.items && requisition.items.length > 0 ? (
                requisition.items.map((item, index) => {
                  if (!isTaka) {
                    const qtyNum  = parseFloat(item.quantity);
                    const unitNum = parseFloat(item.unitPrice);
                    const lineTotal = (!isNaN(qtyNum) && !isNaN(unitNum)) ? qtyNum * unitNum : null;
                    return (
                      <tr key={index} className="req-item-row">
                        <td className="border-2 border-black px-3 py-2 text-center font-semibold text-sm align-top">
                          {item.slNo}
                        </td>
                        <td className="border-2 border-black px-3 py-2 text-sm align-top">
                          <p className="whitespace-pre-wrap leading-relaxed">{item.particulars}</p>
                        </td>
                        <td className="border-2 border-black px-3 py-2 text-sm align-top text-center">
                          {item.quantity || '—'}
                        </td>
                        <td className="border-2 border-black px-3 py-2 text-sm align-top text-right">
                          {item.unitPrice ? `৳ ${formatTaka(parseFloat(item.unitPrice))}` : '—'}
                        </td>
                        <td className="border-2 border-black px-3 py-2 text-sm align-top text-right font-semibold">
                          {lineTotal !== null ? `৳ ${formatTaka(lineTotal)}` : '—'}
                        </td>
                        <td className="border-2 border-black px-3 py-2 text-sm align-top">
                          <p className="whitespace-pre-wrap leading-relaxed">{item.remarks}</p>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={index} className="req-item-row">
                      <td className="border-2 border-black px-3 py-2 text-center font-semibold text-sm align-top">
                        {item.slNo}
                      </td>
                      <td className="border-2 border-black px-3 py-2 text-sm align-top">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.particulars}</p>
                      </td>
                      <td className="border-2 border-black px-3 py-2 text-sm align-top text-right font-medium">
                        {item.amount ? `৳ ${formatTaka(parseFloat(item.amount))}` : '—'}
                      </td>
                      <td className="border-2 border-black px-3 py-2 text-sm align-top">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.paymentTo || '—'}</p>
                      </td>
                      <td className="border-2 border-black px-3 py-2 text-sm align-top">
                        <p className="whitespace-pre-wrap leading-relaxed">{item.remarks}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isTaka ? 5 : 6} className="border-2 border-black px-3 py-8 text-center text-sm text-gray-400">
                    No items added
                  </td>
                </tr>
              )}

              {isTaka && requisition.items.length > 0 && (
                <tr className="req-total-row">
                  <td colSpan={2} className="border-2 border-black px-3 py-3 text-right font-bold text-sm">
                    Total Amount:
                  </td>
                  <td className="border-2 border-black px-3 py-3 text-right font-bold text-sm text-emerald-800 print:text-black">
                    ৳ {formatTaka(total)}
                  </td>
                  <td colSpan={2} className="border-2 border-black px-3 py-3 text-sm" />
                </tr>
              )}
            </tbody>
          </table>

          {/* ── Extra summary box (Detailed-only) ───────────────────────────── */}
          <div className="mt-4 border-2 border-black p-3 flex justify-between text-sm req-summary-box">
            <span><span className="font-bold">Total Line Items:</span> {itemCount}</span>
            <span><span className="font-bold">Grand Total:</span> ৳ {formatTaka(total)}</span>
          </div>
        </main>

        {/* ==================== FOOTER SECTION (Signatures Only) ==================== */}
        <footer className="print-footer mt-12 req-signature-block">
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
          .print-content { font-size: 10pt !important; }

          .req-items-table thead { display: table-header-group; }
          .req-items-table tfoot { display: table-row-group; }
          .req-item-row, .req-total-row { break-inside: avoid; page-break-inside: avoid; }
          .req-summary-box { break-inside: avoid; page-break-inside: avoid; }
          .req-signature-block { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
