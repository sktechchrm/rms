// ─────────────────────────────────────────────────────────────────────────────
// LivingWagePrintView.tsx — print (A4 landscape) in three parts:
//   'calculation' — Anker calculation sheet (method, survey summary, cost build-up)
//   'gap'         — wage gap: summary, department table, employee table
//   'plan'        — management review, corrective actions, commitment
// NO id="printable-area" here — LivingWageManager wraps it.
// Path: src/components/modules/livingWage/LivingWagePrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { LivingWageData, GapEntry } from './types';
import {
  COST_COMPONENTS, computeLivingWage, gapStats, departmentSummary, empName, formatDMY, todayIso, money, fmt, statisticLabel, actionOverdue,
} from './types';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props {
  part: 'calculation' | 'gap' | 'plan';
  data: LivingWageData;
  entries: GapEntry[];
  authorization: AuthorizationState;
  filterText?: string;
  datasetLabel?: string;
}

const LW_FONT = 11;   // table text size (px)
const TH = 'border border-black px-2 py-1.5 text-left font-bold bg-gray-50 print:bg-white';
const TD = 'border border-black px-2 py-1.5 align-top';
const wrap: React.CSSProperties = { wordBreak: 'break-word', overflowWrap: 'anywhere' };
const tableStyle: React.CSSProperties = { fontSize: LW_FONT, lineHeight: 1.35, tableLayout: 'fixed' };

const TITLES = {
  calculation: 'Living Wage Calculation Sheet (Anker Methodology)',
  gap: 'Living Wage Gap Analysis (Anker Methodology)',
  plan: 'Living Wage — Management Review and Action Plan',
};

export default function LivingWagePrintView({ part, data, entries, authorization, filterText, datasetLabel }: Props) {
  const calc = computeLivingWage(data);
  const i = calc.inputs;
  const stats = gapStats(entries);
  const depts = departmentSummary(entries);
  const isCalc = data.method === 'calculator';
  const rv = data.managementReview;

  const labelRow = (label: string, value: React.ReactNode, bold = false) => (
    <tr><td className={`${TD} font-bold`} style={{ width: '34%' }}>{label}</td><td className={`${TD} ${bold ? 'font-bold' : ''}`} style={wrap}>{value}</td></tr>
  );

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">

        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{data.factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{data.factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">{TITLES[part]}</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, textAlign: 'left' }}>
              <div>
                <div><strong>Location:</strong> {data.location} &nbsp;|&nbsp; <strong>Study year:</strong> {data.studyYear}</div>
                <div><strong>Method:</strong> {isCalc ? 'Full Calculator' : 'Published Benchmark'}{data.sourceReference ? ` — ${data.sourceReference}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Submission date:</strong> {formatDMY(data.date || todayIso())}</div>
                <div><strong>Living wage:</strong> Tk {money(calc.amount)} / month{part === 'gap' ? <> &nbsp;|&nbsp; <strong>Below:</strong> {stats.below} of {stats.n}</> : null}</div>
              </div>
            </div>
            {part === 'gap' && (
              <div className="text-xs text-gray-600 mt-1" style={{ textAlign: 'left' }}>
                <strong>Compared with:</strong> {datasetLabel || 'Employee Personal File'}{filterText ? ` · ${filterText}` : ''}
              </div>
            )}
          </div>
        </header>

        {/* ── Calculation ──────────────────────────────────────────────── */}
        {part === 'calculation' && (
          <main className="print-body">
            {!isCalc ? (
              <table className="w-full border-collapse border border-black" style={tableStyle}><tbody>
                {labelRow('Published benchmark amount', `Tk ${money(calc.amount)}`, true)}
                {labelRow('Source', data.sourceReference || '—')}
              </tbody></table>
            ) : (
              <>
                <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}><tbody>
                  {labelRow('Input source', i.fromSurvey ? `Worker survey — ${i.n} valid of ${calc.derived.total} entries` : 'Manual entry')}
                  {i.fromSurvey && labelRow('Statistic', `${statisticLabel(data.surveyStatistic)}${data.normalizePerCapita ? ' · per-person costs scaled to family size; housing is a household cost' : ''}`)}
                  {labelRow('Family size / FTE earners per family', `${fmt(i.familySize)} / ${fmt(i.workers)}`)}
                  {labelRow('Contingency margin / payroll deduction', `${i.contingencyPct}% / ${i.deductionPct}%`)}
                </tbody></table>

                <table className="w-full border-collapse border border-black" style={tableStyle}>
                  <colgroup><col style={{ width: '38%' }} /><col style={{ width: '42%' }} /><col style={{ width: '20%' }} /></colgroup>
                  <thead><tr><th className={TH}>Component</th><th className={TH}>Basis</th><th className={TH} style={{ textAlign: 'right' }}>Monthly family cost (Tk)</th></tr></thead>
                  <tbody>
                    {COST_COMPONENTS.map(c => (
                      <tr key={c.key}>
                        <td className={TD}>{c.label}</td>
                        <td className={TD}>{i.fromSurvey ? `${i.counts[c.key]} entries${c.perCapita && data.normalizePerCapita ? ' · per person × family size' : ' · household'}` : 'Manual entry'}</td>
                        <td className={TD} style={{ textAlign: 'right' }}>{money(i.costs[c.key])}</td>
                      </tr>
                    ))}
                    <tr><td className={`${TD} font-bold`} colSpan={2}>Subtotal (food {money(calc.food)} + housing &amp; utilities {money(calc.housingTotal)} + other essentials {money(calc.nfnh)})</td></tr>
                    <tr><td className={TD} colSpan={2}>Contingency margin ({i.contingencyPct}%)</td><td className={TD} style={{ textAlign: 'right' }}>{money(calc.margin)}</td></tr>
                    <tr><td className={`${TD} font-bold`} colSpan={2}>Total family cost</td><td className={`${TD} font-bold`} style={{ textAlign: 'right' }}>{money(calc.totalFamilyCost)}</td></tr>
                    <tr><td className={TD} colSpan={2}>Net living wage per worker (total family cost ÷ {fmt(i.workers)} FTE earners)</td><td className={TD} style={{ textAlign: 'right' }}>{money(calc.net)}</td></tr>
                    <tr><td className={`${TD} font-bold`} colSpan={2}>Gross living wage per worker (net ÷ (1 − {i.deductionPct}%))</td><td className={`${TD} font-bold`} style={{ textAlign: 'right' }}>{money(calc.gross)}</td></tr>
                  </tbody>
                </table>

                {data.surveys.length > 0 && (
                  <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginTop: 10 }}>
                    <thead><tr><th className={TH}>Survey summary ({calc.derived.n} valid entries)</th><th className={TH} style={{ textAlign: 'right' }}>Household {statisticLabel(data.surveyStatistic).toLowerCase()}</th><th className={TH} style={{ textAlign: 'right' }}>Entries</th></tr></thead>
                    <tbody>{COST_COMPONENTS.map(c => (
                      <tr key={c.key}><td className={TD}>{c.label}</td><td className={TD} style={{ textAlign: 'right' }}>{money(calc.derived.costs[c.key].raw)}</td><td className={TD} style={{ textAlign: 'right' }}>{calc.derived.costs[c.key].n}</td></tr>
                    ))}</tbody>
                  </table>
                )}
              </>
            )}
          </main>
        )}

        {/* ── Wage gap ─────────────────────────────────────────────────── */}
        {part === 'gap' && (
          <main className="print-body">
            <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}><tbody>
              {labelRow('Average / median gross salary', `Tk ${money(stats.avgActual)} / Tk ${money(stats.median)}`)}
              {labelRow('Employees below the living wage', `${stats.below} of ${stats.n}${stats.n ? ` (${((stats.below / stats.n) * 100).toFixed(1)}%)` : ''}`, true)}
              {labelRow('Average gap / cost to close the gap per month', `${stats.avgGapPct.toFixed(1)}% / Tk ${money(stats.shortfallTotal)}`)}
            </tbody></table>

            {depts.length > 1 && (
              <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}>
                <thead><tr>{['Department', 'Employees', 'Avg. gross', 'Below', 'Avg. gap'].map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
                <tbody>{depts.map(d => <tr key={d.department}><td className={TD}>{d.department}</td><td className={TD}>{d.count}</td><td className={TD}>{money(d.avgGross)}</td><td className={TD}>{d.below}</td><td className={TD}>{d.avgGapPct.toFixed(1)}%</td></tr>)}</tbody>
              </table>
            )}

            <table className="w-full border-collapse border border-black req-items-table" style={tableStyle}>
              <colgroup>{[4, 9, 18, 16, 15, 11, 11, 16].map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
              <thead><tr>{['SL', 'Card No', 'Name', 'Designation', 'Department', 'Gross salary', 'Living wage', 'Gap / status'].map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {entries.length === 0 && <tr><td colSpan={8} className="border border-black px-2 py-4 text-center text-gray-600">No employee wage data</td></tr>}
                {entries.map(({ emp, gap }, k) => {
                  const r = emp as unknown as Record<string, unknown>;
                  return (
                    <tr key={String(r.id ?? k)} className="req-item-row">
                      <td className={`${TD} text-center`}>{k + 1}</td>
                      <td className={TD} style={wrap}>{String(r.cardNo ?? '') || '—'}</td>
                      <td className={`${TD} font-semibold`} style={wrap}>{empName(emp)}</td>
                      <td className={TD} style={wrap}>{String(r.designation ?? '') || '—'}</td>
                      <td className={TD} style={wrap}>{String(r.department ?? '') || '—'}</td>
                      <td className={TD}>{money(gap.actualWage)}</td>
                      <td className={TD}>{money(gap.livingWage)}</td>
                      <td className={`${TD} font-semibold`}>{gap.gapAmount > 0 ? '−' : '+'}{money(Math.abs(gap.gapAmount))} ({gap.gapPercent.toFixed(1)}%) · {gap.meetsLivingWage ? 'Meets' : 'Below'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </main>
        )}

        {/* ── Plan ─────────────────────────────────────────────────────── */}
        {part === 'plan' && (
          <main className="print-body">
            <table className="w-full border-collapse border border-black" style={{ ...tableStyle, marginBottom: 10 }}><tbody>
              {labelRow('Review date / priority', `${formatDMY(rv.reviewDate) || '—'} / ${rv.priorityLevel}`)}
              {labelRow('Reviewed by', `${rv.reviewedBy || '—'}${rv.reviewedByDesignation ? `, ${rv.reviewedByDesignation}` : ''}`)}
              {labelRow('Summary of findings', rv.summaryOfFindings || '—')}
              {labelRow('Recommendation', rv.recommendation || '—')}
              {labelRow('Management comments', rv.managementComments || '—')}
              {labelRow('Approved by', `${rv.approvedBy || '—'}${rv.approvedByDesignation ? `, ${rv.approvedByDesignation}` : ''}`)}
            </tbody></table>

            <table className="w-full border-collapse border border-black req-items-table" style={{ ...tableStyle, marginBottom: 10 }}>
              <colgroup>{[5, 36, 17, 13, 12, 17].map((w, k) => <col key={k} style={{ width: `${w}%` }} />)}</colgroup>
              <thead><tr>{['SL', 'Action item', 'Responsible person', 'Target date', 'Status', 'Remarks'].map(h => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.correctiveActions.length === 0 && <tr><td colSpan={6} className="border border-black px-2 py-4 text-center text-gray-600">No corrective actions recorded</td></tr>}
                {data.correctiveActions.map((a, k) => (
                  <tr key={k} className="req-item-row">
                    <td className={`${TD} text-center`}>{a.slNo}</td>
                    <td className={TD} style={wrap}>{a.actionItem || '—'}</td>
                    <td className={TD} style={wrap}>{a.responsiblePerson || '—'}</td>
                    <td className={TD}>{formatDMY(a.targetDate) || '—'}{actionOverdue(a) && <div className="font-semibold">Overdue</div>}</td>
                    <td className={`${TD} font-semibold`}>{a.status}</td>
                    <td className={TD} style={wrap}>{a.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="w-full border-collapse border border-black" style={tableStyle}><tbody>
              {labelRow('Commitment statement', data.commitment.statement || '—')}
              {labelRow('Committed by', `${data.commitment.committedBy || '—'}${data.commitment.committedByDesignation ? `, ${data.commitment.committedByDesignation}` : ''}`)}
              {labelRow('Commitment date', formatDMY(data.commitment.commitmentDate) || '—')}
            </tbody></table>
          </main>
        )}

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