// ─────────────────────────────────────────────────────────────────────────────
// SurveyDataPrintView.tsx — print / PDF of the Individual Worker Survey table (A4 landscape).
// Shows the rows exactly as filtered and sorted on the survey step, with an average (or median /
// trimmed mean) row for the valid records. NO id="printable-area" here — LivingWageManager wraps it.
// Path: src/components/modules/livingWage/SurveyDataPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { LivingWageData, SurveyRow } from './types';
import { COST_COMPONENTS, SURVEY_NUM_FIELDS, deriveFromSurveys, statisticLabel, formatDMY, todayIso, fmt } from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  data: LivingWageData;
  /** The rows to print — already filtered and sorted. */
  rows: SurveyRow[];
  /** All saved survey records (for "x of y"). */
  totalCount: number;
  authorization: AuthorizationState;
  filterText?: string;
}

const TH = 'border border-black px-1 py-1 text-center font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-1 py-1 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };

// widths sum to 100: SL, name, ID, date, 11 numeric columns, surveyor, check
const W_SL = 3, W_NAME = 11.5, W_ID = 6, W_DATE = 7, W_NUM_FAMILY = 4.5, W_NUM_COST = 5.5, W_SURVEYOR = 8.5, W_CHECK = 5.5;

export default function SurveyDataPrintView({ data, rows, totalCount, authorization, filterText }: Props) {
  const records = rows.map(r => r.s);
  const derived = deriveFromSurveys(records, data.surveyStatistic, false);
  const avg = (key: string): number => {
    if (key === 'actualFamilySize') return derived.familySize;
    if (key === 'actualEarnersInFamily') return derived.workers;
    const comp = COST_COMPONENTS.find(c => c.entry === key);
    return comp ? derived.costs[comp.key].raw : 0;
  };
  const issueRows = rows.filter(r => r.issues.length).length;
  const numCols = SURVEY_NUM_FIELDS.length;

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{data.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{data.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Individual Worker Survey Data (Living Wage — Anker Methodology)</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left', lineHeight: 1.6 }}>
              <div>
                <div><strong>Location:</strong> {data.location} &nbsp;|&nbsp; <strong>Study year:</strong> {data.studyYear}</div>
                <div><strong>records:</strong> {rows.length} of {totalCount}{filterText ? ` · ${filterText}` : ''}{issueRows > 0 ? ` · ${issueRows} with issues` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div><strong>Submission date:</strong> {formatDMY(data.date || todayIso())}</div>
                <div><strong>Valid for the average:</strong> {derived.n} records</div>
              </div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="w-full border-collapse border border-black req-items-table" style={{ fontSize: 9, lineHeight: 1.3, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: `${W_SL}%` }} /><col style={{ width: `${W_NAME}%` }} /><col style={{ width: `${W_ID}%` }} /><col style={{ width: `${W_DATE}%` }} />
              {SURVEY_NUM_FIELDS.map(f => <col key={f.key} style={{ width: `${f.key === 'actualFamilySize' || f.key === 'actualEarnersInFamily' ? W_NUM_FAMILY : W_NUM_COST}%` }} />)}
              <col style={{ width: `${W_SURVEYOR}%` }} /><col style={{ width: `${W_CHECK}%` }} />
            </colgroup>
            <thead>
              <tr>
                <th className={TH}>SL</th><th className={TH}>Worker name</th><th className={TH}>Worker ID</th><th className={TH}>Survey date</th>
                {SURVEY_NUM_FIELDS.map(f => <th key={f.key} className={TH}>{f.label}</th>)}
                <th className={TH}>Surveyor</th><th className={TH}>Check</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={numCols + 6} className="border border-black px-2 py-4 text-center text-gray-600">No survey records match the filters</td></tr>}
              {rows.map(({ s, i, issues }, k) => (
                <tr key={i} className="req-item-row">
                  <td className={`${TD} text-center`}>{k + 1}</td>
                  <td className={`${TD} font-semibold`} style={wrap}>{s.workerName || '—'}</td>
                  <td className={`${TD} text-center`} style={wrap}>{s.workerId || '—'}</td>
                  <td className={`${TD} text-center`}>{formatDMY(s.surveyDate) || '—'}</td>
                  {SURVEY_NUM_FIELDS.map(f => <td key={f.key} className={`${TD} text-right`}>{s[f.key] || '—'}</td>)}
                  <td className={TD} style={wrap}>{s.surveyorName || '—'}</td>
                  <td className={`${TD} text-center`} style={{ fontSize: 8 }}>{issues.length ? issues.join('; ') : ''}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="req-item-row" style={{ fontWeight: 700 }}>
                  <td className={TD} colSpan={4}>{statisticLabel(data.surveyStatistic)} of the valid records ({derived.n})</td>
                  {SURVEY_NUM_FIELDS.map(f => <td key={f.key} className={`${TD} text-right`}>{derived.n ? fmt(avg(f.key)) : '—'}</td>)}
                  <td className={TD} colSpan={2} />
                </tr>
              )}
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
