// ─────────────────────────────────────────────────────────────────────────────
// DisciplinaryListPrintView.tsx — the CURRENTLY FILTERED case list (A4 landscape).
// NO id="printable-area" here — DisciplinaryActionManager.tsx wraps it (same as LeftNoticeListPrintView.tsx).
// Path: src/components/modules/disciplinaryAction/DisciplinaryListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { CaseRow } from './disciplinaryStatementModel';
import { STAGE_STYLE, summarize, formatDMY, todayIso } from './disciplinaryStatementModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: CaseRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState; filterText?: string }

const DA_FONT = 11;
const TH = 'border border-black px-1.5 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-1.5 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const WIDTHS = [3, 17, 12, 10, 10, 10, 10, 14, 14];

export default function DisciplinaryListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const sum = summarize(rows);
  const dates = rows.map(r => r.showCause).filter(Boolean).sort();
  const range = dates.length ? (dates[0] === dates[dates.length - 1] ? formatDMY(dates[0]) : `${formatDMY(dates[0])} → ${formatDMY(dates[dates.length - 1])}`) : '—';

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold">শৃঙ্খলামূলক ব্যবস্থা — কেস বিবরণী (Disciplinary Action Statement)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Show-cause date:</strong> {range}</div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div>
                  <strong>Cases:</strong> {sum.count} | <strong>জবাবের অপেক্ষায়:</strong> {sum.reply} | <strong>তদন্ত পর্যায়ে:</strong> {sum.inEnquiry} | <strong>সিদ্ধান্ত:</strong> {sum.decided} | <strong>সমাপ্ত:</strong> {sum.closed}
                  {sum.overdue > 0 && <> | <strong>মেয়াদোত্তীর্ণ:</strong> {sum.overdue}</>}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: DA_FONT, lineHeight: 1.35, tableLayout: 'fixed' }}>
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead><tr>
              {['SL', 'Employee Details\n(Name (Card No) · Designation · Section)', 'সূত্র নং', 'কারণ দর্শানো', 'জবাব', 'নোটিশ ২ / ৩', 'তদন্ত সময়সীমা', 'প্রতিবেদন ও শাস্তি/দণ্ড', 'অবস্থা'].map(h => (
                <th key={h} className={TH} style={{ whiteSpace: 'pre-line' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="border border-black px-2 py-4 text-center text-gray-600">No records match the selected filter</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id || i} className="req-item-row">
                  <td className={`${TD} text-center`}>{i + 1}</td>
                  <td className={TD} style={wrap}>
                    <div style={{ fontWeight: 700 }}>{r.name}{r.cardNo ? ` (${r.cardNo})` : ''}</div>
                    <div>{r.designation || '—'}</div><div>{r.section || '—'}</div>
                  </td>
                  <td className={TD} style={wrap}>{r.referenceNo || '—'}</td>
                  <td className={`${TD} font-semibold`}>{formatDMY(r.showCause) || '—'}</td>
                  <td className={TD}>
                    <div style={{ fontWeight: 600 }}>{formatDMY(r.replyDate) || '—'}</div>
                    {r.replyStatus && <div>{r.replyStatus}</div>}
                  </td>
                  <td className={TD}>
                    <div><strong>২:</strong> {formatDMY(r.notice2) || '—'}</div>
                    <div><strong>৩:</strong> {formatDMY(r.notice3) || '—'}</div>
                  </td>
                  <td className={`${TD} font-semibold`}>{r.stage === 'Closed' || r.stage === 'Decided' ? '—' : (formatDMY(r.enquiry.date) || '—')}</td>
                  <td className={TD} style={wrap}>
                    <div style={{ fontWeight: 600 }}>{formatDMY(r.evaluationDate) || '—'}</div>
                    {r.punishment && <div>{r.punishment}</div>}
                  </td>
                  <td className={`${TD} font-semibold`}>
                    {STAGE_STYLE[r.stage].label}
                    {r.overdue && <div>(মেয়াদোত্তীর্ণ)</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10"><PrintSignatureRow value={authorization} lang="bn" /></footer>
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
