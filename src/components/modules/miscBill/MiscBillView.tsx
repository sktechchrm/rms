// ─────────────────────────────────────────────────────────────────────────────
// MiscBillView.tsx — print output, adapts columns/title/formula per template
// (Holiday/Adjustment/Festival Holiday).
// Path: src/components/modules/miscBill/MiscBillView.tsx
//
// UPDATE (explicit request): Basic Salary column added to ALL templates.
// Adjustment Bill's columns changed — SL, Particulars, Name, Card/ID,
// Designation, Dept/Section, Gross Salary, Basic Salary, Payable Amount,
// Remarks (no Count, no Signature). Holiday/Festival unchanged apart from
// the new Basic Salary column. Grand Total now followed by an "In Word" row.
// ─────────────────────────────────────────────────────────────────────────────

import type { MiscBillTemplateProps } from './types';
import { TEMPLATE_OPTIONS, COUNT_LABEL, calculatePayableAmount, grandTotalInWords } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_PORTRAIT } from '../../../utils/printCSS';

export default function MiscBillView({ data, authorization }: MiscBillTemplateProps) {
  const title = TEMPLATE_OPTIONS.find(t => t.value === data.template)?.label ?? 'Miscellaneous Bill';
  const countLabel = COUNT_LABEL[data.template];
  const isAdjustment = data.template === 'adjustment';

  const grandTotal = data.items.reduce(
    (sum, it) => sum + calculatePayableAmount(data.template, it.grossSalary, it.basicSalary, it.count, it.manualPayableAmount),
    0,
  );

  // Total column count differs slightly by template — used for the
  // Grand Total / In Word rows' colSpan math.
  // Holiday/Festival: SL,Name,Card/ID,Designation,Dept/Section,Gross,Basic,Count,Payable,Signature,Remarks = 11
  // Adjustment:       SL,Particulars,Name,Card/ID,Designation,Dept/Section,Gross,Basic,Payable,Remarks     = 10
  const totalCols     = isAdjustment ? 10 : 11;
  const labelColSpan  = isAdjustment ? 8  : 8; // everything before Payable Amount

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
            <p><span className="font-bold">Date:</span> {data.date}</p>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 10.5 }}>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className="border border-black px-2 py-1.5 text-left font-bold">SL</th>
                {isAdjustment && <th className="border border-black px-2 py-1.5 text-left font-bold">Particulars</th>}
                <th className="border border-black px-2 py-1.5 text-left font-bold">Name</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Card/ID</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Designation</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Dept/Section</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Gross Salary</th>
                <th className="border border-black px-2 py-1.5 text-left font-bold">Basic Salary</th>
                {!isAdjustment && <th className="border border-black px-2 py-1.5 text-left font-bold">{countLabel}</th>}
                <th className="border border-black px-2 py-1.5 text-left font-bold">Payable Amount</th>
                {!isAdjustment && <th className="border border-black px-2 py-1.5 text-left font-bold">Signature</th>}
                <th className="border border-black px-2 py-1.5 text-left font-bold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const payable = calculatePayableAmount(data.template, item.grossSalary, item.basicSalary, item.count, item.manualPayableAmount);
                return (
                  <tr key={index} className="req-item-row">
                    <td className="border border-black px-2 py-1.5 text-center">{item.slNo}</td>
                    {isAdjustment && <td className="border border-black px-2 py-1.5">{item.particulars || '—'}</td>}
                    <td className="border border-black px-2 py-1.5">{item.name || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.cardId || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.designation || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.deptSection || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.grossSalary || '—'}</td>
                    <td className="border border-black px-2 py-1.5">{item.basicSalary || '—'}</td>
                    {!isAdjustment && <td className="border border-black px-2 py-1.5">{item.count || '—'}</td>}
                    <td className="border border-black px-2 py-1.5 font-semibold">{payable.toFixed(2)}</td>
                    {/* Signature: blank box for physical signing, not a data field — only for Holiday/Festival, per the updated Adjustment column list */}
                    {!isAdjustment && <td className="border border-black px-2 py-1.5" style={{ minWidth: 70 }}>&nbsp;</td>}
                    <td className="border border-black px-2 py-1.5">{item.remarks || '—'}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={labelColSpan} className="border border-black px-2 py-1.5 text-right font-bold">Grand Total</td>
                <td className="border border-black px-2 py-1.5 font-bold">{grandTotal.toFixed(2)}</td>
                <td className="border border-black px-2 py-1.5" colSpan={totalCols - labelColSpan - 1} />
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