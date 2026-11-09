// ─────────────────────────────────────────────────────────────────────────────
// LeftNoticeListPrintView.tsx — the CURRENTLY FILTERED absent-worker list (A4 landscape).
// NO id="printable-area" here — EmployeeNoticeView.tsx wraps it.
// Path: src/components/modules/LeftEmployeeNotice/LeftNoticeListPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { NoticeRow } from './leftNoticeModel';
import { STAGE_STYLE, summarize, formatDMY, todayIso } from './leftNoticeModel';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: NoticeRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState; filterText?: string }

const LN_FONT = 11;
const TH = 'border border-black px-1.5 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-1.5 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const WIDTHS = [3, 15, 12, 10, 9, 9, 9, 11, 22];

export default function LeftNoticeListPrintView({ rows, factoryName, factoryAddress, authorization, filterText }: Props) {
  const sum = summarize(rows);
  const dates = rows.map(r => r.absence).filter(Boolean).sort();
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
            <h2 className="text-lg font-bold">অনুপস্থিত শ্রমিকের নোটিশ বিবরণী (Left Worker Notice Statement)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Absent from:</strong> {range}</div>
                {filterText && <div><strong>View:</strong> {filterText}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(todayIso())}</div>
                <div><strong>Records:</strong> {sum.count} | <strong>পত্র-১:</strong> {sum.n1} | <strong>পত্র-২:</strong> {sum.n2} | <strong>চূড়ান্ত:</strong> {sum.final}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: LN_FONT, lineHeight: 1.35, tableLayout: 'fixed' }}>
            <colgroup>{WIDTHS.map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
            <thead><tr>
              {['SL', 'Employee Details\n(Name (Card No) · Designation · Section)', 'পিতা / স্বামী', 'অনুপস্থিত শুরু', 'পত্র নং-১', 'পত্র নং-২', 'পত্র নং-৩ (চূড়ান্ত)', 'অবস্থা', 'বর্তমান ঠিকানা'].map(h => (
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
                  <td className={TD} style={wrap}>{r.gender === 'female' && r.husbandName ? `স্বামী: ${r.husbandName}` : (r.fatherName || '—')}</td>
                  <td className={TD}><div style={{ fontWeight: 700 }}>{formatDMY(r.absence) || '—'}</div>{r.daysAbsent !== null && r.daysAbsent >= 0 && <div>{r.daysAbsent} দিন</div>}</td>
                  <td className={`${TD} font-semibold`}>{formatDMY(r.n1.date) || '—'}</td>
                  <td className={`${TD} font-semibold`}>{formatDMY(r.n2.date) || '—'}</td>
                  <td className={`${TD} font-semibold`}>{formatDMY(r.n3.date) || '—'}</td>
                  <td className={`${TD} font-semibold`}>{STAGE_STYLE[r.stage].label}</td>
                  <td className={TD} style={wrap}>{r.presentAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>

        <footer className="print-footer mt-10"><PrintSignatureRow value={authorization} lang="en" /></footer>
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