// ─────────────────────────────────────────────────────────────────────────────
// MiscBillView.tsx — print output, adapts columns/title/formula per template
// (Holiday / Adjustment / Festival Holiday). English-only.
// Path: src/components/modules/miscBill/MiscBillView.tsx
//
// CHANGES:
//   • Bill date prints as DD-MM-YYYY.
//   • The last column is now Signature (a blank box for physical signing) in every template,
//     replacing the Remarks column. Remarks is still stored and edited on the form.
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillTemplateProps } from './types';
import { TEMPLATE_OPTIONS, COUNT_LABEL, calculatePayableAmount, calculateDynamicBasicSalary, grandTotalInWords } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

/** ISO (YYYY-MM-DD) → DD-MM-YYYY. Anything that is not an ISO date is returned unchanged. */
export function formatDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (iso ?? '');
}

export default function MiscBillView({ data, authorization }: MiscBillTemplateProps) {
  const title = TEMPLATE_OPTIONS.find(t => t.value === data.template)?.label ?? 'Miscellaneous Bill';
  const countLabel = COUNT_LABEL[data.template];
  const isAdjustment = data.template === 'adjustment';

  const grandTotal = data.items.reduce(
    (sum, it) => sum + calculatePayableAmount(data.template, it.grossSalary, it.count, it.manualPayableAmount),
    0,
  );

  // Every template now has 10 printed columns:
  //   Holiday / Festival: SL, Name, Card No., Designation, Department, Gross, Basic, Count, Payable, Signature
  //   Adjustment:         SL, Particulars, Name, Card No., Designation, Department, Gross, Basic, Payable, Signature
  // Everything before Payable Amount is 8 columns in both sets, so the Grand Total label spans 8.
  const totalCols    = 10;
  const labelColSpan = 8;

  return (
    <div className="bg-white max-w-full mx-auto" id="printable-area">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{data.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{data.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-3">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">{title}</h2>
            {data.subject && <p className="text-xs text-gray-600 mt-1">{data.subject}</p>}
          </div>
          <div className="flex justify-end text-sm mb-2">
            <p><span className="font-bold">Date:</span> {formatDMY(data.date)}</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10.5 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                {isAdjustment && <th className="border border-black px-2 py-1.5 text-left font-bold">Particulars</th>}
                <th className="border border-black px-2 py-1.5 text-left font-bold">Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Card No.</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Designation</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Department</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gross Salary</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Basic Salary</th>
                {!isAdjustment && <th className="border border-black px-2 py-1.5 text-left font-bold">{countLabel}</th>}
                <th className="border border-black px-2 py-1.5 text-left font-bold">Payable Amount</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Signature</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const payable = calculatePayableAmount(data.template, item.grossSalary, item.count, item.manualPayableAmount);
                const basicSalary = calculateDynamicBasicSalary(item.grossSalary);
                return (
                  <tr key={index} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{item.slNo}</td>
                    {isAdjustment && <td className="border border-black px-2 py-1.5">{item.particulars || '—'}</td>}
                    <td className="border border-black px-2 py-1.5">{item.name || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.cardNo || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.designation || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.department || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.grossSalary || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{basicSalary > 0 ? basicSalary.toFixed(2) : '—'}</td>
                    {!isAdjustment && <td className="border border-black px-2 py-1.5">{item.count || '—'}</td>}
                    <td className="border border-black px-2 py-1.5 font-semibold">{payable.toFixed(2)}</td>
                    {/* Signature: blank box for physical signing, not a data field */}
                    <td className="border border-black px-2 py-1.5" style={{ minWidth: 80 }}>&nbsp;</td>
                  </tr>
                );
              })}
              {/* Grand Total on ONE line: label, then the amount spanning Payable + Signature, never wrapping */}
              <tr>
                <td colSpan={labelColSpan} className="border border-black px-2 py-1.5 text-right font-bold">Grand Total</td>
                <td colSpan={totalCols - labelColSpan} className="border border-black px-2 py-1.5 font-bold text-left" style={{ whiteSpace: 'nowrap' }}>
                  Tk {grandTotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={totalCols} className="border border-black px-2 py-1.5 italic text-xs">
                  In Word: {grandTotalInWords(grandTotal)}
                </td>
              </tr>
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
