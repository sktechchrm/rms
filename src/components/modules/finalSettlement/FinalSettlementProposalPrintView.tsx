// ─────────────────────────────────────────────────────────────────────────────
// FinalSettlementProposalPrintView.tsx — Final Settlement Proposal Sheet (English, A4 landscape) for management.
// Every settlement type has its own column; an employee's net payable is written under his / her type.
// Each row also shows the parts of the payment (last month salary, overtime, earned leave, compensation / gratuity,
// notice pay, others) and Total Payable (A) / Deductions (B). Footer: head-count and totals.
// NO id="printable-area" here — FinalSettlement.tsx wraps it (same as the Statement print view).
// Path: src/components/modules/finalSettlement/FinalSettlementProposalPrintView.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { formatDMY, todayIso, money } from './settlementModel';
import { proposalCols, colKeyOf, proposalTotals, PART_COLS } from './settlementProposal';
import type { ProposalRow } from './settlementProposal';
import { PrintSignatureRow } from '../../common/AuthorizationBlock';
import type { AuthorizationState } from '../../common/AuthorizationBlock';
import { BASE_PRINT_CSS, PAGE_A4_LANDSCAPE } from '../../../utils/printCSS';

interface Props { rows: ProposalRow[]; factoryName: string; factoryAddress: string; authorization: AuthorizationState }

const int = (x: number): string => Math.round(x).toLocaleString('en-US');
const date = (iso: string): string => (iso ? formatDMY(iso) : '—');
const amt = (x: number): string => (x ? money(x) : '—');

export default function FinalSettlementProposalPrintView({ rows, factoryName, factoryAddress, authorization }: Props) {
  const cols = proposalCols(rows);
  const tot = proposalTotals(rows, cols);
  const fixed = [2.2, 10.5, 4.8, 4.8, 5, 3.9];          // SL · Employee · Joining · Last attendance · Service · Gross
  const partW = [4, 3.6, 3.6, 4.2, 3.6, 3.4, 4.4, 3.8];  // PART_COLS widths (A and B slightly wider)
  const typeW = (100 - fixed.reduce((a, b) => a + b, 0) - partW.reduce((a, b) => a + b, 0)) / cols.length;
  const lead = fixed.length;

  return (
    <div className="bg-white max-w-full mx-auto">
      <div className="print-content p-8 print:p-0">
        <header className="print-header">
          <div className="text-center pb-3 border-b-2 border-black company-header">
            <h1 className="text-xl font-bold text-black uppercase tracking-wide company-name">{factoryName || 'FACTORY NAME'}</h1>
            <p className="text-xs text-black company-address">{factoryAddress || 'Factory Address'}</p>
          </div>
          <div className="text-center mt-3 mb-2">
            <h2 className="text-lg font-bold underline decoration-2 underline-offset-2">Final Settlement Proposal Sheet</h2>
            <div className="text-xs text-gray-700 mt-2" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, textAlign: 'left' }}>
              <div><strong>Date:</strong> {formatDMY(todayIso())}</div>
              <div style={{ textAlign: 'right' }}><strong>Employees:</strong> {tot.employees} &nbsp;|&nbsp; <strong>Total Net Payable:</strong> Tk {money(tot.grand)}</div>
            </div>
          </div>
        </header>

        <main className="print-body">
          <table className="fsp-table req-items-table">
            <colgroup>
              {fixed.map((w, k) => <col key={`f${k}`} style={{ width: `${w}%` }} />)}
              {partW.map((w, k) => <col key={`p${k}`} style={{ width: `${w}%` }} />)}
              {cols.map(c => <col key={c.key} style={{ width: `${typeW}%` }} />)}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>SL</th><th rowSpan={2}>Employee</th><th rowSpan={2}>Joining Date</th><th rowSpan={2}>Last Attend.</th><th rowSpan={2}>Service</th><th rowSpan={2}>Gross Salary</th>
                <th colSpan={PART_COLS.length}>Payment Details (Tk)</th>
                <th colSpan={cols.length}>Net Payable by Settlement Type (Tk)</th>
              </tr>
              <tr>
                {PART_COLS.map(p => <th key={p.key} className="fsp-sub">{p.head}</th>)}
                {cols.map(c => <th key={c.key} className="fsp-sub">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={lead + PART_COLS.length + cols.length} className="fsp-empty">No employees for the proposal — add employees in the multi-employee form or import them from Excel.</td></tr>}
              {rows.map((r, i) => {
                const k = colKeyOf(r);
                return (
                  <tr key={r.key || i} className="req-item-row">
                    <td className="fsp-c">{i + 1}</td>
                    <td><div>{r.name}{r.cardNo ? ` (${r.cardNo})` : ''}</div><div className="fsp-mute">{r.designation || '—'}{r.section ? ` · ${r.section}` : ''}</div></td>
                    <td className="fsp-c">{date(r.joining)}</td>
                    <td className="fsp-c">{date(r.lastAttendance)}</td>
                    <td className="fsp-c">{r.service || '—'}</td>
                    <td className="fsp-a">{amt(r.wage)}</td>
                    {PART_COLS.map(p => <td key={p.key} className={`fsp-a${p.key === 'receivable' || p.key === 'deductions' ? ' fsp-b' : ''}`}>{amt(r[p.key])}</td>)}
                    {cols.map(c => <td key={c.key} className="fsp-a fsp-b">{c.key === k ? int(r.net) : ''}</td>)}
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="fsp-foot">
                  <td colSpan={lead + PART_COLS.length} className="fsp-a">No. of employees</td>
                  {cols.map(c => <td key={c.key} className="fsp-c">{tot.count[c.key] || '—'}</td>)}
                </tr>
                <tr className="fsp-foot">
                  <td colSpan={lead} className="fsp-a">Total (Tk)</td>
                  {PART_COLS.map(p => <td key={p.key} className="fsp-a">{amt(tot.parts[p.key])}</td>)}
                  {cols.map(c => <td key={c.key} className="fsp-a">{tot.net[c.key] ? int(tot.net[c.key]) : '—'}</td>)}
                </tr>
                <tr className="fsp-foot">
                  <td colSpan={lead + PART_COLS.length + cols.length} className="fsp-a">Grand Total Net Payable (A − B): Tk {money(tot.grand)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </main>

        <footer className="print-footer mt-10"><PrintSignatureRow value={authorization} lang="en" /></footer>
      </div>

      <style>{`
        ${BASE_PRINT_CSS}
        ${PAGE_A4_LANDSCAPE}
        .fsp-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 7.5px; line-height: 1.35; color: #0f172a; font-variant-numeric: tabular-nums; }
        .fsp-table th, .fsp-table td { border: 0.5px solid #1e293b; padding: 2px 3px; vertical-align: top; font-weight: 400; }
        .fsp-table th { background: #eef2f7; text-align: center; vertical-align: middle; font-weight: 600; font-size: 7.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fsp-table th.fsp-sub { font-size: 6.5px; line-height: 1.2; overflow-wrap: anywhere; padding: 2px 1px; }
        .fsp-table .fsp-c { text-align: center; }
        .fsp-table .fsp-a { text-align: right; white-space: nowrap; }
        .fsp-table .fsp-b { font-weight: 600; }
        .fsp-table .fsp-mute { color: #475569; }
        .fsp-table .fsp-empty { text-align: center; padding: 16px; color: #475569; }
        .fsp-table tr.fsp-foot td { background: #f8fafc; font-weight: 600; border-top: 1.2px solid #0f172a; padding: 3px 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fsp-table thead { display: table-header-group; }
        .fsp-table tr { page-break-inside: avoid; }
      `}</style>
    </div>
  );
}