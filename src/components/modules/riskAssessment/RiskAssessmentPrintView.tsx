// ─────────────────────────────────────────────────────────────────────────────
// RiskAssessmentPrintView.tsx — print register of the CURRENTLY FILTERED / SORTED entries.
// Path: src/components/modules/riskAssessment/RiskAssessmentPrintView.tsx
//
// NOTE: no id="printable-area" here — RiskAssessmentManager wraps it in the one element.
// Header line: left = sections, right = print date + totals (entries | high & above).
// Column 6 prints as "৩ × ৪ = ১২ (উচ্চ)".
// ─────────────────────────────────────────────────────────────────────────────

import type { DbRecord } from '../../../database/DatabaseFactory';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';
import { RISK_HEADERS, buildRiskEntries, assessmentText, formatDMY, todayIso, toBn } from './types';

interface Props {
  records: DbRecord[];
  factoryName: string;
  factoryAddress: string;
  authorization: AuthorizationState;
}

const RA_FONT = 10;   // table text size (px) — raise to make the print bigger
const TH = 'border border-black px-2 py-2 text-left font-bold';
const TD = 'border border-black px-2 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

// widths sum to 100: ক্রমিক + the 9 columns
const WIDTHS = [4, 8, 10, 12, 10, 11, 11, 10, 14, 10];
const dash = (v: unknown) => String(v ?? '') || '—';

export default function RiskAssessmentPrintView({ records, factoryName, factoryAddress, authorization }: Props) {
  const today   = todayIso();
  const entries = buildRiskEntries(records);

  const sections = Array.from(new Set(records.map(r => String(r.section ?? '').trim()).filter(Boolean)));
  const highCount = entries.filter(e => e.level === 'উচ্চ' || e.level === 'অত্যন্ত উচ্চ').length;

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">ঝুঁকি মূল্যায়ন প্রতিবেদন (Risk Assessment Report)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div><strong>সেকশন:</strong> {sections.length ? sections.join(' | ') : '—'}</div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>তারিখ:</strong> {formatDMY(today)}</div>
                <div><strong>মোট এন্ট্রি:</strong> {toBn(records.length)} | <strong>উচ্চ ও অত্যন্ত উচ্চ:</strong> {toBn(highCount)}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: RA_FONT, lineHeight: 1.35, tableLayout: 'fixed' }}>
            <colgroup>{WIDTHS.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}</colgroup>
            <thead>
              <tr className="bg-gray-50 print:bg-white">
                <th className={TH}>ক্রমিক</th>
                {RISK_HEADERS.map(h => <th key={h} className={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={WIDTHS.length} className="border border-black px-2 py-4 text-center text-gray-600">কোনো এন্ট্রি পাওয়া যায়নি</td></tr>
              )}
              {entries.map((e, index) => {
                const r = e.rec;
                const actionDate = formatDMY(String(r.correctiveActionDate ?? '').slice(0, 10));
                return (
                  <tr key={String(r.id ?? index)} className="req-item-row">
                    <td className={`${TD} text-center`}>{toBn(index + 1)}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{dash(r.section)}</td>
                    <td className={TD} style={wrap}>{dash(r.source)}</td>
                    <td className={TD} style={wrap}>{dash(r.riskIdentification)}</td>
                    <td className={TD} style={wrap}>{dash(r.impact)}</td>
                    <td className={TD} style={wrap}>{dash(r.remedy)}</td>
                    <td className={`${TD} font-semibold`} style={wrap}>{assessmentText(e.likelihood, e.severity, e.level)}</td>
                    <td className={TD} style={wrap}>{dash(r.causeInvestigation)}</td>
                    <td className={TD} style={wrap}>
                      {dash(r.correctiveAction)}
                      {actionDate && <div className="font-semibold" style={{ fontSize: RA_FONT - 1 }}>{actionDate}</div>}
                    </td>
                    <td className={TD} style={wrap}>
                      {dash(r.responsiblePersonName)}{r.responsiblePersonDesignation ? `, ${r.responsiblePersonDesignation}` : ''}
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