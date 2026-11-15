// ─────────────────────────────────────────────────────────────────────────────
// MiscBillListPrintView.tsx — the CURRENTLY FILTERED bills list (A4 landscape).
// Each bill is one row; the per-bill entries are in the Excel file.
// NO id="printable-area" here — MiscBillManager wraps it.
// Path: src/components/modules/miscBill/MiscBillListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { BillRow } from './miscBillModel';
import { formatDMY, money, summarize, todayIso } from './miscBillModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  rows: BillRow[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
  filterText?: string;
}

const MB_FONT = 10.5;   // table text size (px)
const TH = 'border border-black px-1.5 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-1.5 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
/** Column widths in %, in order (adds up to 100). */
const WIDTHS = [4, 10, 14, 26, 8, 13, 13, 12];

export default function MiscBillListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const sum = summarize(rows);
  const range = sum.from
    ? (sum.from === sum.to ? formatDMY(sum.from) : `${formatDMY(sum.from)} → ${formatDMY(sum.to)}`)
    : '—';

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Miscellaneous Bill Statement</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Bill dates:</strong> {range}</div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div>
                  <strong>Bills:</strong> {sum.bills} | <strong>Entries:</strong> {sum.entries} | <strong>Grand total:</strong> Tk {money(sum.total)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: MB_FONT, lineHeight: 1.35, tableLayout: 'fixed' }}>
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr>
                <th className={TH}>SL</th>
                <th className={TH}>Bill Date</th>
                <th className={TH}>Template</th>
                <th className={TH}>Subject</th>
                <th className={TH}>Entries</th>
                <th className={TH} style={{ textAlign: 'right' }}>Grand Total (Tk)</th>
                <th className={TH}>Prepared By</th>
                <th className={TH}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="border border-black px-2 py-4 text-center text-gray-600">No bills match the selected filter</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id || i} className="req-item-row">
                  <td className={`${TD} text-center`}>{i + 1}</td>
                  <td className={TD}>{formatDMY(r.date) || '—'}</td>
                  <td className={TD} style={wrap}>{r.templateLabel}</td>
                  <td className={`${TD} font-semibold`} style={wrap}>{r.subject || '—'}</td>
                  <td className={`${TD} text-center`}>{r.entries}</td>
                  <td className={`${TD} font-bold`} style={{ textAlign: 'right' }}>{money(r.total)}</td>
                  <td className={TD} style={wrap}>{r.preparedBy || '—'}</td>
                  <td className={TD} style={{ height: 36 }} />
                </tr>
              ))}
              {rows.length > 0 && (
                <tr>
                  <td colSpan={4} className={`${TD} font-bold`} style={{ textAlign: 'right' }}>Total ({sum.bills} bills)</td>
                  <td className={`${TD} font-bold text-center`}>{sum.entries}</td>
                  <td className={`${TD} font-bold`} style={{ textAlign: 'right' }}>{money(sum.total)}</td>
                  <td className={TD} colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>

          {rows.length > 0 && (
            <table className="border-collapse border border-black" style={{ fontSize: MB_FONT, marginTop: 12, width: '60%' }}>
              <tbody>
                <tr><td className={TD} style={{ width: '50%' }}>Holiday Bill</td><td className={`${TD} text-right`}>{sum.holiday.count} bill(s) · {money(sum.holiday.total)}</td></tr>
                <tr><td className={TD}>Festival Holiday Bill</td><td className={`${TD} text-right`}>{sum.festival.count} bill(s) · {money(sum.festival.total)}</td></tr>
                <tr><td className={TD}>Adjustment Bill</td><td className={`${TD} text-right`}>{sum.adjustment.count} bill(s) · {money(sum.adjustment.total)}</td></tr>
              </tbody>
            </table>
          )}
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
